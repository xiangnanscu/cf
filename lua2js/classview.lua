local select = select
local utils = require "xodel.utils"
local getenv = require "xodel.utils".getenv
local Model = require "xodel.model"
local Array = require("xodel.array")
local token = Model.token
local format = string.format
local ngx = ngx

local GOD_PERMISSION = tonumber(getenv('GOD_PERMISSION') or 9)
local env = getenv()

local function request_call(view, request, ...)
  local method = request.method:lower()
  if not view[method] then
    return nil, 'method not allowed', 405
  else
    local self, err, err_status = view:new { request = request }
    if not self then
      return nil, err, err_status
    end
    if view.init then
      local _, err, err_status = view.init(self, request, ...)
      if err then
        return nil, err, err_status
      end
    end
    return view[method](self, request, ...)
  end
end

local INHERIT_METHODS = {
  new = true,
  __index = true,
  __newindex = true,
  __call = true,
  __tostring = true
}
local function class_new(cls, self)
  return setmetatable(self or {}, cls)
end

local function class__call(cls, attrs)
  local self = cls:new()
  self:init(attrs)
  return self
end

local function class__init(self, attrs)

end

---make a class with methods: __index, __call, class, new
---@param cls table
---@param parent table
---@return table
local function class(cls, parent)
  setmetatable(cls, parent)
  for method, _ in pairs(INHERIT_METHODS) do
    if cls[method] == nil and parent[method] ~= nil then
      cls[method] = parent[method]
    end
  end
  function cls:class(subcls)
    return class(subcls, self)
  end

  cls.new = cls.new or class_new
  cls.init = cls.init or class__init
  cls.__call = cls.__call or class__call
  cls.__index = cls
  if cls.atomic then
    local HTTP_METHODS = {
      "get",
      "post",
      "put",
      "delete",
      "patch",
    }
    for _, method in ipairs(HTTP_METHODS) do
      local func = cls[method]
      if func then
        cls[method] = function(self, request)
          return Model:transaction(function()
            return func(self, request)
          end)
        end
      end
    end
  end
  if cls.model then
    cls.model_json = cls.model:to_json()
  end
  return cls
end

---@class ClassView
---@field model Xodel
---@field model_json ModelOpts
---@field models {[string]:Xodel}
---@field roles table
---@field session_require? boolean
---@field user_require? boolean
---@field no_roles? boolean
---@field admin_require? boolean
---@field god_require? boolean
---@field realtime_roles? string[]
---@field session_roles? string[]
---@field user UserInstance
---@field request Request
---@field detail_names string[] select names for detail view
---@field list_names string[] select names for list view
---@field records_names string[] select names for records view
---@field related_label_names string[] select names of fk labels
---@field admin_clone_names string[] names of model.admin that is cloned from classview to json, default: { 'list_names', 'records_names','detail_names', 'form_names' }
---@field class fun(cls:ClassView, attrs:table):ClassView
---@field sql_pre_hook? fun(self:ClassView, sql:Sql):Sql
---@field sql_post_hook? fun(self:ClassView, sql:Sql):Sql
---@field choices_order table|string
---@field records_order table|string
---@field detail_key string
---@field detail_param_key string
---@field records_filter table
---@field filter? fun(self:ClassView):table
local ClassView = class({
  records_order = '-id',
  detail_key = 'id',
  detail_param_key = 'id',
  admin_clone_names = { 'list_names', 'records_names', 'detail_names', 'form_names' },
}, { __call = request_call })


function ClassView.class(cls, subcls)
  return class(subcls, cls)
end

