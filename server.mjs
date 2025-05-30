import Router from './lib/router.mjs';
// 导入自动生成的路由
import { routes } from './routes-index.js';


function dispatchResponse(resp, status = 200) {
  const respType = typeof resp;

  if (respType === 'object' && resp !== null || respType === 'boolean' || respType === 'number') {
    // 对于对象、布尔值或数字，编码为JSON
    let json;
    try {
      json = JSON.stringify(resp);
    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Error when encoding response',
        message: err.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return new Response(json, {
      status: status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } else if (respType === 'string') {
    // 对于字符串，根据内容设置适当的Content-Type
    const contentType = resp.startsWith('<')
      ? 'text/html; charset=utf-8'
      : 'text/plain; charset=utf-8';

    return new Response(resp, {
      status: status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
      }
    });
  } else {
    // 其他类型返回错误
    return new Response(JSON.stringify({
      error: 'Invalid response type',
      type: respType
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// 创建应用实例
const router = Router.create(routes);

// 添加一个简单的路由用于测试
router.insert(['/', () => {
  return { message: 'Hello from Cloudflare Workers!', timestamp: new Date().toISOString() };
}]);

router.insert(['/health', () => {
  return { status: 'ok', service: 'cf-workers' };
}]);

// Cloudflare Workers fetch事件处理器
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      const { handler, params } = router.match(path, method);
      const result = await handler(request, env, ctx);

      // 如果result已经是Response实例，直接返回
      if (result instanceof Response) {
        return result;
      }

      // 根据result类型进行处理，参照app.lua的dispatch_response逻辑
      return dispatchResponse(result, 200);

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};