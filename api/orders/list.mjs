// 订单列表 API
import Router from '../../lib/router.mjs';

export default function handler(request, env, ctx) {
  try {
    // 示例：检查请求方法
    if (request.method !== 'GET') {
      return Router.methodNotAllowedResponse(request, ['GET']);
    }

    // 示例：检查认证（模拟）
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return Router.unauthorizedResponse('Missing Authorization header');
    }

    const orders = [
      { id: 1, user_id: 1, product: '商品A', amount: 99.99, status: '已完成' },
      { id: 2, user_id: 2, product: '商品B', amount: 149.99, status: '处理中' }
    ];

    return {
      message: 'Orders list',
      orders,
      total: orders.length
    };
  } catch (error) {
    // 统一的错误处理
    return Router.internalServerErrorResponse(error.message);
  }
}