import { useContext, useMemo } from 'react';
import { css } from '@emotion/react';
import { ConfigProvider, theme } from 'antd';

const useStyle = (customizePrefixCls?: string) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('picker', customizePrefixCls);
  const { token } = theme.useToken();

  const styles = useMemo(() => {
    const barRadius = 999;

    const {
      controlHeight,
      marginXXS,
      controlHeightSM,
      colorTextLightSolid,
      fontSizeSM,
      paddingXS,
      marginXS,
      paddingXXS,
    } = token;

    return {
      calendar: css`
        /* 仅作用于当前日历，覆盖 Ant Design 默认的溢出设置。 */
        &&& .${prefixCls}-calendar-date-content {
          overflow: visible;
        }
      `,
      date: css`
        position: relative;
        isolation: isolate;
      `,
      holiday: css`
        &::after {
          content: '';
          position: absolute;
          z-index: -1;
          inset: 0;
          background: ${token.colorError};
          opacity: 0.08;
          pointer-events: none;
        }
      `,
      dateHeader: css`
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: ${marginXXS}px;
      `,
      redDate: css`
        && { color: ${token.colorError}; }
      `,
      badge: css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        border-radius: 3px;
        color: #fff;
        font-size: 12px;
        line-height: 1;
        background: #757575;
      `,
      holidayBadge: css`
        background: ${token.colorError};
      `,
      cell: css`
        min-height: ${controlHeight}px;
      `,
      list: css`
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-auto-rows: calc(${controlHeightSM}px - ${marginXXS}px);
        gap: ${marginXXS}px;
        margin-top: ${marginXXS}px;
      `,
      bar: css`
        display: block;
        height: calc(${controlHeightSM}px - ${marginXXS}px);
        overflow: hidden;
        color: ${colorTextLightSolid};
        font-size: ${fontSizeSM}px;
        white-space: nowrap;
        text-overflow: ellipsis;
      `,
      nonWorkingBar: css`
        /* 边框计入片段尺寸，中间片段不画左右边框，保持跨天连接。 */
        box-sizing: border-box;
        border: 1px dashed rgba(128, 128, 128, 0.5);
        border-inline-width: 0;
        background-color: rgba(128, 128, 128, 0.3);
        color: ${token.colorText};

        &[data-range-position='start'],
        &[data-range-position='single'] {
          border-inline-start-width: 1px;
        }

        &[data-range-position='end'],
        &[data-range-position='single'] {
          border-inline-end-width: 1px;
        }
      `,
      barStart: css`
        margin-inline-end: calc(-1 * (${paddingXS}px + ${marginXS}px / 2));
        padding-inline-start: calc(${paddingXXS}px + ${paddingXXS}px);
        border-start-start-radius: ${barRadius}px;
        border-end-start-radius: ${barRadius}px;
      `,
      barMiddle: css`
        margin-inline: calc(-1 * (${paddingXS}px + ${marginXS}px / 2));
      `,
      barEnd: css`
        margin-inline-start: calc(-1 * (${paddingXS}px + ${marginXS}px / 2));
        border-start-end-radius: ${barRadius}px;
        border-end-end-radius: ${barRadius}px;
      `,
      barSingle: css`
        padding-inline-start: calc(${paddingXXS}px + ${paddingXXS}px);
        border-radius: ${barRadius}px;
      `,
    };
  }, [token, prefixCls]);

  return { styles, prefixCls };
};

export default useStyle;
