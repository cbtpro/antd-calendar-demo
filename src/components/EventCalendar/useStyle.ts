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

  return { styles };
};

export default useStyle;
