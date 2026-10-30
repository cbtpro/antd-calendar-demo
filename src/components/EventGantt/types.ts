import type { ReactNode } from 'react';
import type { Dayjs } from 'dayjs';
import type { CalendarDateMark, CalendarEvent, EventRenderInfo } from '../../shared/event';

export interface EventGanttProps<T extends CalendarEvent = CalendarEvent> {
  events: readonly T[];
  /** 编辑模式下显示起止日期拖动手柄。 */
  editable?: boolean;
  /** 整体移动时保持工作日数，由业务方保存重新计算的起止日期。 */
  onEventMove?: (event: T, range: { start: Dayjs; end: Dayjs }) => void;
  /** 两端缩放完成后由业务方保存新日期，不自动顺延工期。 */
  onEventResize?: (event: T, range: { start: Dayjs; end: Dayjs }) => void;
  /** 可同时标记调休安排和请假；补班优先于节假日、周末样式。 */
  dateMarks?: readonly CalendarDateMark[];
  /** 自定义任务在每天的片段内容，同时保留组件的布局。 */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
  /** 点击任务片段时触发，由业务方展示详情。 */
  onEventClick?: (event: T, info: EventRenderInfo) => void;
  /** 受控显示的月份，仅取月份部分。 */
  value?: Dayjs;
  defaultValue?: Dayjs;
  /** 切换月份时触发，参数为当月第一天。 */
  onChange?: (value: Dayjs) => void;
  /** 限制可查看和可拖放保存的日期范围。 */
  validRange?: readonly [Dayjs, Dayjs];
  disabledDate?: (date: Dayjs) => boolean;
}
