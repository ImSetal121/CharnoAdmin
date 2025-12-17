/**
 * 主题管理工具
 * 使用 Tailwind CSS 的 dark class 切换明暗主题
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

/**
 * 获取当前主题
 */
export const getTheme = (): Theme => {
  try {
    const theme = localStorage.getItem(THEME_KEY) as Theme;
    if (theme === 'light' || theme === 'dark') {
      return theme;
    }
  } catch (error) {
    console.error('获取主题失败:', error);
  }
  // 默认使用系统偏好
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * 设置主题
 */
export const setTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
    // 更新 document 的 class，供 Tailwind CSS 使用
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
  } catch (error) {
    console.error('设置主题失败:', error);
  }
};

/**
 * 切换主题
 */
export const toggleTheme = (): Theme => {
  const currentTheme = getTheme();
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
};

/**
 * 初始化主题（在应用启动时调用）
 */
export const initTheme = (): void => {
  const theme = getTheme();
  setTheme(theme);
};

