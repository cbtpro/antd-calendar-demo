import React from 'react';

import { Progress, theme } from 'antd';

/** 环形图直径与描边宽度，与紧凑模式下的卡片高度协调。 */
const RING_SIZE = 84;
const RING_STROKE_WIDTH = 6;

interface RingStatProps {
  /** 0~100 的整数百分比。 */
  percent: number;
  label: string;
  hint?: string;
}

/** 环形占比图 + 文字说明：突出单一比例指标。 */
const RingStat: React.FC<RingStatProps> = ({ percent, label, hint }) => {
  const { token } = theme.useToken();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: token.marginMD }}>
      <Progress
        type="circle"
        percent={percent}
        size={RING_SIZE}
        strokeWidth={RING_STROKE_WIDTH}
        strokeColor={token.colorSuccess}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: token.fontSizeLG, fontWeight: token.fontWeightStrong }}>{label}</div>
        {hint && (
          <div style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM }}>{hint}</div>
        )}
      </div>
    </div>
  );
};

export default RingStat;
