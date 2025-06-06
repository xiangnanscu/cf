# Docker与sshuttle网络分析

## 🔍 测试结果分析

### 观察到的现象：
- **WSL2主机**: 能够通过sshuttle正常访问外网 (IP: 47.242.232.190)
- **Docker容器**: 无法访问外网，DNS解析失败
- **网络隔离**: Docker容器使用独立的网络 (172.17.0.0/16)

## 📋 结论

**Docker容器默认不会使用sshuttle网络**，原因：

1. **网络命名空间隔离**: Docker容器有独立的网络栈
2. **iptables规则**: sshuttle的iptables规则可能不适用于Docker bridge网络
3. **DNS配置**: 容器的DNS配置与主机不同

## 🔧 解决方案

### 方案1：让Docker使用宿主机网络

```bash
# 使用 --network=host 让容器共享主机网络
docker run --rm --network=host \
    -v "$(pwd)":/app \
    -w /app \
    node:18-bookworm \
    bash -c "
        npm install -g pnpm
        pnpm install
        pnpm run dev
    "
```

### 方案2：配置Docker使用sshuttle代理

```bash
# 设置Docker daemon代理
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf > /dev/null <<EOF
[Service]
Environment="HTTP_PROXY=socks5://127.0.0.1:1080"
Environment="HTTPS_PROXY=socks5://127.0.0.1:1080"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 方案3：在容器内配置代理（推荐）

创建一个智能的run脚本：

```bash
#!/bin/bash
# run-with-sshuttle.sh

# 获取WSL2主机IP
HOST_IP=$(ip route | grep default | awk '{print $3}')

docker run --rm -it \
    --add-host=host.docker.internal:$HOST_IP \
    --dns=8.8.8.8 \
    --dns=8.8.4.4 \
    -p 8787:8787 \
    -v "$(pwd)":/app \
    -w /app \
    node:18-bookworm \
    bash -c "
        # 设置代理环境变量（如果需要）
        export HTTP_PROXY=http://host.docker.internal:8080
        export HTTPS_PROXY=http://host.docker.internal:8080

        echo '安装pnpm...'
        npm install -g pnpm --registry=https://registry.npmmirror.com

        echo '安装依赖...'
        pnpm install --registry=https://registry.npmmirror.com

        echo '启动开发服务器...'
        pnpm run dev
    "
```

## 🚀 推荐的解决方案

基于您的情况，我建议使用**方案1（--network=host）**，因为：

1. **简单直接**: 让Docker容器直接使用主机网络
2. **完全兼容**: 容器会自动使用sshuttle
3. **无需额外配置**: 不需要配置代理设置

## ⚠️ 注意事项

使用 `--network=host` 时：
- 容器直接使用主机网络接口
- 端口映射不再需要（-p参数无效）
- 安全性略有降低（网络隔离减少）

## 🔄 更新的启动脚本

我会更新 `run-with-docker.sh` 来使用主机网络模式。