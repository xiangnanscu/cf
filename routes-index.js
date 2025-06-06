// 自动生成的路由索引文件
// 通过 scripts/build-routes.mjs 生成

import { ClassView } from './lib/classview.mjs';

import Route0Module from './api/auth.mjs';
import route1 from './api/orders/list.mjs';
import Route2Module from './api/products.mjs';
import route3 from './api/users.mjs';

// ClassView处理器包装函数
function wrapClassView(ViewClass) {
  if (ViewClass.prototype instanceof ClassView || ViewClass === ClassView) {
    // 返回一个工厂函数，每次调用时创建新实例，确保并发安全
    return async (request, env, ctx) => {
      const instance = new ViewClass();
      return await instance.dispatch(request, env, ctx);
    };
  }
  return ViewClass;
}

export const routes = [
  ['/auth', wrapClassView(Route0Module.default || Route0Module)],
  ['/orders/list', route1],
  ['/products', wrapClassView(Route2Module.default || Route2Module)],
  ['/users', route3]
];