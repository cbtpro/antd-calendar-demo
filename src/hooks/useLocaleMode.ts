import React from 'react';

import { applyDayjsLocale, DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from '../locale';
import type { LocaleKey } from '../locale';

const readStoredLocale = (): LocaleKey => {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'en-US' ? 'en-US' : DEFAULT_LOCALE;
  } catch {
    // 隐私模式等场景读取失败时退回默认中文。
    return DEFAULT_LOCALE;
  }
};

/** 管理界面语言，切换时同步 dayjs 语言并持久化到本地存储。 */
export function useLocaleMode() {
  const [locale, setLocale] = React.useState<LocaleKey>(readStoredLocale);

  React.useEffect(() => {
    applyDayjsLocale(locale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // 存储不可用时仅影响刷新记忆，不影响当前会话的语言切换。
    }
  }, [locale]);

  const toggleLocale = React.useCallback(
    () => setLocale((current) => (current === 'zh-CN' ? 'en-US' : 'zh-CN')),
    [],
  );

  return { locale, toggleLocale };
}
