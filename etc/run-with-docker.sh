#!/bin/bash

echo "启动Cloudflare Workers项目（Docker方式）..."

# 检查Docker是否运行
if ! docker info >/dev/null 2>&1; then
    echo "错误：Docker未运行，请启动Docker服务"
    echo "运行: service docker start"
    exit 1
fi

# 使用官方Node.js镜像直接运行
echo "使用Node.js 18镜像运行项目..."

docker run -it --rm \
    -p 3000:3000 \
    -p 8787:8787 \
    -v "$(pwd)":/app \
    -w /app \
    --name cf-workers \
    node:18-bookworm \
    bash -c "
        echo '安装pnpm...'
        npm install -g pnpm --registry=https://registry.npmmirror.com

        echo '安装项目依赖...'
        pnpm install --registry=https://registry.npmmirror.com

        echo '检查glibc版本...'
        ldd --version

        echo '启动开发服务器...'
        pnpm run dev
    "