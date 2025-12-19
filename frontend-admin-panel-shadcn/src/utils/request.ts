/**
 * 请求封装
 * 基于后端 ApiResponse 统一响应格式设计
 */

/**
 * 后端统一响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * 请求配置选项
 */
export interface RequestOptions extends RequestInit {
  /** 是否跳过Token验证（用于登录等接口） */
  skipAuth?: boolean;
  /** 是否显示错误提示（默认true） */
  showError?: boolean;
}

/**
 * 请求错误类
 */
export class RequestError extends Error {
  code: number;
  response?: Response;

  constructor(
    code: number,
    message: string,
    response?: Response
  ) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.response = response;
  }
}

/**
 * Token存储键名
 */
const TOKEN_KEY = 'accessToken';

/**
 * 获取Token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置Token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 清除Token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 请求基础URL
 * 开发环境使用代理或直接指定后端地址
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * 创建完整的请求URL
 */
const createUrl = (url: string): string => {
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 确保URL以/开头
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${path}`;
};

/**
 * 请求拦截器：添加Token到请求头
 */
const requestInterceptor = (options: RequestOptions): RequestInit => {
  const headers = new Headers(options.headers);

  // 设置默认Content-Type
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  // 添加Token（如果需要认证且未跳过）
  if (!options.skipAuth) {
    const token = getToken();
    if (token) {
      // 支持Bearer格式和直接token格式（后端都支持）
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return {
    ...options,
    headers,
  };
};

/**
 * 响应拦截器：统一处理响应格式和错误
 */
const responseInterceptor = async <T>(
  response: Response,
  _options: RequestOptions
): Promise<T> => {
  // 处理HTTP错误状态码
  if (!response.ok) {
    let errorMessage = '请求失败';
    let errorCode = response.status;

    try {
      const errorData = await response.json();
      if (errorData && typeof errorData === 'object') {
        // 后端返回的ApiResponse格式
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.code) {
          errorCode = errorData.code;
        }
      }
    } catch {
      // 如果响应不是JSON，使用HTTP状态文本
      errorMessage = response.statusText || '请求失败';
    }

    // 处理401未授权：清除Token并跳转登录
    if (response.status === 401) {
      removeToken();
      // 可以在这里添加路由跳转到登录页
      // window.location.href = '/login';
    }

    // 处理403禁止访问
    if (response.status === 403) {
      errorMessage = errorMessage || '禁止访问：需要角色权限';
    }

    throw new RequestError(errorCode, errorMessage, response);
  }

  // 解析响应数据
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (error) {
    throw new RequestError(500, '响应数据解析失败', response);
  }

  // 检查业务状态码
  if (data.code !== 200) {
    // 业务逻辑错误
    const errorMessage = data.message || '操作失败';
    throw new RequestError(data.code, errorMessage, response);
  }

  // 返回数据部分
  return data.data as T;
};

/**
 * 核心请求方法
 */
const request = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const fullUrl = createUrl(url);
  const interceptedOptions = requestInterceptor(options);

  try {
    const response = await fetch(fullUrl, interceptedOptions);
    return await responseInterceptor<T>(response, options);
  } catch (error) {
    // 处理网络错误或其他异常
    if (error instanceof RequestError) {
      throw error;
    }
    throw new RequestError(500, error instanceof Error ? error.message : '网络请求失败');
  }
};

/**
 * GET请求
 */
export const get = <T = any>(
  url: string,
  params?: Record<string, any>,
  options?: RequestOptions
): Promise<T> => {
  // 构建查询参数
  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return request<T>(fullUrl, {
    ...options,
    method: 'GET',
  });
};

/**
 * POST请求
 */
export const post = <T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> => {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT请求
 */
export const put = <T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> => {
  return request<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE请求
 */
export const del = <T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> => {
  return request<T>(url, {
    ...options,
    method: 'DELETE',
  });
};

/**
 * PATCH请求
 */
export const patch = <T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> => {
  return request<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * 导出默认请求方法（支持自定义配置）
 */
export default request;

