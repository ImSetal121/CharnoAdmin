/**
 * 系统配置管理控制器API
 * 对应后端 AdminSysConfigController
 */

import { get, post, put, del } from '@/utils/request';
import type { SysConfig, ConfigQueryParams, ConfigPageQueryParams, PageResult } from '@/types';

/**
 * 创建配置
 * POST /api/admin/configs
 * 
 * @param config 配置实体
 * @returns 创建的配置信息
 */
export const createConfig = (config: SysConfig): Promise<SysConfig> => {
  return post<SysConfig>('/api/admin/configs', config);
};

/**
 * 根据键查询配置
 * GET /api/admin/configs/{key}
 * 
 * @param key 配置键
 * @returns 配置信息
 */
export const getConfigByKey = (key: string): Promise<SysConfig> => {
  return get<SysConfig>(`/api/admin/configs/${key}`);
};

/**
 * 更新配置
 * PUT /api/admin/configs/{key}
 * 
 * @param key 配置键
 * @param config 配置实体
 * @returns 更新后的配置信息
 */
export const updateConfig = (key: string, config: SysConfig): Promise<SysConfig> => {
  return put<SysConfig>(`/api/admin/configs/${key}`, config);
};

/**
 * 删除配置
 * DELETE /api/admin/configs/{key}
 * 
 * @param key 配置键
 * @returns void
 */
export const deleteConfig = (key: string): Promise<void> => {
  return del<void>(`/api/admin/configs/${key}`);
};

/**
 * 不分页条件查询配置
 * GET /api/admin/configs/query
 * 
 * @param params 查询参数
 * @returns 配置列表
 */
export const queryConfigs = (params?: ConfigQueryParams): Promise<SysConfig[]> => {
  return get<SysConfig[]>('/api/admin/configs/query', params);
};

/**
 * 分页条件查询配置
 * GET /api/admin/configs/query/page
 * 
 * @param params 查询参数（包含分页参数）
 * @param params.sort 排序参数（可选），格式：`字段名,asc` 或 `字段名,desc`，如 `key,asc`
 *   - 排序是对所有符合查询条件的数据进行排序，然后进行分页（不是对单页数据排序）
 *   - 字段名必须与后端实体类的字段名一致（注意大小写和驼峰命名）
 *   - 如果 sort 参数为空，则使用默认排序（按 key 升序）
 * @returns 分页结果
 */
export const queryConfigsWithPage = (params?: ConfigPageQueryParams): Promise<PageResult<SysConfig>> => {
  return get<PageResult<SysConfig>>('/api/admin/configs/query/page', params);
};

