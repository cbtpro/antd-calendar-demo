import React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { DEFAULT_PATH, findRoute, toLocation } from '../router/routes';
import { loadTabs, saveTabs } from '../router/tabStorage';
import {
  closeAllTabs,
  closeLeftTabs,
  closeRightTabs,
  closeTab,
  togglePin,
  upsertTab,
} from '../router/tabModel';
import type { RouteTab, TabMenuAction } from '../router/tabModel';

/** 首次加载优先恢复上次会话的标签，否则只保留默认标签。 */
function readInitialTabs(): RouteTab[] {
  const stored = loadTabs();
  if (stored.length > 0) return stored;
  const home = findRoute(DEFAULT_PATH);
  return home
    ? [{
      pathname: home.path,
      title: home.title,
      search: '',
      hash: '',
      pinned: true,
      fixed: Boolean(home.fixed),
    }]
    : [];
}

/** 把路由状态同步为常驻标签栏：新增/更新标签、持久化，并执行关闭与锚定操作。 */
export function useRouteTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = React.useState<RouteTab[]>(readInitialTabs);

  const currentPathname = location.pathname;

  // 当前路由变化时补齐标签，并同步该标签保存的查询参数与锚点。
  React.useEffect(() => {
    const route = findRoute(currentPathname);
    if (!route) return;
    setTabs((prev) => upsertTab(prev, {
      pathname: route.path,
      title: route.title,
      search: location.search,
      hash: location.hash,
      pinned: prev.find((tab) => tab.pathname === route.path)?.pinned
        ?? Boolean(route.pinned || route.fixed),
      fixed: Boolean(route.fixed),
    }));
  }, [currentPathname, location.search, location.hash]);

  React.useEffect(() => {
    saveTabs(tabs);
  }, [tabs]);

  const activeKey = tabs.some((tab) => tab.pathname === currentPathname)
    ? currentPathname
    : tabs[0]?.pathname ?? DEFAULT_PATH;

  const go = React.useCallback((tab?: RouteTab) => {
    navigate(tab ? toLocation(tab) : DEFAULT_PATH);
  }, [navigate]);

  const select = React.useCallback((pathname: string) => {
    go(tabs.find((tab) => tab.pathname === pathname));
  }, [tabs, go]);

  /** 关闭类操作后，若当前标签被移除就激活原位置附近仍存在的标签。 */
  const applyClose = React.useCallback((nextTabs: RouteTab[]) => {
    setTabs(nextTabs);
    if (nextTabs.some((tab) => tab.pathname === currentPathname)) return;
    const index = tabs.findIndex((tab) => tab.pathname === currentPathname);
    go(nextTabs[Math.min(Math.max(index, 0), nextTabs.length - 1)]);
  }, [tabs, currentPathname, go]);

  const runAction = React.useCallback((action: TabMenuAction, pathname: string) => {
    switch (action) {
      case 'close':
        applyClose(closeTab(tabs, pathname));
        break;
      case 'pin':
        setTabs(togglePin(tabs, pathname));
        break;
      case 'closeLeft':
        applyClose(closeLeftTabs(tabs, pathname));
        break;
      case 'closeRight':
        applyClose(closeRightTabs(tabs, pathname));
        break;
      case 'closeAll':
        applyClose(closeAllTabs(tabs));
        break;
    }
  }, [tabs, applyClose]);

  return { items: tabs, activeKey, select, runAction };
}
