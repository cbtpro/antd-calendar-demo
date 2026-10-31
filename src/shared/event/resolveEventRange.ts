import type { Dayjs } from 'dayjs';
import { moveEventRange } from './workday';
import { snapToWorkingDate } from './snapToWorkingDate';
import type { CalendarEvent, DragEdge, ResolvedEventRange } from './types';

interface ResolveOptions {
  isWorking: (date: Dayjs) => boolean;
  /** 允许整体移动，对应业务方提供了 onEventMove。 */
  allowMove: boolean;
  /** 允许调整起止日期，对应业务方提供了 onEventResize。 */
  allowResize: boolean;
  disabledDate?: (date: Dayjs) => boolean;
  validRange?: readonly [Dayjs, Dayjs];
}

/** 根据拖拽落点计算新的任务区间；落点自动吸附工作日，整体移动保留工作日数，非法目标返回 null。 */
export function resolveEventRange<T extends CalendarEvent>(
  dragging: { event: T; edge: DragEdge },
  date: Dayjs,
  { isWorking, allowMove, allowResize, disabledDate, validRange }: ResolveOptions,
): ResolvedEventRange | null {
  const isAllowed = (target: Dayjs) =>
    !disabledDate?.(target) &&
    (!validRange || (!target.isBefore(validRange[0], 'day') && !target.isAfter(validRange[1], 'day')));

  let range: ResolvedEventRange['range'] | null;
  let snapped: Dayjs | null;
  if (dragging.edge === 'move') {
    if (!allowMove) return null;
    // 整体移动优先向后吸附，避免落点被拉到更早的工作日而压缩工期。
    snapped = snapToWorkingDate(date, { isWorking, isAllowed, prefer: 'forward' });
    if (!snapped) return null;
    range = moveEventRange(dragging.event, snapped, isWorking);
    // 任务结束日期同样不能越过可排期边界。
    if (range && !isAllowed(range.end)) return null;
  } else {
    if (!allowResize) return null;
    // 起点优先向后、终点优先向前吸附；一侧越界或成非法区间时自动改试另一侧。
    snapped = snapToWorkingDate(date, {
      isWorking,
      isAllowed: (target) => isAllowed(target) &&
        (dragging.edge === 'start'
          ? !target.isAfter(dragging.event.end, 'day')
          : !target.isBefore(dragging.event.start, 'day')),
      prefer: dragging.edge === 'start' ? 'forward' : 'backward',
    });
    if (!snapped) return null;
    range = {
      start: dragging.edge === 'start' ? snapped : dragging.event.start,
      end: dragging.edge === 'end' ? snapped : dragging.event.end,
    };
  }
  if (!range || range.start.isAfter(range.end, 'day')) return null;

  const requested = date.startOf('day');
  return snapped.isSame(requested, 'day') ? { range } : { range, snappedFrom: requested };
}
