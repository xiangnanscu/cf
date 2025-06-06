import { NotFoundError, MethodNotAllowedError } from './router.mjs';

export class ClassView {

  static ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  static NotFoundError = NotFoundError;
  static MethodNotAllowedError = MethodNotAllowedError;

  constructor() {
    this.dispatch = this.dispatch.bind(this);
  }

  async dispatch(request, env, ctx) {
    try {
      const method = request.method.toUpperCase();
      const methodName = method.toLowerCase();
      if (typeof this[methodName] === 'function') {
        return await this[methodName](request, env, ctx);
      } else {
        return this.methodNotAllowed(request, env, ctx);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        return this.notFound(request, env, ctx, error.message);
      } else if (error instanceof MethodNotAllowedError) {
        return this.methodNotAllowed(request, env, ctx);
      } else {
        return this.internalServerError(request, env, ctx, error.message);
      }
    }
  }

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

  notFound(request, env, ctx, message = 'Not Found') {
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: message
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  internalServerError(request, env, ctx, message = 'An unexpected error occurred') {
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

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

  async head(request, env, ctx) {
    if (typeof this.get === 'function') {
      const response = await this.get(request, env, ctx);
      if (response instanceof Response) {
        return new Response(null, {
          status: response.status,
          headers: response.headers
        });
      }
    }
    return this.methodNotAllowed(request, env, ctx);
  }

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


export default ClassView;