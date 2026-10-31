/** 路由标签页的数据模型，全部为纯函数，便于单独验证关闭/锚定规则。 */
export type TabMenuAction = 'close' | 'pin' | 'closeLeft' | 'closeRight' | 'closeAll';

export interface RouteTab {
  /** 路由路径，同时作为标签页唯一标识。 */
  pathname: string;
  title: string;
  /** 查询参数与锚点跟随标签页保存，刷新或切回时原样还原。 */
  search: string;
  hash: string;
  /** 锚定标签不可关闭，且始终排在未锚定标签之前。 */
  pinned: boolean;
  /** 固定标签由路由配置决定，永远不可关闭或取消锚定。 */
  fixed: boolean;
}

/** 标签页是否受固定规则保护，固定标签同时视为锚定。 */
const isProtected = (tab: RouteTab): boolean => tab.pinned || tab.fixed;

const pinFirst = (tabs: RouteTab[]): RouteTab[] => {
  const pinned = tabs.filter((tab) => isProtected(tab));
  const rest = tabs.filter((tab) => !isProtected(tab));
  return [...pinned, ...rest];
};

/** 写入或更新标签：同一路径只保留一个标签，重复进入仅刷新其路由参数。 */
export function upsertTab(tabs: readonly RouteTab[], tab: RouteTab): RouteTab[] {
  const index = tabs.findIndex((item) => item.pathname === tab.pathname);
  if (index === -1) return [...tabs, tab];
  const next = [...tabs];
  const current = next[index];
  next[index] = {
    ...current,
    title: tab.title,
    search: tab.search,
    hash: tab.hash,
    fixed: tab.fixed,
    // 固定标签必须保持锚定，防止历史数据里的脏值绕过保护。
    pinned: tab.fixed || current.pinned,
  };
  return next;
}

/** 锚定状态切换后重新分组，保证锚定标签集中在最前；固定标签保持不变。 */
export function togglePin(tabs: readonly RouteTab[], pathname: string): RouteTab[] {
  return pinFirst(tabs.map((tab) =>
    (tab.pathname === pathname && !tab.fixed ? { ...tab, pinned: !tab.pinned } : tab)));
}

/** 关闭单个标签；锚定或固定标签忽略关闭操作。 */
export function closeTab(tabs: readonly RouteTab[], pathname: string): RouteTab[] {
  if (tabs.some((tab) => tab.pathname === pathname && isProtected(tab))) return [...tabs];
  return tabs.filter((tab) => tab.pathname !== pathname);
}

/** 关闭指定标签左侧所有未受保护的标签。 */
export function closeLeftTabs(tabs: readonly RouteTab[], pathname: string): RouteTab[] {
  const index = tabs.findIndex((tab) => tab.pathname === pathname);
  if (index < 0) return [...tabs];
  return tabs.filter((tab, position) => position >= index || isProtected(tab));
}

/** 关闭指定标签右侧所有未受保护的标签。 */
export function closeRightTabs(tabs: readonly RouteTab[], pathname: string): RouteTab[] {
  const index = tabs.findIndex((tab) => tab.pathname === pathname);
  if (index < 0) return [...tabs];
  return tabs.filter((tab, position) => position <= index || isProtected(tab));
}

/** 关闭全部未受保护的标签。 */
export function closeAllTabs(tabs: readonly RouteTab[]): RouteTab[] {
  return tabs.filter(isProtected);
}

export function hasClosableLeft(tabs: readonly RouteTab[], pathname: string): boolean {
  const index = tabs.findIndex((tab) => tab.pathname === pathname);
  return index > 0 && tabs.slice(0, index).some((tab) => !isProtected(tab));
}

export function hasClosableRight(tabs: readonly RouteTab[], pathname: string): boolean {
  const index = tabs.findIndex((tab) => tab.pathname === pathname);
  return index >= 0 && index < tabs.length - 1 && tabs.slice(index + 1).some((tab) => !isProtected(tab));
}

export function hasClosableTab(tabs: readonly RouteTab[]): boolean {
  return tabs.some((tab) => !isProtected(tab));
}
