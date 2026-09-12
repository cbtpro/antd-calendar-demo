/** @jsxImportSource @emotion/react */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Tooltip, theme } from 'antd';
import type { CalendarProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { countWorkingDays, isWorkingDate, moveEventRange } from './workday';
import { assignEventLanes } from './eventLayout';
import useStyle from './useStyle';
import type { CalendarDateMark, CalendarEvent, EventCalendarProps, EventRenderInfo } from './types';

const getRangePosition = (date: Dayjs, event: CalendarEvent): EventRenderInfo['position'] => {
  const starts = date.isSame(event.start, 'day');
  const ends = date.isSame(event.end, 'day');

  if (starts && ends) return 'single';
  if (starts) return 'start';
  if (ends) return 'end';
  return 'middle';
};

function EventCalendar<T extends CalendarEvent = CalendarEvent>({
  events,
  renderEvent,
  onEventClick,
  dateMarks,
  editable = false,
  onEventResize,
  onEventMove,
  ...calendarProps
}: EventCalendarProps<T>) {
  const [dragging, setDragging] = useState<{ event: T; edge: 'start' | 'end' | 'move' } | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    if (!editable) {
      setDragging(null);
      setDropDate(null);
    }
  }, [editable]);
  const { token } = theme.useToken();
  const { styles, prefixCls } = useStyle(calendarProps.prefixCls);
  const layoutEvents = useMemo(() => assignEventLanes(events), [events]);

  const marksByDate = useMemo(() => {
    const result = new Map<string, CalendarDateMark[]>();
    for (const mark of dateMarks ?? []) {
      const key = mark.date.format('YYYY-MM-DD');
      result.set(key, [...(result.get(key) ?? []), mark]);
    }
    return result;
  }, [dateMarks]);

  const isWorking = useCallback((date: Dayjs) =>
    isWorkingDate(date, marksByDate.get(date.format('YYYY-MM-DD')) ?? []), [marksByDate]);
  // 每条任务只计算一次提示内容，避免为每天的片段重复统计工期。
  const eventTitles = useMemo(() => new Map(events.map((event) => [
    event.key,
    [
      event.title,
      `日期：${event.start.format('YYYY-MM-DD')} 至 ${event.end.format('YYYY-MM-DD')}`,
      `任务时长：${event.end.startOf('day').diff(event.start.startOf('day'), 'day') + 1} 个自然日`,
      `有效工期：${countWorkingDays(event, isWorking)} 个工作日`,
    ].join('\n'),
  ])), [events, isWorking]);
  const resizeRange = useCallback((date: Dayjs) => {
    if (!editable || !dragging) return null;
    let range: { start: Dayjs; end: Dayjs } | null;
    if (dragging.edge === 'move') {
      if (!onEventMove) return null;
      range = moveEventRange(dragging.event, date, isWorking);
    } else {
      if (!onEventResize) return null;
      range = {
        start: dragging.edge === 'start' ? date : dragging.event.start,
        end: dragging.edge === 'end' ? date : dragging.event.end,
      };
    }
    if (!range || range.start.isAfter(range.end, 'day')) return null;
    const targets = dragging.edge === 'move' ? [range.start, range.end] : [date];
    const validRange = calendarProps.validRange;
    if (targets.some((target) => calendarProps.disabledDate?.(target) ||
      (validRange && (target.isBefore(validRange[0], 'day') || target.isAfter(validRange[1], 'day'))))) return null;
    return range;
  }, [editable, dragging, onEventResize, onEventMove, isWorking, calendarProps.disabledDate, calendarProps.validRange]);

  const dateCellRender = useCallback<NonNullable<CalendarProps<Dayjs>['dateCellRender']>>(
    (date) => {
      const isWorkingDay = isWorking(date);
      const currentEvents = layoutEvents.filter(
        (event) => !date.isBefore(event.start, 'day') && !date.isAfter(event.end, 'day'),
      );

      return (
        <div css={styles.cell}>
          <div css={styles.list}>
            {currentEvents.map((event) => {
              const position = getRangePosition(date, event);
              const rangeStyle = {
                start: styles.barStart,
                middle: styles.barMiddle,
                end: styles.barEnd,
                single: styles.barSingle,
              }[position];

              return (
                <Tooltip
                  key={event.key}
                  title={<div style={{ whiteSpace: 'pre-line' }}>{eventTitles.get(event.key)}</div>}
                  open={dragging ? false : undefined}
                >
                  <span
                    draggable={editable && Boolean(onEventMove)}
                    onDragStart={(dragEvent) => {
                      // 两端手柄会阻止冒泡，任务主体只触发整体移动。
                      if (!editable || !onEventMove) return;
                      dragEvent.stopPropagation();
                      dragEvent.dataTransfer.effectAllowed = 'move';
                      dragEvent.dataTransfer.setData('text/plain', event.key);
                      const rect = dragEvent.currentTarget.getBoundingClientRect();
                      dragEvent.dataTransfer.setDragImage(dragEvent.currentTarget,
                        Math.max(0, Math.min(rect.width, dragEvent.clientX - rect.left)),
                        Math.max(0, Math.min(rect.height, dragEvent.clientY - rect.top)));
                      suppressClick.current = true;
                      setDragging({ event, edge: 'move' });
                    }}
                    onDragEnd={() => { setDragging(null); setDropDate(null); }}
                    css={[
                      styles.bar,
                      rangeStyle,
                      !isWorkingDay && styles.nonWorkingBar,
                      dragging?.event.key === event.key && styles.draggingBar,
                    ]}
                    data-dragging={dragging?.event.key === event.key ? 'true' : undefined}
                    data-working-day={isWorkingDay}
                    data-range-position={position}
                    onPointerDown={() => { suppressClick.current = false; }}
                    role={onEventClick ? 'button' : undefined}
                    tabIndex={onEventClick ? 0 : undefined}
                    aria-label={isWorkingDay ? event.title : `${event.title}（当天不计工作量）`}
                    onClick={(clickEvent) => {
                      // 任务交互不向日期单元格冒泡，保留日历自身的日期选择逻辑。
                      clickEvent.stopPropagation();
                      if (suppressClick.current) return;
                      onEventClick?.(event, { date, lane: event.lane, position, isWorkingDay });
                    }}
                    onKeyDown={(keyEvent) => {
                      // 避免日历响应任务上的键盘操作；自定义内容自行处理内部交互。
                      keyEvent.stopPropagation();
                      if (
                        onEventClick &&
                        keyEvent.target === keyEvent.currentTarget &&
                        (keyEvent.key === 'Enter' || keyEvent.key === ' ')
                      ) {
                        keyEvent.preventDefault();
                        if (!keyEvent.repeat) {
                          onEventClick(event, { date, lane: event.lane, position, isWorkingDay });
                        }
                      }
                    }}
                    style={{
                      cursor: editable && onEventMove ? 'grab' : onEventClick ? 'pointer' : undefined,
                      backgroundColor: isWorkingDay ? event.color ?? token.colorPrimary : undefined,
                      gridRow: event.lane + 1,
                    }}
                  >
                    {editable && onEventResize && (['start', 'end'] as const).map((edge) =>
                      (position === edge || position === 'single') && (
                        <span
                          key={edge}
                          css={styles.resizeHandle}
                          data-resize-edge={edge}
                          draggable
                          title={`拖动调整${edge === 'start' ? '开始' : '结束'}日期`}
                          aria-label={`调整${event.title}的${edge === 'start' ? '开始' : '结束'}日期`}
                          onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
                          onClick={(clickEvent) => { clickEvent.stopPropagation(); }}
                          onDragStart={(dragEvent) => {
                            dragEvent.stopPropagation();
                            dragEvent.dataTransfer.effectAllowed = 'move';
                            dragEvent.dataTransfer.setData('text/plain', event.key);
                            // 使用任务片段作为鼠标拖影，避免只显示手柄图标。
                            const bar = dragEvent.currentTarget.parentElement;
                            if (bar) {
                              const rect = bar.getBoundingClientRect();
                              dragEvent.dataTransfer.setDragImage(
                                bar,
                                Math.max(0, Math.min(rect.width, dragEvent.clientX - rect.left)),
                                Math.max(0, Math.min(rect.height, dragEvent.clientY - rect.top)),
                              );
                            }
                            suppressClick.current = true;
                            setDragging({ event, edge });
                          }}
                          onDragEnd={() => { setDragging(null); setDropDate(null); }}
                        >↔</span>
                      ),
                    )}
                    {renderEvent
                      ? renderEvent(event, { date, lane: event.lane, position, isWorkingDay })
                      : position === 'start' || position === 'single'
                        ? event.title
                        : null}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        </div>
      );
    },
    [layoutEvents, isWorking, eventTitles, renderEvent, onEventClick, editable, onEventResize, onEventMove, dragging, styles, token.colorPrimary],
  );

  const dateFullCellRender = useCallback<NonNullable<CalendarProps<Dayjs>['dateFullCellRender']>>(
    (date) => {
      const marks = marksByDate.get(date.format('YYYY-MM-DD')) ?? [];
      const workday = marks.find((mark) => mark.type === 'workday');
      const holiday = !workday && marks.find((mark) => mark.type === 'holiday');
      const leave = marks.find((mark) => mark.type === 'leave');
      const isWeekend = date.day() === 0 || date.day() === 6;
      const calendarPrefix = `${prefixCls}-calendar`;

      // 保留日期内部结构和今天标记，选择、禁用及切月仍由 Calendar 处理。
      return (
        <div
          className={[
            `${prefixCls}-cell-inner`,
            `${calendarPrefix}-date`,
            date.isSame(dayjs(), 'day') ? `${calendarPrefix}-date-today` : '',
          ].filter(Boolean).join(' ')}
          css={[styles.date, holiday && styles.holiday]}
          data-drop-target={dropDate === date.format('YYYY-MM-DD') ? 'true' : undefined}
          onDragOver={(dragEvent) => {
            if (!dragging) return;
            dragEvent.preventDefault();
            dragEvent.stopPropagation();
            const range = resizeRange(date);
            dragEvent.dataTransfer.dropEffect = range ? 'move' : 'none';
            setDropDate(range ? date.format('YYYY-MM-DD') : null);
          }}
          onDragLeave={(dragEvent) => {
            if (!dragEvent.currentTarget.contains(dragEvent.relatedTarget as Node | null)) setDropDate(null);
          }}
          onDrop={(dragEvent) => {
            if (!dragging) return;
            dragEvent.preventDefault();
            dragEvent.stopPropagation();
            const range = resizeRange(date);
            const original = dragging.event;
            setDragging(null);
            setDropDate(null);
            if (range && (!range.start.isSame(original.start, 'day') || !range.end.isSame(original.end, 'day'))) {
              if (dragging.edge === 'move') onEventMove?.(original, range);
              else onEventResize?.(original, range);
            }
          }}
          data-holiday={holiday ? 'true' : undefined}
        >
          <div className={`${calendarPrefix}-date-value`} css={styles.dateHeader}>
            <span css={!workday && (holiday || isWeekend) ? styles.redDate : undefined}>
              {String(date.date()).padStart(2, '0')}
            </span>
            {holiday && (
              <span css={[styles.badge, styles.holidayBadge]} title={holiday.label ?? '节假日'} aria-label={holiday.label ?? '节假日'}>休</span>
            )}
            {workday && (
              <span css={styles.badge} title={workday.label ?? '补班'} aria-label={workday.label ?? '补班'}>班</span>
            )}
            {leave && (
              <span css={styles.badge} title={leave.label ?? '请假'} aria-label={leave.label ?? '请假'}>请</span>
            )}
          </div>
          <div className={`${calendarPrefix}-date-content`}>{dateCellRender(date)}</div>
        </div>
      );
    },
    [marksByDate, prefixCls, styles, dateCellRender, dragging, dropDate, resizeRange, onEventResize, onEventMove],
  );

  return <Calendar {...calendarProps} css={styles.calendar} dateFullCellRender={dateFullCellRender} />;
}

export default EventCalendar;
