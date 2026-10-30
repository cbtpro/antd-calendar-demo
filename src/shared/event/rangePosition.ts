import type { Dayjs } from 'dayjs';
import type { CalendarEvent, EventRenderInfo } from './types';

/** 任务片段在日期内的位置，日历和甘特图共用同一判定。 */
export const getRangePosition = (date: Dayjs, event: CalendarEvent): EventRenderInfo['position'] => {
  const starts = date.isSame(event.start, 'day');
  const ends = date.isSame(event.end, 'day');

  if (starts && ends) return 'single';
  if (starts) return 'start';
  if (ends) return 'end';
  return 'middle';
};
