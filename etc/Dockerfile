# 使用Node.js 18官方镜像，基于Debian 12 (bookworm)，提供glibc 2.36+
FROM node:18-bookworm

# 设置环境变量避免交互式安装
ENV DEBIAN_FRONTEND=noninteractive

# 安装pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 使用pnpm安装依赖
RUN pnpm install

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 3000 8787

# 默认命令
CMD ["pnpm", "run", "dev"]