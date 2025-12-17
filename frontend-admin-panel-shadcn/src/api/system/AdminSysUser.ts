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

