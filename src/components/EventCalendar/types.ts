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

export interface EventRenderInfo {
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
  /** 自定义任务在每天的片段内容，同时保留组件的布局。 */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
  /** 点击任务片段时触发，由业务方展示详情；不会触发日期选择。 */
  onEventClick?: (event: T, info: EventRenderInfo) => void;
};
