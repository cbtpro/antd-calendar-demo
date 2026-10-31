import React from 'react';

import { Card, theme } from 'antd';

import type { StatCardProps, StatCardTone } from './types';

/** 图标底色配色全部来自主题 token，页面只声明语义（tone）。 */
const buildTonePalette = (token: ReturnType<typeof theme.useToken>['token']) => ({
  primary: { color: token.colorPrimary, background: token.colorPrimaryBg },
  success: { color: token.colorSuccess, background: token.colorSuccessBg },
  warning: { color: token.colorWarning, background: token.colorWarningBg },
  error: { color: token.colorError, background: token.colorErrorBg },
}) as Record<StatCardTone, { color: string; background: string }>;

/** 指标卡：左侧语义化图标，右侧标签 + 数值 + 说明，用于仪表盘概览。 */
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, hint, tone = 'primary' }) => {
  const { token } = theme.useToken();
  const palette = buildTonePalette(token)[tone];

  return (
    <Card size="small" styles={{ body: { padding: token.paddingSM } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: token.controlHeightLG,
            height: token.controlHeightLG,
            borderRadius: token.borderRadiusLG,
            fontSize: token.fontSizeLG,
            color: palette.color,
            background: palette.background,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>{label}</div>
          <div
            style={{
              color: token.colorText,
              fontSize: token.fontSizeHeading4,
              fontWeight: token.fontWeightStrong,
              lineHeight: token.lineHeightHeading4,
            }}
          >
            {value}
          </div>
          {hint && (
            <div style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM }}>{hint}</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
