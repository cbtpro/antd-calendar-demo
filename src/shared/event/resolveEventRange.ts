import type { Dayjs } from 'dayjs';
import { moveEventRange } from './workday';
import type { CalendarEvent, DragEdge, EventRange } from './types';

interface ResolveOptions {
  isWorking: (date: Dayjs) => boolean;
  /** 允许整体移动，对应业务方提供了 onEventMove。 */
  allowMove: boolean;
  /** 允许调整起止日期，对应业务方提供了 onEventResize。 */
  allowResize: boolean;
  disabledDate?: (date: Dayjs) => boolean;
  validRange?: readonly [Dayjs, Dayjs];
}

/** 根据拖拽落点计算新的任务区间；整体移动保留工作日数，非法目标返回 null。 */
export function resolveEventRange<T extends CalendarEvent>(
  dragging: { event: T; edge: DragEdge },
  date: Dayjs,
  { isWorking, allowMove, allowResize, disabledDate, validRange }: ResolveOptions,
): EventRange | null {
  let range: EventRange | null;
  if (dragging.edge === 'move') {
    if (!allowMove) return null;
    range = moveEventRange(dragging.event, date, isWorking);
  } else {
    if (!allowResize) return null;
    range = {
      start: dragging.edge === 'start' ? date : dragging.event.start,
      end: dragging.edge === 'end' ? date : dragging.event.end,
    };
  }
  if (!range || range.start.isAfter(range.end, 'day')) return null;
  const targets = dragging.edge === 'move' ? [range.start, range.end] : [date];
  if (targets.some((target) => disabledDate?.(target) ||
    (validRange && (target.isBefore(validRange[0], 'day') || target.isAfter(validRange[1], 'day'))))) return null;
  return range;
}
