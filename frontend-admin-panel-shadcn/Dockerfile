# 多阶段构建：构建阶段
FROM node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件（利用 Docker 缓存层）
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# 安装 pnpm（如果使用 pnpm）
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile || npm ci

# 复制源代码
COPY . .

# 构建参数：API 基础 URL
# 在 Docker 环境中使用空字符串，通过 Nginx 代理访问后端
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建生产版本
RUN pnpm build || npm run build

# 运行阶段：使用 Nginx
FROM nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

