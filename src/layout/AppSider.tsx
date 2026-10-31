import React from 'react';

import { Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';

import { APP_ROUTES } from '../router/routes';
import { createPanelShadow } from './panelShadow';

const { Sider } = Layout;

const SIDER_WIDTH = 180;
const NAV_TITLE = '菜单';

/** 菜单项由路由表派生，新增路由无需改动布局代码。 */
const NAV_ITEMS: MenuProps['items'] = APP_ROUTES.map((route) => ({
  key: route.path,
  icon: route.icon,
  label: route.title,
}));

interface AppSiderProps {
  isDark: boolean;
  selectedKeys: string[];
  onNavigate: (path: string) => void;
}

/** 左侧导航：只负责菜单渲染与跳转回调，当前选中项由外层依据路由计算。 */
const AppSider: React.FC<AppSiderProps> = ({ isDark, selectedKeys, onNavigate }) => {
  const { token } = theme.useToken();
  // Sider 不会把主题透传给 Menu，两者需要同步设置。
  const antdTheme = isDark ? 'dark' : 'light';

  return (
    <Sider
      width={SIDER_WIDTH}
      collapsible
      breakpoint="lg"
      theme={antdTheme}
      style={{
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
        boxShadow: createPanelShadow(token, 'right'),
      }}
    >
      <div style={{ padding: `${token.padding}px ${token.padding}px ${token.paddingXS}px` }}>
        {NAV_TITLE}
      </div>
      <Menu
        mode="inline"
        theme={antdTheme}
        selectedKeys={selectedKeys}
        items={NAV_ITEMS}
        onClick={({ key }) => onNavigate(key)}
      />
    </Sider>
  );
};

export default AppSider;
