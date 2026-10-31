import React from 'react';

import { Skeleton, theme } from 'antd';
import { Navigate } from 'react-router-dom';

import { DEFAULT_PATH } from '../router/routes';
import type { AppRoute } from '../router/routes';
import { PageActiveContext } from './PageActiveContext';

interface KeepAliveRoutesProps {
  routes: readonly AppRoute[];
  /** 当前激活的路由路径；空串表示地址不匹配任何路由。 */
  activePath: string;
  /** 仍然打开的标签路径，标签关闭后对应页面即可释放。 */
  openPaths: readonly string[];
}

const PAGE_LOADING = <Skeleton active paragraph={{ rows: 6 }} />;

const PageContainer: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => {
  const { token } = theme.useToken();

  return (
    <PageActiveContext.Provider value={active}>
      <div
        style={{
          display: active ? 'block' : 'none',
          height: '100%',
          overflow: 'auto',
          padding: token.padding,
        }}
      >
        {children}
      </div>
    </PageActiveContext.Provider>
  );
};

/**
 * 路由懒加载 + 页面保活：
 * 只挂载访问过的路由，非当前页保持挂载但隐藏，返回时不会重建组件状态；
 * 标签关闭后从挂载列表移除，对应页面卸载并释放内存。
 */
const KeepAliveRoutes: React.FC<KeepAliveRoutesProps> = ({ routes, activePath, openPaths }) => {
  const [mountedPaths, setMountedPaths] = React.useState<readonly string[]>(() => [activePath]);

  React.useEffect(() => {
    setMountedPaths((prev) => {
      const kept = prev.filter((path) => openPaths.includes(path));
      const next = kept.includes(activePath) ? kept : [...kept, activePath];
      // 无实际变化时返回原引用，避免多余渲染。
      return next.length === prev.length && next.every((path, index) => path === prev[index])
        ? prev
        : next;
    });
  }, [activePath, openPaths]);

  if (!routes.some((route) => route.path === activePath)) {
    return <Navigate to={DEFAULT_PATH} replace />;
  }

  // 首次进入新页面时 effect 尚未补齐，渲染阶段先补一帧，避免空白闪烁。
  const visiblePaths = mountedPaths.includes(activePath) ? mountedPaths : [...mountedPaths, activePath];
  const visibleRoutes = visiblePaths
    .map((path) => routes.find((route) => route.path === path))
    .filter((route): route is AppRoute => Boolean(route));

  return (
    <>
      {visibleRoutes.map((route) => (
        <PageContainer key={route.path} active={route.path === activePath}>
          {/* 每个页面独立 Suspense：某个懒加载页面加载时不影响其他已挂载页面。 */}
          <React.Suspense fallback={PAGE_LOADING}>{route.element}</React.Suspense>
        </PageContainer>
      ))}
    </>
  );
};

export default KeepAliveRoutes;
