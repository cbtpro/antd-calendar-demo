import { findRoute } from './routes';
import type { RouteTab } from './tabModel';

/** 标签集合持久化键，刷新后据此恢复打开的标签。 */
const STORAGE_KEY = 'event-calendar-demo:route-tabs';

const readText = (value: unknown): string => (typeof value === 'string' ? value : '');

/** 读取上次会话的标签：丢弃结构损坏、路由已移除的条目。 */
export function loadTabs(): RouteTab[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const pathname = (item as { pathname?: unknown }).pathname;
      if (typeof pathname !== 'string') return [];
      const route = findRoute(pathname);
      if (!route) return [];
      return [{
        pathname,
        // 标题始终以路由配置为准，避免历史数据里的旧名称残留。
        title: route.title,
        search: readText((item as { search?: unknown }).search),
        hash: readText((item as { hash?: unknown }).hash),
        fixed: Boolean(route.fixed),
        // 固定标签必须锚定，历史数据中的 pinned=false 不允许生效。
        pinned: Boolean(route.fixed) || Boolean((item as { pinned?: unknown }).pinned),
      }];
    });
  } catch {
    // 存储不可用或数据损坏时退回空集合，由路由同步逻辑补齐默认标签。
    return [];
  }
}

export function saveTabs(tabs: readonly RouteTab[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    // 存储不可用时只影响刷新恢复，不影响当前会话。
  }
}
