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
    // End dates are inclusive: a lane can only be reused on a later day.
    const availableLane = laneEnds.findIndex((end) => end.isBefore(event.start, 'day'));
    const lane = availableLane === -1 ? laneEnds.length : availableLane;
    laneEnds[lane] = event.end;

    return { ...event, lane };
  });
};
