import React from 'react';

import { ConfigProvider, Dropdown, Tabs, theme } from 'antd';
import type { MenuProps } from 'antd';
import { FullscreenOutlined, PushpinFilled } from '@ant-design/icons';

import { createPanelShadow } from '../layout/panelShadow';
import {
  hasClosableLeft,
  hasClosableRight,
  hasClosableTab,
} from './tabModel';
import type { RouteTab, TabMenuAction } from './tabModel';

interface RouteTabsProps {
  tabs: readonly RouteTab[];
  activeKey: string;
  onSelect: (pathname: string) => void;
  onAction: (action: TabMenuAction, pathname: string) => void;
  /** 全屏不改变标签数据，由外层提供容器控制。 */
  onFullscreen: () => void;
}

const RouteTabs: React.FC<RouteTabsProps> = ({
  tabs,
  activeKey,
  onSelect,
  onAction,
  onFullscreen,
}) => {
  const { token } = theme.useToken();

  const buildMenu = (tab: RouteTab): MenuProps['items'] => {
    const items: NonNullable<MenuProps['items']> = [];
    // 固定标签由路由配置声明为常驻，不提供关闭和取消锚定入口。
    if (!tab.fixed) {
      items.push(
        { key: 'close', label: '关闭', disabled: tab.pinned },
        { key: 'pin', label: tab.pinned ? '取消锚定' : '锚定' },
        { type: 'divider' },
      );
    }
    items.push(
      { key: 'closeLeft', label: '关闭左侧', disabled: !hasClosableLeft(tabs, tab.pathname) },
      { key: 'closeRight', label: '关闭右侧', disabled: !hasClosableRight(tabs, tab.pathname) },
      { key: 'closeAll', label: '关闭全部', disabled: !hasClosableTab(tabs) },
      { type: 'divider' },
      { key: 'fullscreen', label: '全屏', icon: <FullscreenOutlined /> },
    );
    return items;
  };

  const items = tabs.map((tab) => ({
    key: tab.pathname,
    closable: !tab.pinned,
    label: (
      <Dropdown
        trigger={['contextMenu']}
        menu={{
          items: buildMenu(tab),
          onClick: ({ key }) => {
            if (key === 'fullscreen') onFullscreen();
            else onAction(key as TabMenuAction, tab.pathname);
          },
        }}
      >
        <span>
          {tab.pinned && !tab.fixed && (
            <PushpinFilled style={{ color: token.colorPrimary, marginInlineEnd: token.marginXXS }} />
          )}
          {tab.title}
        </span>
      </Dropdown>
    ),
  }));

  return (
    // 标签栏作为独立面板：自带背景、内边距与下沿阴影；嵌套 ConfigProvider 只收紧 Tabs 默认底部外边距。
    <ConfigProvider theme={{ components: { Tabs: { horizontalMargin: '0' } } }}>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: '0 0 auto',
          padding: `${token.paddingXS}px ${token.paddingSM}px 0`,
          background: token.colorBgContainer,
          boxShadow: createPanelShadow(token, 'bottom'),
        }}
      >
        <Tabs
          type="editable-card"
          size="small"
          hideAdd
          activeKey={activeKey}
          items={items}
          onChange={onSelect}
          onEdit={(targetKey, action) => {
            if (action === 'remove') onAction('close', String(targetKey));
          }}
        />
      </div>
    </ConfigProvider>
  );
};

export default RouteTabs;
