# Docker环境设置说明

## 问题描述
Wrangler 4.x需要更高版本的glibc，而Ubuntu 20.04的glibc版本太低，导致运行失败。

## 解决方案

### 方案1：使用Docker（推荐）

1. **在Windows上启用Docker Desktop**
   - 安装Docker Desktop for Windows
   - 确保WSL2集成已启用
   - 在WSL2中应该能够使用docker命令

2. **运行项目**
   ```bash
   # 使用提供的启动脚本
   ./start.sh

   # 或者手动运行
   docker build -t cf-workers .
   docker run -it --rm -p 3000:3000 -p 8787:8787 -v "$(pwd)":/app cf-workers
   ```

### 方案2：使用docker-compose

```bash
# 如果有docker-compose
docker-compose up --build
```

### 方案3：升级系统glibc（不推荐）

如果必须在本地运行，可以尝试：

```bash
# 检查当前glibc版本
ldd --version

# 使用更新的Node.js版本和wrangler
npm install -g pnpm
pnpm install
pnpm run dev
```

## Docker配置说明

- **基础镜像**: Ubuntu 22.04 (提供glibc 2.35+)
- **Node.js版本**: 18.x
- **包管理器**: pnpm
- **端口映射**: 3000, 8787
- **卷挂载**: 项目目录、node_modules、pnpm-store

## 文件结构

```
├── Dockerfile          # Ubuntu 22.04 + Node.js 18 + pnpm
├── docker-compose.yml  # 容器编排配置
├── start.sh           # 智能启动脚本
├── lib/               # 转换后的JS文件
├── lua2js/            # 原始Lua文件
└── server/            # wrangler入口点（符号链接）
```

## 故障排除

1. **Docker不可用**: 启动脚本会自动回退到本地环境
2. **端口冲突**: 修改docker-compose.yml中的端口映射
3. **权限问题**: 确保start.sh有执行权限 (`chmod +x start.sh`)