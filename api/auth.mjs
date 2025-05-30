// 认证相关 API - 只接收POST请求的示例
import { ClassView } from '../lib/classview.mjs';

class AuthView extends ClassView {
  // 只处理 POST 请求 - 用户登录
  async post(request, env, ctx) {
    try {
      const body = await request.json();

      // 验证必需字段
      if (!body.username || !body.password) {
        return new Response(JSON.stringify({
          error: '参数错误',
          message: '用户名和密码是必需的'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 简单的模拟认证逻辑
      if (body.username === 'admin' && body.password === 'password') {
        return {
          message: '登录成功',
          data: {
            token: 'mock-jwt-token-' + Date.now(),
            user: {
              id: 1,
              username: body.username,
              role: 'admin'
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期
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
}

export default AuthView;