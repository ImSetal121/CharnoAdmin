/**
 * 角色管理API
 * 对应后端 AdminSysRoleController
 */

import { get, post, put, del } from '@/utils/request';
import type { SysRole, RoleQueryParams, RolePageQueryParams } from '@/types';

/**
 * 创建角色
 * POST /api/admin/roles
 * 
 * @param role 角色实体
 * @returns 创建的角色信息
 */
export const createRole = (role: SysRole): Promise<SysRole> => {
  return post<SysRole>('/api/admin/roles', role);
};

/**
 * 根据代码查询角色
 * GET /api/admin/roles/{code}
 * 
 * @param code 角色代码
 * @returns 角色信息
 */
export const getRoleByCode = (code: string): Promise<SysRole> => {
  return get<SysRole>(`/api/admin/roles/${code}`);
};

/**
 * 更新角色
 * PUT /api/admin/roles/{code}
 * 
 * @param code 角色代码
 * @param role 角色实体
 * @returns 更新后的角色信息
 */
export const updateRole = (code: string, role: SysRole): Promise<SysRole> => {
  return put<SysRole>(`/api/admin/roles/${code}`, role);
};

/**
 * 删除角色
 * DELETE /api/admin/roles/{code}
 * 
 * @param code 角色代码
 * @returns void
 */
export const deleteRole = (code: string): Promise<void> => {
  return del<void>(`/api/admin/roles/${code}`);
};

/**
 * 不分页条件查询角色
 * GET /api/admin/roles/query
 * 
 * @param params 查询参数
 * @returns 角色列表
 */
export const queryRoles = (params?: RoleQueryParams): Promise<SysRole[]> => {
  return get<SysRole[]>('/api/admin/roles/query', params);
};

/**
 * 分页条件查询角色
 * GET /api/admin/roles/query/page
 * 
 * @param params 查询参数（包含分页参数）
 * @returns 角色列表
 */
export const queryRolesWithPage = (params?: RolePageQueryParams): Promise<SysRole[]> => {
  return get<SysRole[]>('/api/admin/roles/query/page', params);
};

