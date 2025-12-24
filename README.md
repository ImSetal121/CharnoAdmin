# Charno Admin

一个基于 Spring Boot 和 React 的现代化管理系统核心框架，采用模块化架构设计，支持上下游仓库模式，便于定制开发。

## 📋 项目简介

Charno Admin 是一个**上游仓库**，维护系统核心模块，提供稳定的基础功能。下游仓库可以基于此仓库进行业务定制开发，通过新建独立模块实现定制功能，而无需修改核心模块。

### 核心特性

- 🏗️ **模块化架构**：清晰的核心模块划分，便于维护和扩展
- 🔒 **安全认证**：完整的身份验证和权限管理系统
- ⚡ **响应式编程**：基于 R2DBC 的响应式数据库访问
- 🎨 **现代化前端**：React 19 + Vite + shadcn/ui + Tailwind CSS
- 📦 **上下游模式**：支持核心模块统一维护，定制模块独立开发
- 🐳 **容器化部署**：完整的 Docker 支持

## 🏗️ 项目架构

### 核心模块

#### 后端模块

| 模块 | 说明 |
|------|------|
| `backend-common-redis` | Redis 通用模块，提供缓存功能 |
| `backend-common-security` | 安全认证模块，提供身份验证和权限管理 |
| `backend-common-web` | Web 通用模块，提供统一的响应格式和异常处理 |
| `backend-start` | 启动模块，应用入口和配置 |
| `backend-system` | 系统业务模块，提供系统管理功能 |
| `backend-system-entity` | 系统实体模块，定义系统核心实体类 |

#### 前端模块

| 模块 | 说明 |
|------|------|
| `frontend-admin-panel-shadcn` | 管理端前端，基于 React + Vite + shadcn/ui |

### 项目结构

```
CharnoAdmin/
├── backend-common-redis/          # Redis 通用模块
├── backend-common-security/       # 安全认证模块
├── backend-common-web/            # Web 通用模块
├── backend-start/                 # 启动模块
├── backend-system/                # 系统业务模块
├── backend-system-entity/         # 系统实体模块
├── frontend-admin-panel-shadcn/   # 管理端前端
├── prompt/                         # 面向Agent等开发规范提示词
│   ├── 上下游仓库规范.md
│   ├── 业务层规范.md
│   ├── 控制层规范.md
│   ├── 持久层规范.md
│   ├── 前端API规范.md
│   ├── 前端管理页面规范.md
│   └── 身份验证设计.md
├── docker-compose.yml              # Docker Compose 配置
└── pom.xml                         # Maven 父级 POM
```

## 🚀 快速开始

### 环境要求

- **Java**: 25
- **Node.js**: 18+ (推荐使用 pnpm)
- **Maven**: 3.8+
- **Docker & Docker Compose**: 最新版本
- **PostgreSQL**: 16+ (或使用 Docker)
- **Redis**: 7+ (或使用 Docker)

### 使用 Docker Compose（推荐）

1. **克隆仓库**

```bash
git clone <repository-url>
cd CharnoAdmin
```

2. **启动服务**

```bash
docker-compose up -d
```

这将启动以下服务：
- PostgreSQL 数据库（端口 5432）
- Redis 缓存（端口 6379）
- 后端服务（端口 8080）
- 前端服务（端口 80）

3. **访问应用**

- 前端管理界面：http://localhost
- 后端 API：http://localhost:8080

### 本地开发

#### 后端开发

1. **启动数据库服务**

```bash
docker-compose up -d postgres redis
```

2. **配置数据库连接**

编辑 `backend-start/src/main/resources/application.properties`，配置数据库连接信息。

3. **运行后端**

```bash
cd backend-start
mvn spring-boot:run
```

#### 前端开发

1. **安装依赖**

```bash
cd frontend-admin-panel-shadcn
pnpm install
```

2. **启动开发服务器**

```bash
pnpm dev
```

前端开发服务器将在 http://localhost:5173 启动。

## 📚 面向Agent等开发规范提示词

项目包含完整的开发规范提示词文档，位于 `prompt/` 目录。这些文档专为 AI Agent、代码生成工具等自动化开发工具设计，提供结构化的开发规范和最佳实践指导：

- **[上下游仓库规范](./prompt/上下游仓库规范.md)**：上下游仓库模式规范，指导如何基于上游仓库进行定制开发
- **[业务层规范](./prompt/业务层规范.md)**：Service 层开发规范，包含标准模板和最佳实践
- **[控制层规范](./prompt/控制层规范.md)**：Controller 层开发规范，包含路由、权限、响应格式等规范
- **[持久层规范](./prompt/持久层规范.md)**：Repository 层开发规范，包含 R2DBC 使用规范
- **[前端API规范](./prompt/前端API规范.md)**：前端 API 调用规范，包含请求封装、错误处理等
- **[前端管理页面规范](./prompt/前端管理页面规范.md)**：前端页面开发规范，包含组件使用、页面结构等
- **[身份验证设计](./prompt/身份验证设计.md)**：身份验证系统设计文档，包含认证流程和权限控制
- **[模块注册放行接口规范](./prompt/模块注册放行接口规范.md)**：模块注册放行路径规范，说明如何使用 PermitAllPathProvider 接口

