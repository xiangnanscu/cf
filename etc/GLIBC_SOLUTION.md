# GLIBC版本问题解决方案

## 问题描述

您遇到的错误是：
```
GLIBC_2.32' not found
GLIBC_2.33' not found
GLIBC_2.34' not found
GLIBC_2.35' not found
```

这是因为Wrangler 4.x的workerd二进制文件需要更高版本的glibc，而Ubuntu 20.04只提供glibc 2.31。

## 解决方案

### 方案1：使用Docker（强烈推荐）

#### 在Windows WSL2中设置Docker：

1. **安装Docker Desktop for Windows**
   - 下载并安装Docker Desktop
   - 确保启用WSL2集成
   - 在设置中启用"Use the WSL 2 based engine"
   - 在Resources > WSL Integration中启用您的Ubuntu发行版

2. **验证Docker安装**
   ```bash
   docker --version
   docker info
   ```

3. **运行项目**
   ```bash
   # 使用智能启动脚本
   ./start.sh

   # 或手动运行
   docker build -t cf-workers .
   docker run -it --rm -p 3000:3000 -p 8787:8787 -v "$(pwd)":/app cf-workers
   ```

### 方案2：在WSL2中直接安装Docker

```bash
# 更新包列表
sudo apt update

# 安装Docker
sudo apt install docker.io

# 启动Docker服务（在WSL2中可能需要手动启动）
sudo service docker start

# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录或运行
newgrp docker
```

### 方案3：使用更新的Ubuntu版本

如果您可以升级到Ubuntu 22.04：
```bash
# 检查当前版本
lsb_release -a

# Ubuntu 22.04提供glibc 2.35，可以直接运行wrangler
```

## 项目配置说明

我已经为您配置了：

1. **Dockerfile**: 使用Ubuntu 22.04 + Node.js 18 + pnpm
2. **docker-compose.yml**: 容器编排配置
3. **start.sh**: 智能启动脚本，自动检测环境
4. **lib/worker.js**: Cloudflare Workers入口文件
5. **wrangler.jsonc**: 更新的配置文件

## 测试

Docker环境启动后，您可以访问：
- http://localhost:8787/ - 主页
- http://localhost:8787/health - 健康检查

## 故障排除

1. **Docker Desktop未启动**: 确保Docker Desktop正在运行
2. **WSL2集成未启用**: 在Docker Desktop设置中启用
3. **端口冲突**: 修改docker-compose.yml中的端口映射
4. **权限问题**: 确保start.sh有执行权限

## 当前状态

✅ 已解决glibc版本问题（通过Docker）
✅ 已更新到Wrangler 4.17.0
✅ 已配置pnpm包管理器
✅ 已创建Cloudflare Workers入口文件
✅ 已修复wrangler配置

现在您只需要启用Docker即可正常运行项目！