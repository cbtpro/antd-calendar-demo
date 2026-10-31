import type { Dayjs } from 'dayjs';

import type { CalendarDateMark, CalendarEvent } from '../event/types';

export interface DistributionItem {
  label: string;
  value: number;
  /** 占整体的比例，0~1，用于绘制条形长度。 */
  ratio: number;
}

/** 任务标题冒号前的前缀视为任务类型，未标注的归入「其他」。 */
const TYPE_SEPARATOR = '：';
const FALLBACK_TYPE = '其他';

/** 时长分档阈值集中在此，调整分档只改这一张表。 */
const DURATION_BUCKETS: readonly { label: string; maxDays: number }[] = [
  { label: '1-2 天', maxDays: 2 },
  { label: '3-5 天', maxDays: 5 },
  { label: '6 天以上', maxDays: Number.POSITIVE_INFINITY },
];

const countInclusiveDays = (event: CalendarEvent): number => (
  event.end.startOf('day').diff(event.start.startOf('day'), 'day') + 1
);

const isOngoing = (event: CalendarEvent, today: Dayjs): boolean => (
  !today.isBefore(event.start, 'day') && !today.isAfter(event.end, 'day')
);

const toDistribution = (
  counts: ReadonlyMap<string, number>,
  sort: 'none' | 'desc',
): DistributionItem[] => {
  let total = 0;
  counts.forEach((value) => {
    total += value;
  });
  const items: DistributionItem[] = [];
  counts.forEach((value, label) => {
    items.push({ label, value, ratio: total > 0 ? value / total : 0 });
  });
  return sort === 'desc' ? items.sort((left, right) => right.value - left.value) : items;
};

/** 按任务类型统计数量，用于类型分布图。 */
export function buildTypeDistribution(events: readonly CalendarEvent[]): DistributionItem[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const type = event.title.includes(TYPE_SEPARATOR)
      ? event.title.slice(0, event.title.indexOf(TYPE_SEPARATOR))
      : FALLBACK_TYPE;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return toDistribution(counts, 'desc');
}

/** 按持续天数分档统计数量，保持分档顺序以便图表从短到长阅读。 */
export function buildDurationDistribution(events: readonly CalendarEvent[]): DistributionItem[] {
  const counts = new Map<string, number>(DURATION_BUCKETS.map((bucket) => [bucket.label, 0]));
  for (const event of events) {
    const days = countInclusiveDays(event);
    const bucket = DURATION_BUCKETS.find((item) => days <= item.maxDays)
      ?? DURATION_BUCKETS[DURATION_BUCKETS.length - 1];
    counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1);
  }
  return toDistribution(counts, 'none');
}

/** 筛选今天仍在执行的任务。 */
export function filterOngoing(events: readonly CalendarEvent[], today: Dayjs): CalendarEvent[] {
  return events.filter((event) => isOngoing(event, today));
}

/** 统计今天仍在执行的任务数量。 */
export function countOngoing(events: readonly CalendarEvent[], today: Dayjs): number {
  return filterOngoing(events, today).length;
}

/** 按类型统计日期标记数量。 */
export function countDateMarks(marks: readonly CalendarDateMark[], type: CalendarDateMark['type']): number {
  return marks.filter((mark) => mark.type === type).length;
}

/** 进行中占比（整数百分比），无任务时返回 0。 */
export function getOngoingRatio(ongoing: number, total: number): number {
  return total > 0 ? Math.round((ongoing / total) * 100) : 0;
}
