# Cloudflare Workers 项目

## GLIBC兼容性解决方案 ✅ 已解决

由于Ubuntu 20.04使用GLIBC 2.31，而新版本的Cloudflare Wrangler (3.105.1+) 需要GLIBC 2.32+，我们使用了以下解决方案：

### ✅ 当前解决方案：使用Wrangler 3.105.0

我们固定使用Wrangler 3.105.0版本，这是最后一个兼容Ubuntu 20.04的版本。

```bash
# 安装特定版本的Wrangler
npm install wrangler@3.105.0

# 使用npx运行wrangler命令
npx wrangler --version
# 输出: ⛅️ wrangler 3.105.0

# 运行开发服务器
npx wrangler dev
# 或者使用npm脚本
npm run dev

# 部署到Cloudflare
npx wrangler deploy
# 或者使用npm脚本
npm run deploy
```

### 系统信息

- ✅ 操作系统: Ubuntu 20.04 (WSL2)
- ✅ GLIBC版本: 2.31
- ✅ Node.js版本: >= 16.0.0
- ✅ Wrangler版本: 3.105.0 (固定，已测试可用)

### 常用命令

```bash
# 查看版本
npx wrangler --version

# 查看帮助
npx wrangler --help

# 初始化新项目
npx wrangler init

# 本地开发
npx wrangler dev

# 部署到生产环境
npx wrangler deploy

# 查看日志
npx wrangler tail

# 管理KV存储
npx wrangler kv --help

# 管理D1数据库
npx wrangler d1 --help
```

### 替代解决方案

如果需要使用最新版本的Wrangler，可以考虑：

1. **升级到Ubuntu 22.04+** (推荐长期解决方案)
2. **使用Docker容器** (已提供Dockerfile)
3. **使用GitHub Codespaces** (需要配置更新的镜像)

### Docker使用方法

```bash
# 构建镜像
docker-compose build

# 运行开发环境
docker-compose up

# 进入容器
docker-compose exec nuxt-app bash
```

### 注意事项

- ✅ 使用固定版本可能会错过一些新功能和安全更新
- ⚠️ 建议在条件允许时升级到更新的操作系统
- 📅 定期检查Cloudflare的兼容性更新

### lua2js转换

项目包含lua到JavaScript的转换功能：
- `lua2js/` 文件夹：存放原始lua文件
- `lib/` 文件夹：存放转换后的ES6 JavaScript文件
- 错误处理：lua的错误处理方式会转换为try-catch语句
- 命名风格：保持下划线风格的命名方式

### 故障排除

如果遇到GLIBC错误：
```
/lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.32' not found
```

解决方案：
1. 确保使用Wrangler 3.105.0版本
2. 删除node_modules并重新安装：`rm -rf node_modules && npm install`
3. 使用Docker环境（如果需要最新版本）
