/**
 * 类型定义
 * 对应后端实体类
 */

/**
 * 系统用户实体
 * 对应后端 SysUser
 */
export interface SysUser {
  /** 用户唯一标识（UUID） */
  id?: string;
  /** 用户状态（如 ENABLED / DISABLED / LOCKED） */
  status?: string;
  /** 用户角色代码，关联 sys_role 表的 code 字段 */
  roleCode?: string;
  /** 账号类型（如 EMAIL / PHONE / USERNAME / WECHAT） */
  accountType?: string;
  /** 账号唯一标识（邮箱、手机号、用户名等） */
  accountIdentifier?: string;
  /** 用户密码哈希值（不可逆，通常不返回） */
  passwordHash?: string;
  /** 密码算法版本号 */
  passwordAlgoVersion?: number;
  /** 最近一次密码修改时间 */
  passwordChangedAt?: string;
  /** 最近一次登录时间 */
  lastLoginAt?: string;
  /** 最近一次登录IP地址 */
  lastLoginIp?: string;
  /** 用户昵称 */
  nickname?: string;
  /** 用户头像URL */
  avatarUrl?: string;
  /** 用户性别（如 MALE / FEMALE / UNKNOWN） */
  gender?: string;
  /** 用户语言环境（如 zh-CN / en-US） */
  locale?: string;
  /** 用户所在时区（如 Asia/Shanghai） */
  timezone?: string;
  /** 用户创建时间 */
  createdAt?: string;
  /** 用户最近更新时间 */
  updatedAt?: string;
  /** 逻辑删除时间（为空表示未删除） */
  deletedAt?: string;
  /** 乐观锁版本号 */
  version?: number;
}

/**
 * 系统角色实体
 * 对应后端 SysRole
 */
export interface SysRole {
  /** 角色代码（主键，唯一标识） */
  code?: string;
  /** 角色名称 */
  name?: string;
  /** 角色描述 */
  description?: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  /** 用户信息 */
  user: SysUser;
  /** 访问令牌 */
  accessToken: string;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 昵称 */
  nickname: string;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams {
  /** 用户状态（可选） */
  status?: string;
  /** 角色代码（可选） */
  roleCode?: string;
  /** 账号类型（可选） */
  accountType?: string;
  /** 账号标识符（可选，支持模糊查询） */
  accountIdentifier?: string;
  /** 昵称（可选，支持模糊查询） */
  nickname?: string;
}

/**
 * 用户分页查询参数
 */
export interface UserPageQueryParams extends UserQueryParams {
  /** 页码（从0开始，默认0） */
  page?: number;
  /** 每页大小（默认10） */
  size?: number;
  /** 排序字段（可选，格式：field,asc/desc，默认按createdAt降序） */
  sort?: string;
}

/**
 * 角色查询参数
 */
export interface RoleQueryParams {
  /** 角色代码（可选，支持模糊查询） */
  code?: string;
  /** 角色名称（可选，支持模糊查询） */
  name?: string;
}

/**
 * 角色分页查询参数
 */
export interface RolePageQueryParams extends RoleQueryParams {
  /** 页码（从0开始，默认0） */
  page?: number;
  /** 每页大小（默认10） */
  size?: number;
  /** 排序字段（可选，格式：field,asc/desc，默认按createdAt降序） */
  sort?: string;
}

