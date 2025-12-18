/**
 * 动画设置管理工具
 * 管理页面切换动画的开启/关闭状态
 */

const ANIMATION_ENABLED_KEY = 'animationEnabled';

/**
 * 获取动画设置
 * @returns 动画是否启用，默认 true
 */
export const getAnimationEnabled = (): boolean => {
  try {
    const enabled = localStorage.getItem(ANIMATION_ENABLED_KEY);
    if (enabled === null) {
      // 默认启用动画
      return true;
    }
    return enabled === 'true';
  } catch (error) {
    console.error('获取动画设置失败:', error);
    // 默认启用动画
    return true;
  }
};

/**
 * 设置动画开关
 * @param enabled 是否启用动画
 */
export const setAnimationEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(ANIMATION_ENABLED_KEY, String(enabled));
    // 触发自定义事件，用于跨组件通信
    window.dispatchEvent(new Event('animationchange'));
  } catch (error) {
    console.error('设置动画开关失败:', error);
  }
};

/**
 * 切换动画开关
 * @returns 切换后的状态
 */
export const toggleAnimation = (): boolean => {
  const currentEnabled = getAnimationEnabled();
  const newEnabled = !currentEnabled;
  setAnimationEnabled(newEnabled);
  return newEnabled;
};

