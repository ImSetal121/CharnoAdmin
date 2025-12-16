# 前端 API 开发规范

## 核心原则

**前端 API 文件负责封装后端接口调用，提供类型安全的 API 函数。所有 API 文件应遵循统一的文件结构和命名规范，确保与后端控制器一一对应。**

## 文件结构规范

### 目录结构

**根据后端包名创建文件夹，文件夹下封装该包内的控制层接口。**

```
src/api/
├── index.ts                    # API 统一导出
└── {包名}/                      # 对应后端 org.charno.{包名}.controller 包
    ├── index.ts                # 包内 API 统一导出
    ├── {Controller名}.ts       # 对应后端 {Controller名}Controller
    └── ...
```

### 示例结构

**后端包结构：**
```
org.charno.system.controller
├── LoginController
├── LogoutController
├── AdminSysUserController
└── AdminSysRoleController
```

**前端 API 结构：**
```
src/api/
├── index.ts
└── system/                      # 对应 org.charno.system.controller
    ├── index.ts
    ├── Login.ts                 # 对应 LoginController
    ├── Logout.ts                # 对应 LogoutController
    ├── AdminSysUser.ts          # 对应 AdminSysUserController
    └── AdminSysRole.ts          # 对应 AdminSysRoleController
```

## 命名规范

### 文件夹命名

- **使用后端包名**：文件夹名对应后端 `org.charno.{包名}.controller` 中的 `{包名}`
- **小写字母**：文件夹名使用小写字母
- **示例**：`system`、`common`、`business`

### 文件命名

- **去除 Controller 后缀**：文件名对应后端控制器类名，但去除 `Controller` 后缀
- **PascalCase**：文件名使用 PascalCase（首字母大写）
- **一个文件对应一个控制器**：每个 API 文件只封装一个后端控制器的接口

**命名对照表：**

| 后端控制器 | 前端 API 文件 |
|----------|-------------|
| `LoginController` | `Login.ts` |
| `LogoutController` | `Logout.ts` |
| `AdminSysUserController` | `AdminSysUser.ts` |
| `AdminSysRoleController` | `AdminSysRole.ts` |

### 函数命名

- **使用后端方法名**：API 函数名通常对应后端控制器的方法名
- **camelCase**：函数名使用 camelCase（首字母小写）
- **语义清晰**：函数名应清晰表达其功能

**常见函数命名：**

| 操作 | 函数名 | 示例 |
|-----|--------|------|
| 创建 | `create{资源名}` | `createUser`、`createRole` |
| 查询单个 | `get{资源名}ById` 或 `get{资源名}ByCode` | `getUserById`、`getRoleByCode` |
| 更新 | `update{资源名}` | `updateUser`、`updateRole` |
| 删除 | `delete{资源名}` | `deleteUser`、`deleteRole` |
| 查询列表 | `query{资源名}s` | `queryUsers`、`queryRoles` |
| 分页查询 | `query{资源名}sWithPage` | `queryUsersWithPage`、`queryRolesWithPage` |
| 登录 | `login` | `login` |
| 登出 | `logout` | `logout` |

## 文件内容规范

### 文件头部注释

每个 API 文件应包含文件头部注释，说明：
- 对应的后端控制器
- 文件用途

**示例：**
```typescript
/**
 * 登录控制器API
 * 对应后端 LoginController
 */
```

### 导入规范

**标准导入顺序：**
1. 工具函数（request、setToken 等）
2. 类型定义

**示例：**
```typescript
import { post, setToken } from '@/utils/request';
import type { LoginRequest, LoginResponse } from '@/types';
```

### 函数注释规范

每个 API 函数应包含 JSDoc 注释，说明：
- 接口路径和 HTTP 方法
- 参数说明
- 返回值说明

**示例：**
```typescript
/**
 * 用户名密码登录
 * POST /api/login
 * 
 * @param params 登录参数
 * @returns 登录响应（包含用户信息和accessToken）
 */
export const login = async (params: LoginRequest): Promise<LoginResponse> => {
  // ...
};
```

### 函数实现规范

**标准实现模式：**

```typescript
/**
 * 创建用户
 * POST /api/admin/users
 * 
 * @param user 用户实体
 * @returns 创建的用户信息
 */
export const createUser = (user: SysUser): Promise<SysUser> => {
  return post<SysUser>('/api/admin/users', user);
};
```

**特殊处理（如登录后保存 Token）：**

```typescript
/**
 * 用户名密码登录
 * POST /api/login
 * 
 * @param params 登录参数
 * @returns 登录响应（包含用户信息和accessToken）
 */
export const login = async (params: LoginRequest): Promise<LoginResponse> => {
  const result = await post<LoginResponse>(
    '/api/login',
    params,
    { skipAuth: true }
  );
  
  // 登录成功后自动保存Token
  if (result.accessToken) {
    setToken(result.accessToken);
  }
  
  return result;
};
```

## 导出规范

### 包内导出（index.ts）

**每个包文件夹下应包含 `index.ts` 文件，统一导出该包的所有 API。**

**示例：`api/system/index.ts`**
```typescript
/**
 * system包API统一导出
 * 对应后端 org.charno.system.controller 包
 */

export * from './Login';
export * from './Logout';
export * from './AdminSysUser';
export * from './AdminSysRole';
```

### 全局导出（api/index.ts）

**根目录 `api/index.ts` 统一导出所有包的 API。**

**示例：`api/index.ts`**
```typescript
/**
 * API统一导出
 */

export * from './system';
// 未来可以添加其他包
// export * from './common';
// export * from './business';
```

## 使用规范

### 导入方式

