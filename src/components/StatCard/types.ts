import type React from 'react';

/** 卡片强调色，决定图标底色的语义化配色。 */
export type StatCardTone = 'primary' | 'success' | 'warning' | 'error';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  /** 数值下方的补充说明，省略则不渲染。 */
  hint?: string;
  tone?: StatCardTone;
}
