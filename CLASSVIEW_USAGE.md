# ClassView 使用指南

## 概述

ClassView 是一个类似 Django class-based view 的功能，用于 Cloudflare Workers 项目。它支持按 HTTP 方法名进行分发，对于不支持的方法会自动返回 405 错误。

## 基本用法

### 1. 创建 ClassView 子类

在 `api/` 文件夹中创建一个继承自 `ClassView` 的类：

```javascript
// api/products.js
import { ClassView } from '../lib/classview.js';

class ProductView extends ClassView {
  // 处理 GET 请求
  async get(request, env, ctx) {
    return {
      message: '产品列表',
      data: [
        { id: 1, name: 'MacBook Pro', price: 15999 }
      ]
    };
  }

  // 处理 POST 请求
  async post(request, env, ctx) {
    const body = await request.json();
    return {
      message: '产品创建成功',
      data: { id: Date.now(), ...body }
    };
  }
}

export default ProductView;
```

### 2. 支持的 HTTP 方法

ClassView 支持以下 HTTP 方法：

- `get(request, env, ctx)` - 处理 GET 请求
- `post(request, env, ctx)` - 处理 POST 请求
- `put(request, env, ctx)` - 处理 PUT 请求
- `patch(request, env, ctx)` - 处理 PATCH 请求
- `delete(request, env, ctx)` - 处理 DELETE 请求
- `head(request, env, ctx)` - 处理 HEAD 请求
- `options(request, env, ctx)` - 处理 OPTIONS 请求

### 3. 自动 405 错误处理

如果客户端使用了类中没有定义的 HTTP 方法，ClassView 会自动返回 405 错误：

```javascript
// 只定义了 POST 方法的控制器
class AuthView extends ClassView {
  async post(request, env, ctx) {
    // 处理登录逻辑
    return { message: '登录成功' };
  }
}

// GET /auth 会返回：
// {
//   "error": "Method Not Allowed",
//   "message": "Method GET is not allowed for this endpoint",
//   "allowed_methods": ["POST", "HEAD", "OPTIONS"]
// }
```

### 4. 默认方法实现

ClassView 提供了一些默认的方法实现：

#### HEAD 方法
如果类中定义了 `get` 方法，`head` 方法会自动返回相同的响应头但没有响应体。

#### OPTIONS 方法
自动返回 `Allow` 头，包含该类支持的所有 HTTP 方法。

### 5. 返回值类型

ClassView 方法可以返回以下类型：

- **对象/数组** - 自动序列化为 JSON
- **字符串** - 返回文本响应
- **Response 对象** - 直接返回（用于自定义状态码和头部）

```javascript
class ExampleView extends ClassView {
  async get(request, env, ctx) {
    // 返回对象 - 自动转为 JSON
    return { message: 'Hello' };
  }

  async post(request, env, ctx) {
    // 返回自定义 Response
    return new Response(JSON.stringify({ error: '无效请求' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## 示例

### 完整的产品管理 API

```javascript
// api/products.js
import { ClassView } from '../lib/classview.js';

class ProductView extends ClassView {
  async get(request, env, ctx) {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || 1;

    return {
      message: '产品列表',
      data: [
        { id: 1, name: 'MacBook Pro', price: 15999 },
        { id: 2, name: 'iPhone 15', price: 7999 }
      ],
      pagination: { page: parseInt(page), total: 2 }
    };
  }

  async post(request, env, ctx) {
    try {
      const body = await request.json();

      if (!body.name || !body.price) {
        return new Response(JSON.stringify({
          error: '参数错误',
          message: '产品名称和价格是必需的'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return {
        message: '产品创建成功',
        data: {
          id: Date.now(),
          name: body.name,
          price: body.price,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return new Response(JSON.stringify({
        error: '请求格式错误',
        message: '请发送有效的JSON数据'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async put(request, env, ctx) {
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');
    const body = await request.json();

    if (!productId) {
      return new Response(JSON.stringify({
        error: '参数错误',
        message: '产品ID是必需的'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return {
      message: '产品更新成功',
      data: {
        id: productId,
        ...body,
        updatedAt: new Date().toISOString()
      }
    };
  }

  async delete(request, env, ctx) {
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return new Response(JSON.stringify({
        error: '参数错误',
        message: '产品ID是必需的'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return {
      message: '产品删除成功',
      data: { id: productId, deletedAt: new Date().toISOString() }
    };
  }
}

export default ProductView;
```

### 只接收 POST 的认证 API

```javascript
// api/auth.js
import { ClassView } from '../lib/classview.js';

class AuthView extends ClassView {
  async post(request, env, ctx) {
    const body = await request.json();

    if (!body.username || !body.password) {
      return new Response(JSON.stringify({
        error: '参数错误',
        message: '用户名和密码是必需的'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.username === 'admin' && body.password === 'password') {
      return {
        message: '登录成功',
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: { id: 1, username: body.username }
        }
      };
    } else {
      return new Response(JSON.stringify({
        error: '认证失败',
        message: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

export default AuthView;
```

## 构建和部署

1. 创建或修改 API 文件后，运行构建脚本：
```bash
node scripts/build-routes.mjs
```

2. 构建脚本会自动检测 ClassView 文件并生成适当的路由配置。

3. 部署到 Cloudflare Workers：
```bash
npm run deploy
```

## 测试

### 测试支持的方法

```bash
# GET 请求
curl https://your-worker.your-subdomain.workers.dev/products

# POST 请求
curl -X POST https://your-worker.your-subdomain.workers.dev/products \
  -H "Content-Type: application/json" \
  -d '{"name":"新产品","price":999}'

# OPTIONS 请求（查看支持的方法）
curl -X OPTIONS https://your-worker.your-subdomain.workers.dev/products
```

### 测试 405 错误

```bash
# 对只支持 POST 的 /auth 端点发送 GET 请求
curl -X GET https://your-worker.your-subdomain.workers.dev/auth

# 响应：
# {
#   "error": "Method Not Allowed",
#   "message": "Method GET is not allowed for this endpoint",
#   "allowed_methods": ["POST", "HEAD", "OPTIONS"]
# }
```

## 特性

- ✅ 自动 HTTP 方法分发
- ✅ 自动 405 错误处理
- ✅ 支持所有标准 HTTP 方法
- ✅ 自动检测和路由生成
- ✅ 默认 HEAD 和 OPTIONS 方法实现
- ✅ 灵活的返回值类型支持
- ✅ 与现有函数式 API 兼容