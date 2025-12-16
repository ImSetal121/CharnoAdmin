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

