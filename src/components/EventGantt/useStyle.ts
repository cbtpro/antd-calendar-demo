import { useMemo } from 'react';
import { css } from '@emotion/react';
import { theme } from 'antd';

const useStyle = () => {
  const { token } = theme.useToken();

  return useMemo(() => {
    const {
      controlHeight,
      controlHeightSM,
      marginXXS,
      marginXS,
      colorTextLightSolid,
      fontSizeSM,
      paddingXXS,
      paddingSM,
    } = token;
    const barHeight = `calc(${controlHeightSM}px - ${marginXXS}px)`;

    return {
      toolbar: css`
        display: flex;
        align-items: center;
        gap: ${marginXS}px;
        margin-bottom: ${marginXS}px;
      `,
      title: css`
        margin-inline-start: ${marginXXS}px;
        font-size: ${token.fontSizeLG}px;
        font-weight: 500;
      `,
      scroller: css`
        overflow-x: auto;
        border: 1px solid ${token.colorBorderSecondary};
      `,
      grid: css`
        display: grid;
        grid-auto-rows: minmax(calc(${controlHeight}px + ${marginXXS}px), auto);
        width: max-content;
        min-width: 100%;
      `,
      cornerCell: css`
        position: sticky;
        inset-inline-start: 0;
        z-index: 3;
        display: flex;
        align-items: center;
        padding-inline: ${paddingSM}px;
        font-weight: 500;
        background: ${token.colorFillQuaternary};
        border-inline-end: 1px solid ${token.colorBorderSecondary};
        border-block-end: 1px solid ${token.colorBorderSecondary};
      `,
      headerCell: css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding-block: ${paddingXXS}px;
        font-size: ${fontSizeSM}px;
        background: ${token.colorFillQuaternary};
        border-inline-start: 1px solid ${token.colorBorderSecondary};
        border-block-end: 1px solid ${token.colorBorderSecondary};
        &[data-today='true'] {
          color: ${token.colorPrimary};
          font-weight: 600;
        }
        &[data-disabled='true'] {
          color: ${token.colorTextDisabled};
        }
      `,
      badges: css`
        display: flex;
        gap: 2px;
        min-height: 18px;
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
      labelCell: css`
        position: sticky;
        inset-inline-start: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        padding-inline: ${paddingSM}px;
        font-size: ${fontSizeSM}px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        background: ${token.colorBgContainer};
        border-inline-end: 1px solid ${token.colorBorderSecondary};
        border-block-end: 1px solid ${token.colorBorderSecondary};
      `,
      dayCell: css`
        border-inline-start: 1px solid ${token.colorBorderSecondary};
        border-block-end: 1px solid ${token.colorBorderSecondary};
        &[data-holiday='true'] {
          background: ${token.colorError}14;
        }
        &[data-today='true'] {
          background: ${token.colorPrimary}0f;
        }
        &[data-disabled='true'] {
          background: ${token.colorFillQuaternary};
        }
        &[data-drop-target='true'] {
          outline: 2px dashed ${token.colorPrimary};
          outline-offset: -2px;
        }
      `,
      bar: css`
        position: relative;
        z-index: 1;
        &:hover [data-resize-edge] { opacity: 1; }
        display: block;
        align-self: center;
        height: ${barHeight};
        line-height: ${barHeight};
        overflow: hidden;
        color: ${colorTextLightSolid};
        font-size: ${fontSizeSM}px;
        white-space: nowrap;
        text-overflow: ellipsis;
      `,
      draggingBar: css`
        /* 同一任务的所有可见片段一起淡化，阴影不改变行布局。 */
        opacity: 0.5;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
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
        padding-inline-start: ${paddingXXS}px;
      `,
      barMiddle: css``,
      barEnd: css``,
      barSingle: css`
        padding-inline-start: ${paddingXXS}px;
      `,
      resizeHandle: css`
        position: absolute;
        top: 0;
        bottom: 0;
        width: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.55);
        color: #fff;
        cursor: ew-resize;
        opacity: 0;
        z-index: 1;
        &[data-resize-edge='start'] { inset-inline-start: 0; }
        &[data-resize-edge='end'] { inset-inline-end: 0; }
      `,
    };
  }, [token]);
};

export default useStyle;
