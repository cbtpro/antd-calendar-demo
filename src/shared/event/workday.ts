import type { Dayjs } from 'dayjs';
import type { CalendarDateMark, CalendarEvent } from './types';

/** 请假优先；补班覆盖节假日和周末。 */
export function isWorkingDate(date: Dayjs, marks: readonly CalendarDateMark[]) {
  if (marks.some((mark) => mark.type === 'leave')) return false;
  if (marks.some((mark) => mark.type === 'workday')) return true;
  return !marks.some((mark) => mark.type === 'holiday') && date.day() !== 0 && date.day() !== 6;
}

/** 统计包含首尾日期的有效工作日数，与任务整体移动使用相同口径。 */
export function countWorkingDays(
  event: Pick<CalendarEvent, 'start' | 'end'>,
  isWorking: (date: Dayjs) => boolean,
) {
  let count = 0;
  for (let date = event.start.startOf('day'); !date.isAfter(event.end, 'day'); date = date.add(1, 'day')) {
    if (isWorking(date)) count += 1;
  }
  return count;
}

/** 保留原区间内的工作日数，落点为新开始日期，非工作日不消耗工期。 */
export function moveEventRange(
  event: Pick<CalendarEvent, 'start' | 'end'>,
  target: Dayjs,
  isWorking: (date: Dayjs) => boolean,
) {
  if (!target.isValid() || !event.start.isValid() || !event.end.isValid() || event.start.isAfter(event.end, 'day')) return null;
  let remaining = countWorkingDays(event, isWorking);
  // 没有工作量的任务不自动推算，仍可通过两端手柄调整。
  if (!remaining) return null;
  const start = target.startOf('day');
  if (start.isSame(event.start, 'day')) return { start: event.start, end: event.end };
  let end = start;
  while (remaining > 0) {
    if (isWorking(end)) remaining -= 1;
    if (remaining > 0) end = end.add(1, 'day');
  }
  return { start, end };
}
