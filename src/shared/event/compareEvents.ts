import type { CalendarEvent } from './types';

/** 统一的任务排序口径：开始日期升序、结束日期降序、标识字典序。 */
export const compareEvents = <T extends Pick<CalendarEvent, 'key' | 'start' | 'end'>>(a: T, b: T) =>
  a.start.startOf('day').valueOf() - b.start.startOf('day').valueOf() ||
  b.end.startOf('day').valueOf() - a.end.startOf('day').valueOf() ||
  a.key.localeCompare(b.key);
