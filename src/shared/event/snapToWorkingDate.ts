import type { Dayjs } from 'dayjs';

interface SnapToWorkingDateOptions {
  isWorking: (date: Dayjs) => boolean;
  /** 额外的可落点限制，例如 disabledDate 和 validRange。 */
  isAllowed?: (date: Dayjs) => boolean;
  /** 优先吸附方向，该侧不可用时回退到另一侧。 */
  prefer?: 'forward' | 'backward';
  /** 最大搜索天数，避免整月都无法排期时无限循环。 */
  maxOffset?: number;
}

/** 将落点吸附到最近的可排期工作日，用于拖拽时自动排斥周末、节假日和请假。 */
export function snapToWorkingDate(date: Dayjs, {
  isWorking,
  isAllowed,
  prefer = 'forward',
  maxOffset = 62,
}: SnapToWorkingDateOptions): Dayjs | null {
  if (!date.isValid()) return null;
  const base = date.startOf('day');
  const canPlace = (candidate: Dayjs) => isWorking(candidate) && (!isAllowed || isAllowed(candidate));
  if (canPlace(base)) return base;

  // 先在偏好方向连续搜索，确保落点不会因中途遇到周末就退回更早的日期。
  const directions = prefer === 'forward' ? [1, -1] : [-1, 1];
  for (const direction of directions) {
    for (let offset = 1; offset <= maxOffset; offset += 1) {
      const candidate = base.add(offset * direction, 'day');
      if (canPlace(candidate)) return candidate;
    }
  }
  return null;
}
