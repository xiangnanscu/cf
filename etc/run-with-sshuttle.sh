#!/bin/bash

echo "启动Cloudflare Workers项目（Docker + sshuttle）..."

# 检查Docker是否运行
if ! docker info >/dev/null 2>&1; then
    echo "错误：Docker未运行，请启动Docker服务"
    echo "运行: service docker start"
    exit 1
fi

# 检查sshuttle是否运行
if ! pgrep -f sshuttle >/dev/null 2>&1; then
    echo "警告：sshuttle似乎没有运行"
    echo "如果需要代理，请先启动sshuttle"
fi

echo "使用主机网络模式运行Docker容器（兼容sshuttle）..."

# 使用 --network=host 让容器共享主机网络，这样会自动使用sshuttle
docker run -it --rm \
    --network=host \
    -v "$(pwd)":/app \
    -w /app \
    --name cf-workers \
    node:18-bookworm \
    bash -c "
        echo '=== 网络测试 ==='
        echo '检查网络连接...'
        curl -s --connect-timeout 5 ifconfig.me || echo '无法获取外部IP'

        echo -e '\n=== 安装依赖 ==='
        echo '安装pnpm...'
        npm install -g pnpm --registry=https://registry.npmmirror.com

        echo '安装项目依赖...'
        pnpm install --registry=https://registry.npmmirror.com

        echo '检查glibc版本...'
        ldd --version | head -1

        echo -e '\n=== 启动服务 ==='
        echo '启动开发服务器...'
        echo '项目将在 http://localhost:8787 启动'
        pnpm run dev
    "