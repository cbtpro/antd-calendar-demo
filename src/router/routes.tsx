import React from 'react';

import { CalendarOutlined, DashboardOutlined } from '@ant-design/icons';

/** 路由级代码分割：页面 chunk 在首次访问时才加载。 */
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const TasksPage = React.lazy(() => import('../pages/TasksPage'));

export interface AppRoute {
  /** 路由路径，同时作为标签页的唯一标识。 */
  path: string;
  /** 菜单和标签页共用的页面名称。 */
  title: string;
  icon: React.ReactNode;
  element: React.ReactNode;
  /** 默认标签常驻，关闭全部时保留。 */
  pinned?: boolean;
  /** 固定标签：永久锚定，右键菜单不提供关闭与取消锚定。 */
  fixed?: boolean;
}

export const APP_ROUTES: readonly AppRoute[] = [
  {
    path: '/dashboard',
    title: '仪表盘',
    icon: <DashboardOutlined />,
    element: <DashboardPage />,
    pinned: true,
    fixed: true,
  },
  {
    path: '/tasks',
    title: '任务视图',
    icon: <CalendarOutlined />,
    element: <TasksPage />,
  },
];

export const DEFAULT_PATH = '/dashboard';

export function findRoute(pathname: string): AppRoute | undefined {
  return APP_ROUTES.find((route) => route.path === pathname);
}

/** 拼接标签页的跳转地址，保留已保存的查询参数和锚点。 */
export function toLocation(tab: { pathname: string; search: string; hash: string }): string {
  return `${tab.pathname}${tab.search}${tab.hash}`;
}
