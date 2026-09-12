/** @jsxImportSource @emotion/react */
import { useCallback, useMemo } from 'react';
import { Calendar, theme } from 'antd';
import type { CalendarProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

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
  ...calendarProps
}: EventCalendarProps<T>) {
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

  const dateCellRender = useCallback<NonNullable<CalendarProps<Dayjs>['dateCellRender']>>(
    (date) => {
      const marks = marksByDate.get(date.format('YYYY-MM-DD')) ?? [];
      const isLeave = marks.some((mark) => mark.type === 'leave');
      const isWorkday = marks.some((mark) => mark.type === 'workday');
      const isHoliday = marks.some((mark) => mark.type === 'holiday');
      const isWeekend = date.day() === 0 || date.day() === 6;
      // 请假不计工作量；补班覆盖节假日和周末，但不覆盖个人请假。
      const isWorkingDay = !isLeave && (isWorkday || (!isHoliday && !isWeekend));
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
                <span
                  key={event.key}
                  css={[styles.bar, rangeStyle, !isWorkingDay && styles.nonWorkingBar]}
                  data-working-day={isWorkingDay}
                  data-range-position={position}
                  title={event.title}
                  role={onEventClick ? 'button' : undefined}
                  tabIndex={onEventClick ? 0 : undefined}
                  aria-label={isWorkingDay ? event.title : `${event.title}（当天不计工作量）`}
                  onClick={(clickEvent) => {
                    // 任务交互不向日期单元格冒泡，保留日历自身的日期选择逻辑。
                    clickEvent.stopPropagation();
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
                    cursor: onEventClick ? 'pointer' : undefined,
                    backgroundColor: isWorkingDay ? event.color ?? token.colorPrimary : undefined,
                    gridRow: event.lane + 1,
                  }}
                >
                  {renderEvent
                    ? renderEvent(event, { date, lane: event.lane, position, isWorkingDay })
                    : position === 'start' || position === 'single'
                      ? event.title
                      : null}
                </span>
              );
            })}
          </div>
        </div>
      );
    },
    [layoutEvents, marksByDate, renderEvent, onEventClick, styles, token.colorPrimary],
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
    [marksByDate, prefixCls, styles, dateCellRender],
  );

  return <Calendar {...calendarProps} css={styles.calendar} dateFullCellRender={dateFullCellRender} />;
}

export default EventCalendar;