> 💡 **提示**：这些规范文档可作为 AI Agent、代码生成工具、IDE 插件等自动化工具的提示词（Prompt），帮助工具理解项目架构和开发规范，生成符合项目标准的代码。

## 🔧 技术栈

### 后端

- **框架**: Spring Boot 3.5.8
- **语言**: Java 25
- **数据库**: PostgreSQL 16
- **响应式数据库**: R2DBC
- **缓存**: Redis 7
- **构建工具**: Maven
- **其他**: Lombok, Jackson

### 前端

- **框架**: React 19
- **构建工具**: Vite 7
- **语言**: TypeScript 5.9
- **UI 组件库**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **路由**: React Router 7
- **表单**: React Hook Form + Zod
- **状态管理**: React Hooks
- **包管理**: pnpm

## 🏛️ 上下游仓库模式

### 上游仓库（本仓库）

**职责**：
- 维护系统核心模块
- 提供稳定的基础功能
- 保持向后兼容性
- 不包含业务定制逻辑

**核心模块**：
- 所有 `backend-common-*` 和 `backend-system-*` 模块
- `frontend-admin-panel-shadcn` 管理端前端

### 下游仓库

**职责**：
- 基于上游仓库进行业务定制开发
- 通过新建独立模块实现定制功能
- 不直接修改上游核心模块

**定制开发**：
- **后端**：按业务领域创建 `backend-custom-{业务名}` 模块
- **前端管理端**：在 `frontend-admin-panel-shadcn` 中新增页面和组件
- **前端非管理端**：可新建独立前端模块（客户端、移动端等）

详细规范请参考 [上下游仓库规范](./prompt/上下游仓库规范.md)。

## 📦 模块说明

### backend-common-redis

Redis 通用模块，提供缓存功能封装。

### backend-common-security

安全认证模块，提供：
- 身份验证
- 权限管理
- JWT Token 处理
- 角色权限校验

### backend-common-web

Web 通用模块，提供：
- 统一响应格式
- 全局异常处理
- 请求响应拦截

### backend-start

应用启动模块，包含：
- 应用入口
- 配置文件
- 模块依赖整合

### backend-system

系统业务模块，提供系统管理功能：
- 用户管理
- 角色管理
- 权限管理
- 其他系统核心功能

### backend-system-entity

系统实体模块，定义系统核心实体类。

### frontend-admin-panel-shadcn

管理端前端，提供：
- 系统管理界面
- 用户管理界面
- 角色权限管理界面
- 可扩展的页面和组件结构

## 🛠️ 构建和部署

### 后端构建

```bash
mvn clean package
```

构建产物位于各模块的 `target/` 目录。

### 前端构建

```bash
cd frontend-admin-panel-shadcn
pnpm build
```

构建产物位于 `dist/` 目录。

### Docker 部署

使用 Docker Compose 一键部署：

```bash
docker-compose up -d
```

## 📝 开发指南

### 创建定制模块

1. **后端定制模块**

按业务领域创建模块，例如：

```
backend-custom-order/
├── src/main/java/org/charno/custom/order/
│   ├── entity/              # 订单实体类
│   ├── repository/          # 订单 Repository
│   ├── service/             # 订单 Service
│   └── controller/          # 订单 Controller
└── pom.xml
```

2. **前端定制**

- **管理端**：在 `frontend-admin-panel-shadcn/src/pages/` 中新增页面
- **非管理端**：可新建独立前端模块

详细规范请参考 [上下游仓库规范](./prompt/上下游仓库规范.md)。

## 🤝 贡献指南

### 向上游贡献

1. 评估功能的通用性
2. 移除业务定制逻辑
3. 遵循项目代码规范
4. 提交 Pull Request

### 代码规范

- 遵循项目中的开发规范提示词文档
- 保持代码风格一致
- 编写必要的测试用例
- 更新相关文档

> 💡 **AI Agent 使用**：开发规范提示词文档可直接作为 AI Agent 的系统提示词，确保生成的代码符合项目标准。

## 📄 许可证

查看 [LICENSE](./LICENSE) 文件了解详情。

## 🔗 相关链接

- [开发规范提示词文档](./prompt/) - 面向 AI Agent 等自动化工具的开发规范
- [Spring Boot 文档](https://spring.io/projects/spring-boot)
- [React 文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

## 📞 支持

如有问题或建议，请提交 Issue 或联系项目维护者。

---

**注意**：这是一个上游仓库，主要用于维护系统核心模块。如需进行业务定制开发，请参考 [上下游仓库规范](./prompt/上下游仓库规范.md) 创建下游仓库。
