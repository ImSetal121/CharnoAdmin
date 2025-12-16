/**
 * 浏览器全屏功能工具
 * 封装 Fullscreen API
 */

/**
 * 进入全屏
 */
export const enterFullscreen = (): Promise<void> => {
  const element = document.documentElement;
  
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if ((element as any).webkitRequestFullscreen) {
    // Safari
    return (element as any).webkitRequestFullscreen();
  } else if ((element as any).mozRequestFullScreen) {
    // Firefox
    return (element as any).mozRequestFullScreen();
  } else if ((element as any).msRequestFullscreen) {
    // IE/Edge
    return (element as any).msRequestFullscreen();
  }
  
  return Promise.reject(new Error('浏览器不支持全屏功能'));
};

/**
 * 退出全屏
 */
export const exitFullscreen = (): Promise<void> => {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    // Safari
    return (document as any).webkitExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    // Firefox
    return (document as any).mozCancelFullScreen();
  } else if ((document as any).msExitFullscreen) {
    // IE/Edge
    return (document as any).msExitFullscreen();
  }
  
  return Promise.reject(new Error('浏览器不支持全屏功能'));
};

/**
 * 切换全屏
 */
export const toggleFullscreen = async (): Promise<void> => {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
};

/**
 * 检查是否处于全屏状态
 */
export const isFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

/**
 * 监听全屏状态变化
 */
export const onFullscreenChange = (callback: (isFullscreen: boolean) => void): (() => void) => {
  const handler = () => {
    callback(isFullscreen());
  };
  
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);
  
  // 返回清理函数
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
};

