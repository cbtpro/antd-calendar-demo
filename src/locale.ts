import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';

export type LocaleKey = 'zh-CN' | 'en-US';

export const DEFAULT_LOCALE: LocaleKey = 'zh-CN';

/** 语言偏好持久化键，刷新后保持上次选择。 */
export const LOCALE_STORAGE_KEY = 'event-calendar-demo:locale';

/** antd 组件内置文案（分页、空状态、日期选择器等）的语言包。 */
export const ANTD_LOCALES: Record<LocaleKey, Locale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/** dayjs 语言标识：日历的星期/月份名称来自 dayjs，而非 antd 语言包。 */
const DAYJS_LOCALES: Record<LocaleKey, string> = {
  'zh-CN': 'zh-cn',
  'en-US': 'en',
};

/** 顶栏语言切换器展示的当前语言名与切换提示。 */
export const LOCALE_META: Record<LocaleKey, { label: string; switchTitle: string }> = {
  'zh-CN': { label: '中文', switchTitle: '切换到英文' },
  'en-US': { label: 'English', switchTitle: 'Switch to Chinese' },
};

/** 同步 dayjs 全局语言，让日历等日期组件跟随界面语言。 */
export function applyDayjsLocale(locale: LocaleKey): void {
  dayjs.locale(DAYJS_LOCALES[locale]);
}
