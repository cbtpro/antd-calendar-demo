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

export interface EventRange {
  start: Dayjs;
  end: Dayjs;
}

/** 拖动任务主体为整体移动，拖动两端为调整起止日期。 */
export type DragEdge = 'start' | 'end' | 'move';
