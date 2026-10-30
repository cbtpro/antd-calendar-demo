import type { Dayjs } from 'dayjs';
import { compareEvents } from '../../shared/event';
import type { CalendarEvent } from '../../shared/event';

type EventRange = Pick<CalendarEvent, 'key' | 'start' | 'end'>;

export const assignEventLanes = <T extends EventRange>(events: readonly T[]) => {
  const laneEnds: Dayjs[] = [];
  const sortedEvents = [...events].sort(compareEvents);

  return sortedEvents.map((event) => {
    // 结束日仍被任务占用，泳道只能从结束日的下一天开始复用。
    const availableLane = laneEnds.findIndex((end) => end.isBefore(event.start, 'day'));
    const lane = availableLane === -1 ? laneEnds.length : availableLane;
    laneEnds[lane] = event.end;

    return { ...event, lane };
  });
};
