import React from 'react';

import { Layout, theme } from 'antd';
import { ScheduleOutlined } from '@ant-design/icons';

import type { LocaleKey } from '../locale';
import { createPanelShadow } from './panelShadow';
import LocaleToggle from './LocaleToggle';
import ThemeToggle from './ThemeToggle';

const { Header } = Layout;

const APP_TITLE = '跨日期任务 Demo';

interface AppHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  locale: LocaleKey;
  onToggleLocale: () => void;
}

/** 顶栏：产品标识 + 右侧操作区（语言、主题），自身负责与下方内容的分隔。 */
const AppHeader: React.FC<AppHeaderProps> = ({
  isDark,
  onToggleTheme,
  locale,
  onToggleLocale,
}) => {
  const { token } = theme.useToken();

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: token.marginSM,
        position: 'relative',
        zIndex: 1,
        boxShadow: createPanelShadow(token, 'bottom'),
      }}
    >
      <ScheduleOutlined />
      <span style={{ fontWeight: 500 }}>{APP_TITLE}</span>
      <div
        style={{
          marginInlineStart: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: token.marginXXS,
        }}
      >
        <LocaleToggle locale={locale} onToggle={onToggleLocale} />
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </Header>
  );
};

export default AppHeader;
