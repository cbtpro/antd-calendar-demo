import React from 'react';

import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';

import { createThemeConfig } from './theme';
import { ANTD_LOCALES } from './locale';
import { useLocaleMode } from './hooks/useLocaleMode';
import { useThemeMode } from './hooks/useThemeMode';
import AppLayout from './layout/AppLayout';

/** 全局装配：语言与主题配置、路由基路径，具体布局交给 AppLayout。 */
const App: React.FC = () => {
  const { isDark, toggleMode } = useThemeMode();
  const { locale, toggleLocale } = useLocaleMode();

  return (
    <ConfigProvider
      locale={ANTD_LOCALES[locale]}
      theme={createThemeConfig(isDark ? 'dark' : 'light')}
      button={{ autoInsertSpace: false }}
    >
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <AppLayout
          isDark={isDark}
          onToggleTheme={toggleMode}
          locale={locale}
          onToggleLocale={toggleLocale}
        />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
