import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, '../api');
const outputFile = path.join(__dirname, '../routes-index.js');

// 动态检查文件是否导出ClassView子类
async function isClassViewFile(filePath) {
  try {
    // 使用 file:// URL 来导入
    const fileUrl = 'file://' + filePath;

    // 动态导入模块
    const module = await import(fileUrl);
    const exportedClass = module.default || module;

    // 检查是否是类且继承自ClassView
    if (typeof exportedClass === 'function' && exportedClass.prototype) {
      // 导入ClassView来进行比较
      const { ClassView } = await import('../lib/classview.mjs');

      // 检查原型链
      let proto = exportedClass.prototype;
      while (proto) {
        if (proto.constructor === ClassView) {
          return true;
        }
        proto = Object.getPrototypeOf(proto);
        // 避免无限循环
        if (proto === Object.prototype) {
          break;
        }
      }
    }

    return false;
  } catch (err) {
    // 如果导入失败，回退到静态分析
    console.warn(`无法动态检查文件 ${filePath}，回退到静态分析: ${err.message}`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('extends ClassView') ||
             content.includes('ClassView') ||
             content.includes('from ') && content.includes('classview');
    } catch (staticErr) {
      console.warn(`静态分析也失败了: ${staticErr.message}`);
      return false;
    }
  }
}

async function scanApiFiles(dir, basePath = '') {
  const routes = [];

  if (!fs.existsSync(dir)) {
    console.log('API 目录不存在，创建空的路由索引');
    return routes;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 递归扫描子目录
      routes.push(...await scanApiFiles(fullPath, path.join(basePath, file)));
    } else if (file.endsWith('.mjs') || file.endsWith('.js')) {
      // 生成路由路径
      const routePath = path.join(basePath, file.replace(/\.(mjs|js)$/, ''));
      const normalizedPath = '/' + routePath.replace(/\\/g, '/');
      const importPath = './api/' + path.join(basePath, file).replace(/\\/g, '/');

      // 动态检查是否是ClassView文件
      const isClassView = await isClassViewFile(fullPath);

      routes.push({
        path: normalizedPath === '/index' ? '/' : normalizedPath,
        importPath,
        filename: file,
        isClassView
      });
    }
  }

  return routes;
}

// 扫描 API 文件 (现在是异步函数)
const routes = await scanApiFiles(apiDir);

// 生成路由索引文件
const indexContent = `// 自动生成的路由索引文件
// 通过 scripts/build-routes.mjs 生成

import { ClassView } from './lib/classview.mjs';

${routes.map((route, index) => {
  if (route.isClassView) {
    return `import Route${index}Module from '${route.importPath}';`;
  } else {
    return `import route${index} from '${route.importPath}';`;
  }
}).join('\n')}

// ClassView处理器包装函数
function wrapClassView(ViewClass) {
  if (ViewClass.prototype instanceof ClassView || ViewClass === ClassView) {
    const instance = new ViewClass();
    return instance.dispatch;
  }
  return ViewClass;
}

export const routes = [
${routes.map((route, index) => {
  if (route.isClassView) {
    return `  ['${route.path}', wrapClassView(Route${index}Module.default || Route${index}Module)]`;
  } else {
    return `  ['${route.path}', route${index}]`;
  }
}).join(',\n')}
];`;

// 确保输出目录存在
fs.mkdirSync(path.dirname(outputFile), { recursive: true });

// 写入文件
fs.writeFileSync(outputFile, indexContent);

console.log(`已生成路由索引文件: ${outputFile}`);
console.log(`找到 ${routes.length} 个 API 文件:`);
routes.forEach(route => {
  const typeLabel = route.isClassView ? '[ClassView]' : '[Function]';
  console.log(`  ${typeLabel} ${route.path} -> ${route.importPath}`);
});