import React from 'react';

/**
 * 让指定容器进入浏览器全屏，Esc 或再次调用即可退出。
 * 浏览器不支持或用户拒绝时静默保持当前布局。
 */
export function useFullscreen<T extends HTMLElement>() {
  const targetRef = React.useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggle = React.useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (document.fullscreenEnabled && targetRef.current) {
        await targetRef.current.requestFullscreen();
      }
    } catch {
      // 全屏请求被拒绝时保持原状态即可，无需打断用户。
    }
  }, []);

  return { targetRef, isFullscreen, toggle };
}
