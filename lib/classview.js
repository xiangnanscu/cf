// ClassView 基类 - 类似Django的class-based view
// 支持按HTTP方法分发，不支持的方法返回405错误

export class ClassView {
  // HTTP方法的映射
  static ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  constructor() {
    // 自动绑定方法，确保this指向正确
    this.dispatch = this.dispatch.bind(this);
  }

  // 主要的分发方法
  async dispatch(request, env, ctx) {
    const method = request.method.toUpperCase();

    // 检查是否有对应的方法
    const methodName = method.toLowerCase();

    if (typeof this[methodName] === 'function') {
      // 调用对应的HTTP方法处理器
      return await this[methodName](request, env, ctx);
    } else {
      // 如果没有对应的方法，返回405错误
      return this.methodNotAllowed(request, env, ctx);
    }
  }

  // 默认的405错误处理
  methodNotAllowed(request, env, ctx) {
    const allowedMethods = this.getAllowedMethods();
    return new Response(JSON.stringify({
      error: 'Method Not Allowed',
      message: `Method ${request.method} is not allowed for this endpoint`,
      allowed_methods: allowedMethods
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': allowedMethods.join(', ')
      }
    });
  }

  // 获取当前类支持的HTTP方法列表
  getAllowedMethods() {
    const methods = [];
    for (const method of ClassView.ALLOWED_METHODS) {
      const methodName = method.toLowerCase();
      if (typeof this[methodName] === 'function') {
        methods.push(method);
      }
    }
    return methods;
  }

  // 可选的HEAD方法默认实现（如果有GET方法的话）
  async head(request, env, ctx) {
    if (typeof this.get === 'function') {
      const response = await this.get(request, env, ctx);
      if (response instanceof Response) {
        // 返回相同的headers但没有body
        return new Response(null, {
          status: response.status,
          headers: response.headers
        });
      }
    }
    return this.methodNotAllowed(request, env, ctx);
  }

  // 可选的OPTIONS方法默认实现
  async options(request, env, ctx) {
    const allowedMethods = this.getAllowedMethods();
    return new Response(null, {
      status: 200,
      headers: {
        'Allow': allowedMethods.join(', '),
        'Content-Length': '0'
      }
    });
  }
}

// 示例用法类
export class UserView extends ClassView {
  async post(request, env, ctx) {
    return { message: 'Hello from POST method!', method: 'POST' };
  }

  async get(request, env, ctx) {
    return { message: 'Hello from GET method!', method: 'GET' };
  }
}

export default ClassView;