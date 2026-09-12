import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { CalendarDateMark, CalendarEvent } from './components/EventCalendar';
import { calendarStorage, CALENDAR_STORAGE_CHANGE, CALENDAR_STORAGE_KEY } from './data/calendarStorage';

/** 将持久化记录转换为日历数据，并订阅本页及其他标签页的修改。 */
export default function useCalendarData() {
  const [data, setData] = useState<{ events: CalendarEvent[]; dateMarks: CalendarDateMark[] }>({
    events: [], dateMarks: [],
  });
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => {
    try {
      const stored = calendarStorage.query();
      setData({
        events: stored.events.map((event) => ({ ...event, start: dayjs(event.start), end: dayjs(event.end) })),
        dateMarks: stored.dateMarks.map((mark) => ({ ...mark, date: dayjs(mark.date) })),
      });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法访问本地存储');
    }
  }, []);

  useEffect(() => {
    try {
      // 仅首次使用时写入模拟数据，刷新和重新挂载均保留已保存的修改。
      calendarStorage.initialize();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法初始化本地存储');
      return;
    }
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CALENDAR_STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener(CALENDAR_STORAGE_CHANGE, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CALENDAR_STORAGE_CHANGE, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  return { ...data, error, refresh };
}
