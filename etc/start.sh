#!/bin/bash

echo "检查Docker环境..."

# 检查Docker是否可用
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "Docker可用，使用Docker环境运行..."

    # 构建镜像
    echo "构建Docker镜像..."
    docker build -t cf-workers .

    # 运行容器
    echo "启动容器..."
    docker run -it --rm \
        --network=host \
        -p 3000:3000 \
        -p 8787:8787 \
        -v "$(pwd)":/app \
        -v /app/node_modules \
        -v /app/.pnpm-store \
        cf-workers

elif command -v docker-compose &> /dev/null; then
    echo "使用docker-compose运行..."
    docker-compose up --build

else
    echo "Docker不可用，使用本地环境..."
    echo "注意：这可能会遇到glibc版本问题"

    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "安装pnpm..."
        npm install -g pnpm
    fi

    # 创建server目录和链接
    mkdir -p server
    ln -sf ../lib/index.js server/index.js

    # 安装依赖
    echo "安装依赖..."
    pnpm install

    # 启动开发服务器
    echo "启动开发服务器..."
    pnpm run dev
fi