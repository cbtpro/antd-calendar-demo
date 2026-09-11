/** @jsxImportSource @emotion/react */
import { useCallback, useMemo } from 'react';
import { Calendar, theme } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';

import { assignEventLanes } from './eventLayout';
import useStyle from './useStyle';
import type { CalendarEvent, EventCalendarProps, EventRenderInfo } from './types';

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
  ...calendarProps
}: EventCalendarProps<T>) {
  const { token } = theme.useToken();
  const { styles } = useStyle(calendarProps.prefixCls);
  const layoutEvents = useMemo(() => assignEventLanes(events), [events]);

  const dateCellRender = useCallback<NonNullable<CalendarProps<Dayjs>['dateCellRender']>>(
    (date) => {
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
                  css={[styles.bar, rangeStyle]}
                  title={event.title}
                  style={{
                    backgroundColor: event.color ?? token.colorPrimary,
                    gridRow: event.lane + 1,
                  }}
                >
                  {renderEvent
                    ? renderEvent(event, { date, lane: event.lane, position })
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
    [layoutEvents, renderEvent, styles, token.colorPrimary],
  );

  return <Calendar {...calendarProps} css={styles.calendar} dateCellRender={dateCellRender} />;
}

export default EventCalendar;
