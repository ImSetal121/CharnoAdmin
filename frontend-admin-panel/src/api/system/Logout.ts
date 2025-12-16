/**
 * 登出控制器API
 * 对应后端 LogoutController
 */

import { post } from '@/utils/request';

/**
 * 用户登出
 * POST /api/logout
 * 
 * @returns void
 */
export const logout = async (): Promise<void> => {
  return post<void>('/api/logout');
};

