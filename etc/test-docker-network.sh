#!/bin/bash

echo "=== Docker网络与sshuttle测试 ==="

echo "1. 测试WSL2主机网络..."
echo "主机IP："
curl -s --connect-timeout 5 ifconfig.me || echo "无法获取外部IP"

echo -e "\n2. 测试Docker容器网络..."

# 运行一个临时容器来测试网络
docker run --rm alpine:latest sh -c "
    echo '容器内IP检测:'
    apk add --no-cache curl >/dev/null 2>&1
    curl -s --connect-timeout 5 ifconfig.me || echo '无法获取外部IP'

    echo -e '\n容器内DNS解析:'
    nslookup registry.npmjs.org || echo 'DNS解析失败'

    echo -e '\n容器网络接口:'
    ip route show
" 2>/dev/null

echo -e "\n3. 比较结果..."
echo "如果两个IP相同，说明Docker使用了sshuttle"
echo "如果不同，说明Docker有独立的网络路径"

echo -e "\n4. 检查Docker网络配置..."
docker network ls

echo -e "\n5. 查看Docker daemon配置..."
docker info | grep -A 5 -B 5 "HTTP Proxy\|HTTPS Proxy\|Registry"