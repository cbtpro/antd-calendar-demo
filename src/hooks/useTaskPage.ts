import React from 'react';
import dayjs from 'dayjs';

import type { CalendarEvent } from '../shared/event';
import useCalendarData from '../useCalendarData';
import { calendarStorage } from '../data/calendarStorage';

/** 任务页面的共享编辑状态，日历页和甘特图页各持有一份。 */
export function useTaskPage() {
  const { events, dateMarks, error } = useCalendarData();
  const [editable, setEditable] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  const saveEventRange = React.useCallback((
    event: CalendarEvent,
    range: { start: dayjs.Dayjs; end: dayjs.Dayjs },
  ) => {
    try {
      calendarStorage.events.update(event.key, {
        start: range.start.format('YYYY-MM-DD'),
        end: range.end.format('YYYY-MM-DD'),
      });
      setSaveError(null);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : '无法保存日期');
    }
  }, []);

  return {
    events,
    dateMarks,
    error,
    editable,
    setEditable,
    saveError,
    selectedEvent,
    setSelectedEvent,
    saveEventRange,
  };
}
