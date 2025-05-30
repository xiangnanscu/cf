local request = require "xodel.request"
local utils = require "xodel.utils"
local isarray = require "table.isarray"
local encode = require "cjson.safe".encode
local trace_back = debug.traceback
local ngx = ngx
local ngx_header = ngx.header
local ngx_print = ngx.print
local ngx_var = ngx.var
local string_format = string.format

local function set_error_log_callback(message, status, ErrorLog)
  if type(message) == 'table' then
    message = encode(message) or "error when encoding error_message"
  end
  local data = {
    message = tostring(message),
    status = tostring(status),
    url = ngx_var.document_uri,
    remote_addr = ngx_var.remote_addr,
    request_method = ngx_var.request_method,
    request_uri = ngx_var.request_uri:sub(1, 255),
    bytes_sent = ngx_var.bytes_sent,
    http_user_agent = ngx_var.http_user_agent,
    http_referer = ngx_var.http_referer,
    request_time = ngx_var.request_time,
  }
  ngx.ctx.log_by_lua_callback = function()
    local ok, res = pcall(function() ErrorLog:save(data) end)
    if not ok then loger(res) end
  end
end
local AppMeta = {}
local App = setmetatable({}, AppMeta)
App.error_status = 512
App.__index = App
function App.new(cls, opts)
  return setmetatable({ router = opts.router, models = opts.models }, cls)
end

function App.__call(self, path)
  -- App '/foo' (function ... end)
  -- App '/bar' {method='get', handler=function ... end}
  local function bind_route_to_path(route)
    if utils.callable(route) then
      self.router:insert { path, route }
    elseif type(route) == 'table' then
      local nroute = { path, route.handler, route.method }
      self.router:insert(nroute)
    else
      error("route should be a function or table, not " .. type(route))
    end
  end

  return bind_route_to_path
end

local function uni_error_wrapper(resp, status)
  if ngx_var.http_uni_request ~= 'on' then
    return resp, status
  else
    -- 为了统一uni的h5端和wp端表单错误的处理方式, 统一将状态码设定为200
    return { type = "uni_error", status = status, data = resp }, 200
  end
end
function App.error_response(self, message, status)
  local origin_message = message
  message, status = uni_error_wrapper(message, status or self.error_status)
  ngx.status = status
  if type(message) == 'table' then
    message = encode(message) or "error when encoding error response"
    ngx_header.content_type = 'application/json; charset=utf-8'
  else
    ngx_header.content_type = 'text/plain; charset=utf-8'
  end
  set_error_log_callback(origin_message, status, self.ErrorLogModel)
  return ngx_print(message)
end

function App.dispatch_response(self, resp, status, req)
  status = status or 200
  if status > 399 then
    resp, status = uni_error_wrapper(resp, status)
  end
  local resp_type = type(resp)
  if resp_type == 'table' or resp_type == 'boolean' or resp_type == 'number' then
    local json, err = encode(resp)
    if not json then
      return self:error_response("error when encoding response: " .. err)
    else
      ngx.status = status
      if req.response_cache_seconds then
        ngx_header.cache_control = 'max-age=' .. req.response_cache_seconds
      else
        ngx_header.cache_control = 'no-store'
      end
      ngx_header.content_type = 'application/json; charset=utf-8'
      return ngx_print(json)
    end
  elseif resp_type == 'string' then
    ngx.status = status
    if req.response_cache_seconds then
      ngx_header.cache_control = 'max-age=' .. req.response_cache_seconds
    else
      ngx_header.cache_control = 'no-store'
    end
    if resp:sub(1, 1) == '<' then
      ngx_header.content_type = 'text/html; charset=utf-8'
    else
      ngx_header.content_type = 'text/plain; charset=utf-8'
    end
    return ngx_print(resp)
  else
    return self:error_response('invalid response type: ' .. resp_type)
  end
end

local function is_model_error(err)
  return type(err) == 'table' and (err.type == 'field_error' or err.type == 'field_error_batch')
end

local function is_handled_error(err)
  return type(err) == 'table' and #err == 1 and type(err[1]) == 'string'
end

function App.dispatch(self, uri, method)
  local handler, params_or_error, route_error_status = self.router:match(uri, method)
  if handler then
    local req = request:new {
      app = self,
      params = params_or_error,
      uri = uri,
      method = method,
    }
    local ok, resp, err, status = xpcall(handler, trace_back, req)
    if not ok then
      if is_model_error(resp) then
        return self:dispatch_response(resp, 422, req)
      elseif is_handled_error(resp) then
        return self:dispatch_response(resp[1], 512, req)
      else
        return self:error_response(resp)
      end
    elseif resp == nil then
      if is_model_error(err) then
        return self:dispatch_response(err, 422, req)
      else
        return self:dispatch_response(err, status or 500, req)
      end
    elseif type(resp) == 'function' then
      -- custom callback, skip the dispatch_response logic
      -- such as you want return json string as json response directly
      ok, resp, err, status = xpcall(resp, trace_back, req)
      if not ok then
        return self:error_response('unhandled error in callback response: ' .. tostring(resp))
      else
        return 1
      end
    else
      ok, err = xpcall(req.set_cookie_if_needed, trace_back, req)
      if not ok then
        return self:error_response("error when saving response cookies: " .. tostring(err))
      end
      return self:dispatch_response(resp, 200, req)
    end
  elseif params_or_error then
    return self:error_response(params_or_error, route_error_status or self.error_status)
  else
    -- shouldn't reach here
    return self:error_response("unexpected error when matching route")
  end
end

return App
