import type { ReactNode } from 'react';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';

export interface CalendarEvent {
  /** 在当前日历中唯一的任务标识。 */
  key: string;
  title: string;
  /** 开始日期和结束日期都计入任务占用范围。 */
  start: Dayjs;
  end: Dayjs;
  /** 默认使用当前主题的主色。 */
  color?: string;
}

/** 日期标记由业务方提供，周末由组件自动识别。 */
export interface CalendarDateMark {
  date: Dayjs;
  type: 'holiday' | 'workday' | 'leave';
  /** 悬停和无障碍说明，例如元旦、补班、年假。 */
  label?: string;
}

export interface EventRenderInfo {
  /** 当前片段是否为计入工作量的日期，供自定义渲染和点击回调使用。 */
  isWorkingDay: boolean;
  date: Dayjs;
  lane: number;
  position: 'start' | 'middle' | 'end' | 'single';
}

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
  /** 可同时标记调休安排和请假；补班优先于节假日、周末样式。 */
  dateMarks?: readonly CalendarDateMark[];
  /** 自定义任务在每天的片段内容，同时保留组件的布局。 */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
  /** 点击任务片段时触发，由业务方展示详情；不会触发日期选择。 */
  onEventClick?: (event: T, info: EventRenderInfo) => void;
};
