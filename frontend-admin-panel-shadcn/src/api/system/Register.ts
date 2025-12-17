/**
 * 注册控制器API
 * 对应后端 RegisterController
 */

import { post } from '@/utils/request';
import type { RegisterRequest, SysUser } from '@/types';

/**
 * 用户名密码注册
 * POST /api/register
 * 
 * @param params 注册参数
 * @returns 注册响应（包含用户信息）
 */
export const register = async (params: RegisterRequest): Promise<SysUser> => {
  return post<SysUser>(
    '/api/register',
    params,
    { skipAuth: true }
  );
};

