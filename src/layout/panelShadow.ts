import type { GlobalToken } from 'antd';

/** 面板朝向：决定分隔线的偏移方向。 */
export type PanelEdge = 'bottom' | 'right' | 'top';

const EDGE_OFFSET: Record<PanelEdge, string> = {
  bottom: '0 1px 0 0',
  right: '1px 0 0 0',
  top: '0 -1px 0 0',
};

/**
 * 生成面板边缘的分隔线与轻阴影，供顶栏、侧栏、标签栏、页脚统一使用。
 * 亮色模式依赖阴影营造层次；暗色模式阴影几乎不可见，由 1px 分隔线保证边界清晰。
 * 向上的阴影在版面底部会被裁切，因此 top 只保留分隔线。
 */
export function createPanelShadow(token: GlobalToken, edge: PanelEdge): string {
  const divider = `${EDGE_OFFSET[edge]} ${token.colorSplit}`;
  return edge === 'top' ? divider : `${divider}, ${token.boxShadowTertiary}`;
}
