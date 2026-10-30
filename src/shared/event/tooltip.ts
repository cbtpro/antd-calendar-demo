import type { Dayjs } from 'dayjs';
import { countWorkingDays } from './workday';
import type { CalendarEvent } from './types';

/** 任务悬停提示文案，日历和甘特图保持一致。 */
export const getEventTooltipText = (event: CalendarEvent, isWorking: (date: Dayjs) => boolean) =>
  [
    event.title,
    `日期：${event.start.format('YYYY-MM-DD')} 至 ${event.end.format('YYYY-MM-DD')}`,
    `任务时长：${event.end.startOf('day').diff(event.start.startOf('day'), 'day') + 1} 个自然日`,
    `有效工期：${countWorkingDays(event, isWorking)} 个工作日`,
  ].join('\n');
