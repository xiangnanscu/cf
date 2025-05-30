// 产品相关 API - 使用 ClassView 演示
import { ClassView } from '../lib/classview.js';

class ProductView extends ClassView {
  // 处理 GET 请求 - 获取产品列表
  async get(request, env, ctx) {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || 1;
    const limit = url.searchParams.get('limit') || 10;

    return {
      message: '产品列表',
      data: {
        products: [
          { id: 1, name: 'MacBook Pro', price: 15999, category: '电脑' },
          { id: 2, name: 'iPhone 15', price: 7999, category: '手机' },
          { id: 3, name: 'AirPods Pro', price: 1999, category: '耳机' }
        ],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 3
        }
      }
    };
  }

  // 处理 POST 请求 - 创建新产品
  async post(request, env, ctx) {
    try {
      const body = await request.json();

      // 验证必需字段
      if (!body.name || !body.price) {
        return new Response(JSON.stringify({
          error: '参数错误',
          message: '产品名称和价格是必需的'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 模拟创建产品
      const newProduct = {
        id: Date.now(), // 简单的ID生成
        name: body.name,
        price: body.price,
        category: body.category || '未分类',
        createdAt: new Date().toISOString()
      };

      return {
        message: '产品创建成功',
        data: newProduct
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

  // 处理 PUT 请求 - 更新产品
  async put(request, env, ctx) {
    try {
      const body = await request.json();
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
        message: '产品更新成功',
        data: {
          id: productId,
          ...body,
          updatedAt: new Date().toISOString()
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

  // 处理 DELETE 请求 - 删除产品
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
      data: {
        id: productId,
        deletedAt: new Date().toISOString()
      }
    };
  }
}

export default ProductView;