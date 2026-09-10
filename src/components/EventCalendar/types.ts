import type { ReactNode } from 'react';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';

export interface CalendarEvent {
  /** Unique within this calendar. */
  key: string;
  title: string;
  /** Both start and end dates are inclusive. */
  start: Dayjs;
  end: Dayjs;
  /** Defaults to the current theme's primary color. */
  color?: string;
}

export interface EventRenderInfo {
  date: Dayjs;
  lane: number;
  position: 'start' | 'middle' | 'end' | 'single';
}

export type EventCalendarProps<T extends CalendarEvent = CalendarEvent> = Omit<
  CalendarProps<Dayjs>,
  | 'cellRender'
  | 'fullCellRender'
  | 'dateCellRender'
  | 'dateFullCellRender'
  | 'monthCellRender'
  | 'monthFullCellRender'
> & {
  events: readonly T[];
  /** Customizes each daily segment's content while retaining its layout. */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
};
