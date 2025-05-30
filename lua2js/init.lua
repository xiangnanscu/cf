local lfs = require "syscall.lfs"
local template = require "resty.template"
local utils = require("xodel.utils")
local array = require("xodel.array")
local repr = require("xodel.repr")
local Router = require("xodel.router")
local Model = require("xodel.model")

local LOG_FILE
local function log(s)
  if not LOG_FILE then
    LOG_FILE = assert(io.open('APP_INIT.log', 'w'))
  end
  if type(s) == 'table' then
    s = repr(s)
  end
  LOG_FILE:write(s .. '\n')
end

local function close_log()
  if LOG_FILE then
    LOG_FILE:close()
    LOG_FILE = nil
  end
end


local function collect_lua_modules(dir, callback, result)
  for _, file_path in ipairs(utils.files(dir)) do
    log('FILE: ' .. file_path) -- file_path: ./api/xx.lua
    local path_table = utils.split_path(file_path)
    -- log(path_table) -- path_table: {'.', 'api', 'xx.lua'}
    local fullname = path_table[#path_table] or ''
    local filename, ext = utils.split_filename_extension(fullname)
    local module, require_path;
    if '.lua' == ext then
      path_table[#path_table] = filename
      require_path = path_table:slice(2):join('.')
      module = require(require_path)
    end
    -- dir => ./models/foo.lua
    callback {
      result = result,
      filename = filename,         -- foo
      ext = ext,                   -- lua
      path_table = path_table,     -- {'foo'}
      module = module,
      require_path = require_path, -- models.foo
    }
  end
  return result
end

---collect models
---@param opts {result:{string:Xodel}, module:Xodel, filename:string}
local function collect_model_callback(opts)
  local models = opts.result
  local model = opts.module
  if type(model) == 'function' then
    model = model(opts.filename)
  end
  if Model:is_model_class(model) then
    if not model.table_name then
      model:materialize_with_table_name { table_name = utils.camel_to_snake(opts.filename) }
    end
    if not model.class_name then
      model.class_name = opts.filename
    end
    models[model.table_name] = model
    -- models[opts.filename] = model
  elseif type(model) == 'table' then
    for model_name, model_value in pairs(model) do
      collect_model_callback { module = model_value, filename = model_name, result = models }
    end
  else
    error(string.format("invalid model %s, type:%s", model, type(model)))
  end
end

local function transform_params_from_file_name(url)
  return url:gsub('%[(%w+)%]', ':%1')
end

---collect api
---@param opts {result:{string:function}, module:function|table, path_table:table}
local function collect_controller_callback(opts)
  local controller = opts.module
  local routes = opts.result
  local url = '/' .. opts.path_table:slice(3):join('/')
  url = transform_params_from_file_name(url)
  if utils.callable(controller) then
    -- one file one controller, extract url from path
    routes[#routes + 1] = { url, controller }
  elseif type(controller) == 'table' then
    if Router:is_route(controller) then
      -- one file one builder, standard url builder
      routes[#routes + 1] = controller
    else
      for path, builder in pairs(controller) do
        if type(path) == 'number' then
          -- grouping routes by array
          builder = {
            builder.path or builder[1],
            builder.handler or builder[2],
            builder.method or builder[3],
          }
          local ok, err = Router:is_route(builder)
          if not ok then
            error(string.format('%s:%s %s', url, path, err))
          end
          path = builder[1]
          local handler = builder[2]
          local method = builder[3]
          if builder[1] == '' then
            path = url
          elseif path:sub(1, 1) ~= '/' then
            path = url .. '/' .. path
          end
          routes[#routes + 1] = { path, handler, method }
        else
          -- grouping routes by hash_table
          assert(utils.callable(builder),
            string.format("%s: when grouping routes by hash_table, handler must be callable, not %s (key: %s).",
              url, type(builder), path))
          assert(type(path) == 'string', "path must be string, but now is:" .. type(path))
          if path == '' then
            path = url
          elseif path:sub(1, 1) ~= '/' then
            -- assert(path:sub(1, 1) ~= '/', 'grouping routes should not begin with /, but now it is: ' .. path)
            path = url .. '/' .. path
          end
          routes[#routes + 1] = { path, builder }
        end
      end
    end
  else
    error(string.format("invalid route type: url(%s) %s (%s)", url, type(controller), controller))
  end
end

local function collect_page_callback(opts)
  local path_table = opts.path_table
  local result = opts.result
  local layout_path = opts.layout_path
  local template_lsp = template.new({ root = opts.path })
  local context_path_table = path_table:slice(1, -3) + array { 'api', opts.filename .. '.lua' }
  local context_file = context_path_table:join('/')
  local lsp_path = '/' .. path_table:slice(3):join('/')
  local lsp_view
  if utils.file_exists(context_file) then
    local require_path = context_path_table:slice(2):join('.'):sub(1, -5)
    local context_handler = require(require_path)
    function lsp_view(req)
      local context, err = context_handler(req)
      if context ~= nil then
        assert(type(context) == 'table', 'context type should be table')
        context.request = req
      elseif err ~= nil then
        context = { request = req, err = err }
      else
        return nil, "some error happened in context_handler"
      end
      return template_lsp.new(lsp_path, layout_path):process(context)
    end
  else
    function lsp_view(req)
      return template_lsp.new(lsp_path, layout_path):process { request = req }
    end
  end
  result[#result + 1] = { lsp_path, lsp_view }
end

local function collect_models(models, dir)
  models = models or {}
  if not dir then
    collect_lua_modules('./models', collect_model_callback, models)
    collect_model_callback { module = require("models"), result = models, filename = 'models' }
  else
    collect_lua_modules(dir, collect_model_callback, models)
  end
  return models
end

local function collect_api(api, dir)
  api = api or {}
  collect_lua_modules(dir or './api', collect_controller_callback, api)
  return api
end

local function collect(opts)
  opts = opts or { collect_api = true }
  local models = setmetatable({}, {
    __newindex = function(t, k, v)
      rawset(t, k, v)
      log(string.format("  MODEL %s", k))
    end
  })
  collect_models(models)
  local models_json = {}
  for key, model in pairs(models) do
    models_json[key] = model:to_json()
  end
  local api = setmetatable({}, {
    __newindex = function(t, k, v)
      rawset(t, k, v)
      local method
      if getmetatable(v[2]) then
        method = {}
        for m, bit in pairs(Router.method_bitmask) do
          if rawget(v[2], m:lower()) then
            method[#method + 1] = m
          end
        end
        method = table.concat(method, ',')
      else
        method = (v[3] or 'ALL'):upper()
      end
      log(string.format("  %s %s", method, v[1]))
    end
  })
  if opts.collect_api then
    collect_api(api)
  end
  -- local pages = array {}
  -- collect_lua_modules {
  --   result = array {},
  --   path = './pages',
  --   extension = '.lsp',
  --   callback = collect_page_callback,
  --   layout_path = '_layout.html',
  -- }
  local fs_router = Router:create(api)
  close_log()
  return { router = fs_router, models = models, models_json = models_json }
end

local function safe_collect(opts)
  local ok, app = pcall(collect, opts)
  close_log()
  if not ok then
    -- local env = utils.getenv()
    local function init_error_view()
      return function()
        local hint = string.format("unhandled error during init_by_lua:\n\n%s", app)
        -- if env.NODE_ENV == 'development' then
        --   hint = string.format("%s\n\nenvironment:\n\n%s", hint, repr(env))
        -- end
        ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
        ngx.header.content_type = 'text/plain; charset=utf-8'
        ngx.print(hint)
      end
    end
    local error_on_init_router = Router:new()
    ---@diagnostic disable-next-line: duplicate-set-field
    error_on_init_router.match = function()
      ---@diagnostic disable-next-line: missing-return-value
      return init_error_view
    end
    log("app init failed: " .. app)
    return { router = error_on_init_router, models = {}, error = app }
  else
    return app
  end
end

local main = setmetatable({
  collect_models = collect_models,
  collect_api = collect_api,
}, {
  __call = function(t, opts)
    return collect(opts)
  end
})

return main