**推荐使用包内直接导入：**
```typescript
// ✅ 推荐：直接从包内导入
import { login } from '@/api/system/Login';
import { logout } from '@/api/system/Logout';
import { createUser, updateUser } from '@/api/system/AdminSysUser';
```

**也可以使用统一导出：**
```typescript
// ✅ 也可以：从统一导出导入
import { login, logout, createUser, updateUser } from '@/api';
```

### 不推荐的方式

```typescript
// ❌ 不推荐：从包 index 导入（虽然可以，但不够明确）
import { login } from '@/api/system';
```

## 完整示例

### 示例 1：登录 API

**文件：`api/system/Login.ts`**
```typescript
/**
 * 登录控制器API
 * 对应后端 LoginController
 */

import { post, setToken } from '@/utils/request';
import type { LoginRequest, LoginResponse } from '@/types';

/**
 * 用户名密码登录
 * POST /api/login
 * 
 * @param params 登录参数
 * @returns 登录响应（包含用户信息和accessToken）
 */
export const login = async (params: LoginRequest): Promise<LoginResponse> => {
  const result = await post<LoginResponse>(
    '/api/login',
    params,
    { skipAuth: true }
  );
  
  // 登录成功后自动保存Token
  if (result.accessToken) {
    setToken(result.accessToken);
  }
  
  return result;
};
```

### 示例 2：用户管理 API

**文件：`api/system/AdminSysUser.ts`**
```typescript
/**
 * 系统用户管理控制器API
 * 对应后端 AdminSysUserController
 */

import { get, post, put, del } from '@/utils/request';
import type { SysUser, UserQueryParams, UserPageQueryParams } from '@/types';

/**
 * 创建用户
 * POST /api/admin/users
 * 
 * @param user 用户实体
 * @returns 创建的用户信息
 */
export const createUser = (user: SysUser): Promise<SysUser> => {
  return post<SysUser>('/api/admin/users', user);
};

/**
 * 根据ID查询用户
 * GET /api/admin/users/{id}
 * 
 * @param id 用户ID（UUID）
 * @returns 用户信息
 */
export const getUserById = (id: string): Promise<SysUser> => {
  return get<SysUser>(`/api/admin/users/${id}`);
};

/**
 * 更新用户
 * PUT /api/admin/users/{id}
 * 
 * @param id 用户ID（UUID）
 * @param user 用户实体
 * @returns 更新后的用户信息
 */
export const updateUser = (id: string, user: SysUser): Promise<SysUser> => {
  return put<SysUser>(`/api/admin/users/${id}`, user);
};

/**
 * 删除用户
 * DELETE /api/admin/users/{id}
 * 
 * @param id 用户ID（UUID）
 * @returns void
 */
export const deleteUser = (id: string): Promise<void> => {
  return del<void>(`/api/admin/users/${id}`);
};

/**
 * 不分页条件查询用户
 * GET /api/admin/users/query
 * 
 * @param params 查询参数
 * @returns 用户列表
 */
export const queryUsers = (params?: UserQueryParams): Promise<SysUser[]> => {
  return get<SysUser[]>('/api/admin/users/query', params);
};

/**
 * 分页条件查询用户
 * GET /api/admin/users/query/page
 * 
 * @param params 查询参数（包含分页参数）
 * @returns 用户列表
 */
export const queryUsersWithPage = (params?: UserPageQueryParams): Promise<SysUser[]> => {
  return get<SysUser[]>('/api/admin/users/query/page', params);
};
```

## ❌ 禁止事项

1. **禁止混用控制器**
   ```typescript
   // ❌ 错误：一个文件包含多个控制器的接口
   // LoginAndLogout.ts
   export const login = ...;
   export const logout = ...;
   
   // ✅ 正确：每个控制器一个文件
   // Login.ts
   export const login = ...;
   // Logout.ts
   export const logout = ...;
   ```

2. **禁止使用 Controller 后缀**
   ```typescript
   // ❌ 错误：文件名包含 Controller 后缀
   // LoginController.ts
   
   // ✅ 正确：去除 Controller 后缀
   // Login.ts
   ```

3. **禁止在根目录直接创建 API 文件**
   ```typescript
   // ❌ 错误：直接在 api 目录下创建文件
   // api/login.ts
   
   // ✅ 正确：按包名组织
   // api/system/Login.ts
   ```

4. **禁止不规范的命名**
   ```typescript
   // ❌ 错误：使用不规范的命名
   // api/system/login.ts (小写)
   // api/system/UserAPI.ts (包含 API 后缀)
   
   // ✅ 正确：使用 PascalCase，去除 Controller 后缀
   // api/system/Login.ts
   // api/system/AdminSysUser.ts
   ```

## ✅ 检查清单

创建新的 API 文件时，请检查：

- [ ] 文件位于正确的包文件夹下（`api/{包名}/`）
- [ ] 文件名使用 PascalCase，去除 Controller 后缀
- [ ] 一个文件只对应一个后端控制器
- [ ] 文件头部包含注释，说明对应的后端控制器
- [ ] 每个函数包含 JSDoc 注释（路径、参数、返回值）
- [ ] 包内 `index.ts` 已导出该文件
- [ ] 根目录 `api/index.ts` 已导出该包（如果包是新创建的）
- [ ] 函数命名符合规范（camelCase，语义清晰）
- [ ] 使用了正确的类型定义（TypeScript）

## 优势

1. **结构清晰**：按后端包结构组织，便于查找和维护
2. **一一对应**：前端 API 文件与后端控制器一一对应，关系明确
3. **易于扩展**：新增后端包时，只需创建对应的前端包文件夹
4. **类型安全**：完整的 TypeScript 类型定义
5. **统一规范**：所有 API 文件遵循相同的结构和命名规范

