import React from 'react';

import { Layout, theme } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useRouteTabs } from '../hooks/useRouteTabs';
import { useFullscreen } from '../hooks/useFullscreen';
import RouteTabs from '../router/RouteTabs';
import { APP_ROUTES, DEFAULT_PATH, findRoute } from '../router/routes';
import type { LocaleKey } from '../locale';
import AppHeader from './AppHeader';
import AppSider from './AppSider';
import KeepAliveRoutes from './KeepAliveRoutes';
import { createPanelShadow } from './panelShadow';

const { Content, Footer } = Layout;

const FOOTER_HINT = '日历视图适合精确排日，甘特图突出跨期对比 —— 两者共享同一任务数据源';

interface AppLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
  locale: LocaleKey;
  onToggleLocale: () => void;
}

/** 应用布局骨架：顶栏 + 侧栏导航 + 常驻标签栏 + 内容区 + 页脚。 */
const AppLayout: React.FC<AppLayoutProps> = ({ isDark, onToggleTheme, locale, onToggleLocale }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = useRouteTabs();
  const fullscreen = useFullscreen<HTMLDivElement>();
  const { token } = theme.useToken();
  const selectedKeys = [findRoute(location.pathname)?.path ?? DEFAULT_PATH];
  // 标签路径作为保活页面的存活集合，关闭标签即释放对应页面。
  const openPaths = React.useMemo(() => tabs.items.map((tab) => tab.pathname), [tabs.items]);
  const activePath = findRoute(location.pathname)?.path ?? '';

  return (
    <Layout style={{ height: '100%', overflow: 'hidden' }}>
      <AppHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        locale={locale}
        onToggleLocale={onToggleLocale}
      />
      <Layout>
        <AppSider isDark={isDark} selectedKeys={selectedKeys} onNavigate={navigate} />
        {/* 右侧内容列同时是全屏目标，页脚因此随 Sider 折叠变宽。 */}
        <Layout ref={fullscreen.targetRef}>
          {/* 标签栏常驻：页面切换只替换内容区，标签集合由 useRouteTabs 维护。 */}
          <RouteTabs
            tabs={tabs.items}
            activeKey={tabs.activeKey}
            onSelect={tabs.select}
            onAction={tabs.runAction}
            onFullscreen={fullscreen.toggle}
          />
          <Content style={{ overflow: 'hidden' }}>
            <KeepAliveRoutes routes={APP_ROUTES} activePath={activePath} openPaths={openPaths} />
          </Content>
          <Footer style={{ boxShadow: createPanelShadow(token, 'top') }}>{FOOTER_HINT}</Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