---@param cls ClassView
---@param self ClassView
function ClassView.new(cls, self)
  setmetatable(self, cls)
  local key = cls.session_require
  if type(key) == 'string' then
    self[key] = self.request.session[key]
    if not self[key] then
      return nil, format("session %s required", key), 403
    end
  elseif type(key) == 'function' then
    local ok, err, status = key(self.request.session)
    if not ok then
      return nil, err or "session test failed", status or 403
    end
  end
  if cls.user_require == false or cls.no_roles then
    return self
  end
  if cls.user_require or cls.admin_require or cls.god_require or cls.roles or cls.session_roles or cls.realtime_roles then
    self.user = self.request.session.user
    if not self.user then
      return nil, env.INSUFFICIENT_PERMISSION_TEXT, 403
    end
  end
  if cls.admin_require and self.user.permission < 1 then
    return nil, env.INSUFFICIENT_PERMISSION_TEXT, 403
  end
  if cls.god_require and self.user.permission ~= GOD_PERMISSION then
    return nil, env.INSUFFICIENT_PERMISSION_TEXT, 403
  end
  local roles = cls.roles or cls.realtime_roles
  if roles then
    self.roles = self:get_roles(self.user.id, #roles > 0 and roles or nil)
    local find = false
    for i, role_name in ipairs(roles) do
      if self.roles[role_name] then
        find = true
      end
    end
    if not find and #roles > 0 then
      return nil, "角色权限不足"
    end
  end
  if cls.session_roles then
    self.roles = self.request.session.roles
    if not self.roles then
      return nil, "角色权限不足"
    end
    local find = false
    for i, role_name in ipairs(cls.session_roles) do
      if self.roles[role_name] then
        find = true
      end
    end
    if not find then
      return nil, "角色权限不足"
    end
  end
  return self
end

---base sql builder
---@param self ClassView
---@return Sql
function ClassView.get_base_sql(self)
  local sql = self.model:create_sql()
  if self.sql_pre_hook then
    self:sql_pre_hook(sql)
  end
  if self.model.fields.ctime then
    sql:select('ctime')
  end
  if self.model.primary_key then
    sql:select(self.model.primary_key)
  end
  local query = self.request.query
  local select_columns = query['select[]'] or query.select
  if select_columns then
    sql:select(select_columns)
  end
  sql:select_related_labels(self.related_label_names)
  if self.filter then
    sql:where(self:filter())
  end
  if self.sql_post_hook then
    self:sql_post_hook(sql)
  end
  return sql
end

function ClassView.post_data_hook(self, data)
  return data
end

local function get_roles_tables(models)
  local tables = {}
  for _, model in pairs(models) do
    if model.fields.user_id and model.fields.status then
      tables[#tables + 1] = model.table_name
    end
  end
  return tables
end

function ClassView.get_roles(self, user_id, tables)
  local models = self.models
  tables = tables or get_roles_tables(models)
  local cond = { user_id = user_id, status = '通过' }
  local first_model = models[tables[1]]
  local role_query = first_model:select_related_labels():select('status', 'id'):where(cond)
  for i = 2, #tables do
    local role_model = models[tables[i]]
    role_query:append(role_model:select_related_labels():select('status', 'id'):where(cond))
  end
  local roles, num_queries = role_query:return_all():exec()
  if num_queries == 1 then
    -- [
    --   {
    --     id        : 1,
    --     status    : "通过",
    --     user_id    : 5,
    --     user_id__full_name: "xx",
    --   },
    -- ]
    if first_model.fields.user_id.unique then
      return { [tables[1]] = roles[1] }
    elseif #roles > 0 then
      return { [tables[1]] = roles }
    end
  else
    local res = {}
    for i, role_name in ipairs(tables) do
      local role = roles[i]
      local model = models[role_name]
      if model.fields.user_id.unique then
        res[role_name] = role[1]
      elseif #role > 0 then
        res[role_name] = Array(role)
      end
    end
    return res
  end
end

function ClassView.get_records_sql(self, kwargs)
  local query = self.request.query
  local pagesize = tonumber(query.pagesize or 0)
  local page = tonumber(query.page or 1)
  local keyword_cond = utils.get_query_condition(query)
  local data = self.request.data
  local data_cond = self:post_data_hook(data)
  local cond = utils.dict(self.records_filter, keyword_cond, data_cond or data, kwargs)
  local records_names
  if self.records_names then
    records_names = self.records_names
  elseif self.list_names then
    records_names = self.list_names
  elseif self.model.admin and self.model.admin.records_names then
    records_names = self.model.admin.records_names
  elseif self.model.admin and self.model.admin.list_names then
    records_names = self.model.admin.list_names
  else
    records_names = self.model.field_names
  end
  local records_sql = self:get_base_sql():select(records_names):where(cond):order(self.records_order)
  if query.limit then
    records_sql:limit(query.limit)
  end
  if pagesize ~= 0 then
    records_sql:limit(pagesize):offset((page - 1) * pagesize)
  end
  return records_sql
end

---@param kwargs? table
function ClassView:get_choices_sql(kwargs)
  local request = self.request
  local query = request.get_uri_args()
  local value_field = self.model.fields[query.value]
  if not value_field then
    error("invalid value field name: " .. tostring(query.value))
  end
  -- label_name could be like: fk1__fk2__name, so can't simply use model.fields[label_name]
  local label_name = query.label or query.value
  local choices_sql = self.model:select_as(query.value, 'value'):select_as(label_name, 'label')
  if query.keyword and query.keyword ~= "" then
    choices_sql:where { [label_name .. '__contains'] = query.keyword }
  end
  if kwargs then
    choices_sql:where(kwargs)
  end
  if self.choices_order then
    choices_sql:order(self.choices_order)
  end
  return choices_sql
end

function ClassView.as_page_json(self, records)
  local total
  if records[1] then
    total = records[1].__total
    for i, row in ipairs(records) do
      row.__total = nil
    end
  else
    total = 0
  end
  return { records = records, total = total }
end

local COUNT_TOTAL = token('COUNT(*) OVER() as __total')
function ClassView.as_page_view(self, request)
  local records_sql = self:get_records_sql():select(COUNT_TOTAL)
  local records = records_sql:execr()
  return self:as_page_json(records)
end

function ClassView.as_records_view(self, request)
  return self:get_records_sql():execr()
end

function ClassView.get_record(self)
  local id = assert(self.request.params[self.detail_param_key or 'id'])
  local detail_names
  if self.detail_names then
    detail_names = self.detail_names
  elseif self.model.admin and self.model.admin.detail_names then
    detail_names = self.model.admin.detail_names
  else
    detail_names = self.model.field_names
  end
  local ins = self:get_base_sql():where { [self.detail_key or 'id'] = id }:select(detail_names):try_get()
  if not ins then
    return error { "无此记录" }
  end
  return ins
end

function ClassView.as_delete_view(self, request)
  local delete_sql = self.model:delete { id = request.params.id }
  if self.sql_post_hook then
    return self:sql_post_hook(delete_sql):execr()
  end
  return delete_sql:execr()
end

return ClassView
