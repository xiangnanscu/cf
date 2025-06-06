local bit = bit
local ngx_re_match = ngx.re.match
local gmatch = string.gmatch
local ipairs = ipairs
local tonumber = tonumber
local byte = string.byte

local method_bitmask = {
  GET = 1,       -- 2^0
  POST = 2,      -- 2^1
  PATCH = 4,     -- 2^2
  PUT = 8,       -- 2^3
  DELETE = 16,   -- 2^4
  HEAD = 32,     -- 2^5
  OPTIONS = 64,  -- 2^6
  CONNECT = 128, -- 2^7
}
local dynamic_sign = {
  [35] = true, --#
  [58] = true, --:
  [60] = true, --<
  [42] = true, --*
}
local function methods_to_bitmask(methods)
  local bitmask = 0
  for _, method in ipairs(methods) do
    bitmask = bit.bor(bitmask, method_bitmask[method:upper()])
  end
  return bitmask
end

local function is_static_path(path)
  for part in gmatch(path, "[^/]+") do
    if dynamic_sign[byte(part)] then
      return false
    end
  end
  return true
end

local function _set_match_methods(tree)
  if not tree.children then
    return
  end
  local methods = {}
  -- group keys for matching priority, i.e: /v1/#age, /v1/<version>\\d+-\\d+, /v1/:name, /v1/*path
  local number_methods = {}
  local regex_methods = {}
  local char_methods = {}
  local fallback_methods = {}
  for key, child in pairs(tree.children) do
    local pkey = key:sub(2)
    local bkey = byte(key)
    if bkey == 35 then -- 35 is ASCII value of '#'
      number_methods[#number_methods + 1] = function(node, part, params)
        local n = tonumber(part)
        if n then
          params[pkey] = n
          return node.children[key]
        end
      end
    elseif bkey == 60 then -- 60 is ASCII value of '<'
      local pair_index = key:find('>', 1, true)
      local regex = key:sub(pair_index + 1)
      local regex_key = key:sub(2, pair_index - 1)
      regex_methods[#regex_methods + 1] = function(node, part, params)
        local m = ngx_re_match(part, regex, 'josui')
        if m then
          params[regex_key] = m[0]
          return node.children[key]
        end
      end
    elseif bkey == 58 then -- 58 is ASCII value of ':'
      char_methods[#char_methods + 1] = function(node, part, params)
        params[pkey] = part
        return node.children[key]
      end
    elseif bkey == 42 then -- 42 is ASCII value of '*'
      tree.match_rest = true
      fallback_methods[#fallback_methods + 1] = function(node, part, params)
        params[pkey] = part
        return node.children[key]
      end
    end
    _set_match_methods(child)
  end
  for _, groups in ipairs({ number_methods, regex_methods, char_methods, fallback_methods }) do
    for _, key in ipairs(groups) do
      methods[#methods + 1] = key
    end
  end
  if #methods > 0 then
    if #methods == 1 then
      tree.match_keys = methods[1]
    else
      tree.match_keys = function(node, part, params)
        for _, func in ipairs(methods) do
          local child = func(node, part, params)
          if child then
            return child
          end
        end
      end
    end
  end
end

---@alias Route {[1]:string|string[], [2]:function|string, [3]?:string|string[]}

---@class Router
---@field handler function|string|table
---@field match_keys? function
---@field children? {string:Router}
---@field methods? number
---@field match_rest? boolean
local Router = { method_bitmask = method_bitmask }
Router.__index = Router

function Router:new()
  return setmetatable({ children = {} }, Router)
end

function Router:is_handler(handler)
  if type(handler) == 'function' or type(handler) == 'string' then
    return true
  end
  if type(handler) ~= 'table' then
    return nil, 'route handler should be a function or string or table, not ' .. type(handler)
  end
  local meta = getmetatable(handler)
  if not meta or not meta.__call then
    return nil, 'route handler is not a callable table'
  end
  return true
end

function Router:is_route(view)
  if type(view) ~= 'table' then
    return nil, "route must be a table"
  end
  if type(view[1]) == 'table' then
    if #view[1] == 0 then
      return nil, "if the first element of route is a table, it can't be empty"
    end
    for _, p in ipairs(view[1]) do
      if type(p) ~= 'string' then
        return nil, "the path should be a string, not " .. type(p)
      end
    end
  elseif type(view[1]) ~= 'string' then
    return nil, 'the first element of route should be a string or table, not ' .. type(view[1])
  end
  if view[3] ~= nil then
    if type(view[3]) == 'string' then
      if not method_bitmask[view[3]:upper()] then
        return nil, 'invalid http method: ' .. view[3]
      end
    elseif type(view[3]) == 'table' then
      for _, method in ipairs(view[3]) do
        if type(method) ~= 'string' then
          return nil, 'the methods table should contain string only, not ' .. type(method)
        end
        if not method_bitmask[method:upper()] then
          return nil, 'invalid http method: ' .. method
        end
      end
    else
      return nil, 'the method should be a string or table, not ' .. type(view[3])
    end
  end
  return self:is_handler(view[2])
end

---init a router with routes
---@param routes Route[]
---@return Router
function Router:create(routes)
  local tree = Router:new()
  for _, route in ipairs(routes) do
    assert(self:is_route(route))
    local path = route[1]
    if type(path) == 'string' then
      tree:_insert(path, route[2], route[3])
    else
      for _, p in ipairs(path) do
        tree:_insert(p, route[2], route[3])
      end
    end
  end
  _set_match_methods(tree)
  return tree
end

---@param path string|table
---@param handler function|string
---@param methods? string|string[]
---@return Router
function Router:insert(path, handler, methods)
  if type(path) == 'table' then
    if handler == nil then
      assert(self:is_route(path))
      return self:insert(unpack(path))
    else
      local node
      for _, p in ipairs(path) do
        node = self:insert(p, handler, methods)
      end
      return node
    end
  else
    assert(self:is_route { path, handler, methods })
    local node = self:_insert(path, handler, methods)
    _set_match_methods(self)
    return node
  end
end

function Router:post(path, handler)
  return self:insert(path, handler, 'post')
end

function Router:get(path, handler)
  return self:insert(path, handler, 'GET')
end

---@param path string
---@param handler function|string
---@param methods? string|string[]
---@return Router
function Router:_insert(path, handler, methods)
  local node = self
  if is_static_path(path) then
    node[path] = {}
    node = node[path]
  else
    local parts = {}
    for part in gmatch(path, "[^/]+") do
      parts[#parts + 1] = part
    end
    for i, part in ipairs(parts) do
      if not node.children then
        node.children = {}
      end
      if not node.children[part] then
        ---@diagnostic disable-next-line: missing-fields
        node.children[part] = {}
      end
      node = node.children[part]
      -- 检查是否是 '*' 通配符
      if part:sub(1, 1) == '*' then
        assert(i == #parts, 'Catch-all routes are only supported as the last part of the path')
        break
      end
    end
  end
  node.handler = assert(handler, 'you must provide a handler')
  if type(methods) == 'string' then
    node.methods = bit.bor(0, method_bitmask[methods:upper()])
  elseif type(methods) == 'table' then
    node.methods = methods_to_bitmask(methods)
  end
  return node
end

---match a http request
---@param path string
---@param method string
---@return function|string|table, {[string]: string|number}?
---@overload fun(string, string): nil, string, number
function Router:match(path, method)
  local params
  -- first try static match
  local node = self[path]
  if not node then
    node = self
    local cut = 1
    for part in gmatch(path, "[^/]+") do
      if node.children and node.children[part] then
        node = node.children[part]
      elseif node.match_keys then
        if not params then
          params = {}
        end
        if not node.match_rest then
          node = node:match_keys(part, params)
          if not node then
            return nil, 'page not found', 404
          end
        else
          node = node:match_keys(path:sub(cut), params)
          if not node then
            return nil, 'page not found', 404
          else
            break
          end
        end
      else
        return nil, 'page not found', 404
      end
      cut = cut + #part + 1
    end
  end
  if not node.handler then
    -- defined /update/#id, but match /update
    return nil, 'page not found', 404
  end
  if not node.methods then
    return node.handler, params
  end
  local method_bit = method_bitmask[method]
  if bit.band(node.methods, method_bit) ~= 0 then
    return node.handler, params
  else
    return nil, 'method not allowed', 405
  end
end

return Router
