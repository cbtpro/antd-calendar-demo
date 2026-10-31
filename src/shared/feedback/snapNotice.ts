import type { Dayjs } from 'dayjs';
import type { CalendarDateMark } from '../event';
import { getNonWorkingReason } from '../event';
import { showToast } from './toast';

const REASON_LABELS = {
  weekend: '周末',
  holiday: '节假日',
  leave: '请假',
} as const;

const formatDay = (date: Dayjs) => date.format('M月D日');

/** 落点落在休息日被吸附时提示实际排期位置，避免用户误以为任务允许排在休息日。 */
export function notifySnappedDrop(requested: Dayjs, applied: Dayjs, marks: readonly CalendarDateMark[]) {
  const reason = getNonWorkingReason(requested, marks);
  const reasonText = reason ? REASON_LABELS[reason] : '非工作日';
  showToast(`落点 ${formatDay(requested)} 为${reasonText}，已吸附到 ${formatDay(applied)}`, 'info');
}

/** 拖放目标无法排期时提示，说明该位置超出了可编辑范围。 */
export function notifyDropRejected() {
  showToast('该日期不可排期，任务保持原位', 'warning');
}
