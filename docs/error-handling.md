# 统一错误处理架构

## 架构设计思路

### 问题分析
之前的架构存在以下问题：
1. 错误处理逻辑分散在多个模块（Router、ClassView、server.mjs）
2. 普通函数无法复用 ClassView 的错误处理方法
3. 代码重复，维护困难
4. ClassView 和 server.mjs 都有 try-catch，造成双重异常处理

### 解决方案
将所有错误处理逻辑统一到 `Router` 模块和 `server.mjs`：

1. **Router 模块**：提供统一的错误响应生成方法
2. **server.mjs**：在最外层统一捕获和处理所有异常
3. **ClassView**：简化为纯逻辑处理，不再有 try-catch
4. **普通函数**：可以选择自己处理错误或让错误向上传播

## 错误处理流程

```
请求 → server.mjs (try-catch) → handler (ClassView/普通函数) → 业务逻辑
                ↓ (如果出错)
            统一错误处理 → 返回标准错误响应
```

## 使用方法

### 1. 在 ClassView 中使用

```javascript
import { ClassView } from '../lib/classview.mjs';
import Router from '../lib/router.mjs';

export default class ProductsView extends ClassView {
  async get(request, env, ctx) {
    // 方式1：直接返回错误响应
    if (someErrorCondition) {
      return Router.badRequestResponse('Invalid parameter');
    }

    // 方式2：抛出错误，由 server.mjs 统一处理
    if (anotherErrorCondition) {
      throw new Error('Something went wrong');
    }

    return { products: [] };
  }
}
```

### 2. 在普通函数中使用

```javascript
import Router from '../lib/router.mjs';

export default function handler(request, env, ctx) {
  // 方式1：自己处理错误
  if (request.method !== 'GET') {
    return Router.methodNotAllowedResponse(request, ['GET']);
  }

  // 方式2：让错误向上传播（推荐用于意外错误）
  // 如果这里出错，会被 server.mjs 捕获
  const data = JSON.parse(request.body); // 可能抛出错误

  return { data: 'success' };
}
```

## 可用的错误响应方法

### Router 静态方法

- `Router.notFoundResponse(message?)` - 404 Not Found
- `Router.methodNotAllowedResponse(request, allowedMethods?)` - 405 Method Not Allowed
- `Router.badRequestResponse(message?)` - 400 Bad Request
- `Router.unauthorizedResponse(message?)` - 401 Unauthorized
- `Router.forbiddenResponse(message?)` - 403 Forbidden
- `Router.internalServerErrorResponse(message?)` - 500 Internal Server Error
- `Router.createErrorResponse(statusCode, error, message, extra?)` - 自定义错误响应

### ClassView 实例方法（向后兼容）

- `this.notFound(request, env, ctx, message?)`
- `this.methodNotAllowed(request, env, ctx)`
- `this.badRequest(request, env, ctx, message?)`
- `this.unauthorized(request, env, ctx, message?)`
- `this.forbidden(request, env, ctx, message?)`
- `this.internalServerError(request, env, ctx, message?)`

## 响应格式

所有错误响应都遵循统一格式：

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "allowed_methods": ["GET", "POST"]  // 仅在 405 错误时包含
}
```

## 优势

1. **统一标准**：所有 API 返回相同格式的错误响应
2. **易于使用**：普通函数和 ClassView 都能轻松使用
3. **易于维护**：错误处理逻辑集中管理
4. **向后兼容**：现有的 ClassView 代码无需修改
5. **扩展性强**：可以轻松添加新的错误类型