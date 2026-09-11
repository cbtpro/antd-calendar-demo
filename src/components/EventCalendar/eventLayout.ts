import type { Dayjs } from 'dayjs';

interface EventRange {
  key: string;
  start: Dayjs;
  end: Dayjs;
}

export const assignEventLanes = <T extends EventRange>(events: readonly T[]) => {
  const laneEnds: Dayjs[] = [];
  const sortedEvents = [...events].sort(
    (a, b) =>
      a.start.startOf('day').valueOf() - b.start.startOf('day').valueOf() ||
      b.end.startOf('day').valueOf() - a.end.startOf('day').valueOf() ||
      a.key.localeCompare(b.key),
  );

  return sortedEvents.map((event) => {
    // 结束日仍被任务占用，泳道只能从结束日的下一天开始复用。
    const availableLane = laneEnds.findIndex((end) => end.isBefore(event.start, 'day'));
    const lane = availableLane === -1 ? laneEnds.length : availableLane;
    laneEnds[lane] = event.end;

    return { ...event, lane };
  });
};
