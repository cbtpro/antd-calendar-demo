import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

/** 主题偏好持久化键，避免刷新后回到默认模式。 */
export const THEME_STORAGE_KEY = 'event-calendar-demo:theme-mode';

/** 紧凑基础 token：两种模式共用，压缩控件高度以展示更多内容。 */
const compactToken: ThemeConfig['token'] = {
  controlHeightSM: 22,
  controlHeight: 28,
  fontSize: 13,
  fontSizeSM: 12,
  paddingXXS: 4,
  paddingXS: 8,
  paddingSM: 10,
  padding: 12,
  marginXXS: 4,
  marginXS: 8,
  marginSM: 12,
};

const layoutMetrics = {
  headerHeight: 48,
  headerPadding: '0 16px',
  footerPadding: '8px 16px',
};

/**
 * v6 把 Layout 的 headerBg / bodyBg / footerBg / triggerBg 默认值写死成深色（#001529 等），
 * 与 algorithm 无关。亮色模式必须逐项改回浅色；暗色模式沿用 antd 自带深色值即可。
 * bodyBg 保持浅灰画布（而非纯白），白色面板才能靠阴影与分隔线浮起来。
 */
const lightLayoutColors = {
  headerBg: '#fff',
  headerColor: 'rgba(0, 0, 0, 0.88)',
  bodyBg: '#f5f5f5',
  footerBg: '#fff',
  triggerBg: '#fff',
  triggerColor: 'rgba(0, 0, 0, 0.88)',
};

/** 按模式生成 ConfigProvider 的 theme 配置。 */
export function createThemeConfig(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark';
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: compactToken,
    components: {
      Layout: {
        ...layoutMetrics,
        ...(isDark ? {} : lightLayoutColors),
      },
    },
  };
}
