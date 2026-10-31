import React from 'react';

import { THEME_STORAGE_KEY } from '../theme';
import type { ThemeMode } from '../theme';

const readStoredMode = (): ThemeMode => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    // 隐私模式等场景读取失败时退回默认亮色。
    return 'light';
  }
};

/** 管理亮色/暗色模式，并把选择持久化到本地存储。 */
export function useThemeMode() {
  const [mode, setMode] = React.useState<ThemeMode>(readStoredMode);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // 存储不可用时仅影响刷新记忆，不影响当前会话的主题切换。
    }
  }, [mode]);

  const toggleMode = React.useCallback(
    () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { mode, isDark: mode === 'dark', toggleMode };
}
