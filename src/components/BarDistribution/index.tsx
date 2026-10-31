import React from 'react';

import { theme, Typography } from 'antd';

import type { DistributionItem } from '../../shared/dashboard/analytics';

const { Text } = Typography;

export type BarDistributionTone = 'primary' | 'success';

interface BarDistributionProps {
  items: readonly DistributionItem[];
  tone?: BarDistributionTone;
  unit?: string;
}

/** 横向条形图 + 文字标签：用于任务类型、时长等分布展示。 */
const BarDistribution: React.FC<BarDistributionProps> = ({ items, tone = 'primary', unit = '个' }) => {
  const { token } = theme.useToken();
  const fillColor = tone === 'success' ? token.colorSuccess : token.colorPrimary;

  if (items.length === 0) return <Text type="secondary">暂无数据</Text>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.marginSM }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
            <span>{item.label}</span>
            <span>{`${item.value} ${unit}`}</span>
          </div>
          <div
            style={{
              marginTop: token.marginXXS,
              height: token.sizeXS,
              borderRadius: token.borderRadiusSM,
              background: token.colorFillTertiary,
            }}
          >
            <div
              style={{
                width: `${Math.round(item.ratio * 100)}%`,
                height: '100%',
                borderRadius: token.borderRadiusSM,
                background: fillColor,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarDistribution;
