import type { ReactNode } from 'react';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import type { CalendarDateMark, CalendarEvent, EventRenderInfo } from '../../shared/event';

export type { CalendarDateMark, CalendarEvent, EventRenderInfo };

export type EventCalendarProps<T extends CalendarEvent = CalendarEvent> = Omit<
  CalendarProps<Dayjs>,
  | 'styles'
  | 'classNames'
  | 'cellRender'
  | 'fullCellRender'
  | 'dateCellRender'
  | 'dateFullCellRender'
  | 'monthCellRender'
  | 'monthFullCellRender'
> & {
  events: readonly T[];
  /** 编辑模式下显示起止日期拖动手柄。 */
  editable?: boolean;
  /** 整体移动时保持工作日数，由业务方保存重新计算的起止日期。 */
  onEventMove?: (event: T, range: { start: Dayjs; end: Dayjs }) => void;
  /** 两端缩放完成后由业务方保存新日期，不自动顺延工期。 */
  onEventResize?: (event: T, range: { start: Dayjs; end: Dayjs }) => void;
  /** 可同时标记调休安排和请假；补班优先于节假日、周末样式。 */
  dateMarks?: readonly CalendarDateMark[];
  /** 自定义任务在每天的片段内容，同时保留组件的布局。 */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
  /** 点击任务片段时触发，由业务方展示详情；不会触发日期选择。 */
  onEventClick?: (event: T, info: EventRenderInfo) => void;
};
