/**
 * 用户信息管理工具
 * 从 localStorage 读取/写入用户信息
 */

import type { SysUser } from '@/types';

const USER_INFO_KEY = 'userInfo';

/**
 * 获取用户信息
 */
export const getUserInfo = (): SysUser | null => {
  try {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY);
    if (!userInfoStr) {
      return null;
    }
    return JSON.parse(userInfoStr) as SysUser;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 设置用户信息
 */
export const setUserInfo = (userInfo: SysUser): void => {
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
};

/**
 * 清除用户信息
 */
export const clearUserInfo = (): void => {
  try {
    localStorage.removeItem(USER_INFO_KEY);
  } catch (error) {
    console.error('清除用户信息失败:', error);
  }
};

