import dayjs from 'dayjs';
import type { CalendarDateMark } from '../components/EventCalendar';
import { initialDateMarks, initialEvents } from './calendarSeed';

/** 存储自然日字符串，避免 JSON 序列化 Dayjs 后产生时区偏移。 */
export interface StoredEvent {
  key: string;
  title: string;
  start: string;
  end: string;
  color?: string;
}

export interface StoredDateMark {
  date: string;
  type: CalendarDateMark['type'];
  label?: string;
}

interface CalendarData {
  version: 1;
  events: StoredEvent[];
  dateMarks: StoredDateMark[];
}

export const CALENDAR_STORAGE_KEY = 'event-calendar-demo:data:v1';
export const CALENDAR_STORAGE_CHANGE = 'event-calendar-demo:storage-change';

type DateQuery = { start?: string; end?: string };

function assertDate(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !dayjs(value).isValid() ||
    dayjs(value).format('YYYY-MM-DD') !== value
  ) {
    throw new Error('日期必须是有效的 YYYY-MM-DD 字符串');
  }
}

function validateEvent(event: StoredEvent) {
  if (!event || typeof event.key !== 'string' || !event.key.trim() ||
      typeof event.title !== 'string' || !event.title.trim()) {
    throw new Error('任务标识和标题不能为空');
  }
  assertDate(event.start);
  assertDate(event.end);
  if (event.start > event.end) throw new Error('任务开始日期不能晚于结束日期');
  if (event.color !== undefined && typeof event.color !== 'string') throw new Error('任务颜色必须是字符串');
}

function validateMark(mark: StoredDateMark) {
  if (!mark) throw new Error('日期标记不能为空');
  assertDate(mark.date);
  if (!['holiday', 'workday', 'leave'].includes(mark.type)) throw new Error('日期标记类型无效');
  if (mark.label !== undefined && typeof mark.label !== 'string') throw new Error('标记说明必须是字符串');
}

function validateData(data: CalendarData) {
  if (!data || data.version !== 1 || !Array.isArray(data.events) || !Array.isArray(data.dateMarks)) {
    throw new Error('本地日历数据格式或版本不受支持，原数据已保留');
  }
  data.events.forEach(validateEvent);
  data.dateMarks.forEach(validateMark);
  if (new Set(data.events.map((event) => event.key)).size !== data.events.length) throw new Error('任务标识重复');
  if (new Set(data.dateMarks.map((mark) => `${mark.date}:${mark.type}`)).size !== data.dateMarks.length) {
    throw new Error('同一天的同类型标记重复');
  }
}

function validateQuery(query: DateQuery) {
  if (query.start !== undefined) assertDate(query.start);
  if (query.end !== undefined) assertDate(query.end);
  if (query.start && query.end && query.start > query.end) throw new Error('查询开始日期不能晚于结束日期');
}

/** 可注入 Storage 实现，便于测试；每次操作均读取最新数据。 */
export function createCalendarStorage(getStorage: () => Pick<Storage, 'getItem' | 'setItem'>, notify = () => {}) {
  const write = (data: CalendarData) => {
    validateData(data);
    getStorage().setItem(CALENDAR_STORAGE_KEY, JSON.stringify(data));
    // 仅在成功持久化后通知当前页面刷新。
    notify();
  };
  const seed = (): CalendarData => ({
    version: 1,
    events: initialEvents.map((event) => ({ ...event })),
    dateMarks: initialDateMarks.map((mark) => ({ ...mark })),
  });
  const read = (): CalendarData => {
    const raw = getStorage().getItem(CALENDAR_STORAGE_KEY);
    if (raw === null) throw new Error('日历存储尚未初始化');
    // 数据损坏时抛出错误，不用模拟数据覆盖已有内容。
    const data: CalendarData = JSON.parse(raw);
    validateData(data);
    return data;
  };

  return {
    /** 页面启动时传 reset 恢复模拟数据；普通查询不执行初始化或写入。 */
    initialize({ reset = false }: { reset?: boolean } = {}) {
      if (reset || getStorage().getItem(CALENDAR_STORAGE_KEY) === null) {
        const data = seed();
        write(data);
        return data;
      }
      return read();
    },
    query() { return read(); },
    events: {
      query(query: DateQuery = {}) {
        validateQuery(query);
        return read().events.filter((event) =>
          (!query.start || event.end >= query.start) && (!query.end || event.start <= query.end));
      },
      get(key: string) { return read().events.find((event) => event.key === key); },
      insert(event: StoredEvent) {
        validateEvent(event);
        const data = read();
        if (data.events.some((item) => item.key === event.key)) throw new Error('任务标识已存在');
        data.events.push({ ...event });
        write(data);
        return { ...event };
      },
      update(key: string, patch: Partial<Omit<StoredEvent, 'key'>>) {
        const data = read();
        const index = data.events.findIndex((event) => event.key === key);
        if (index === -1) throw new Error('任务不存在');
        const event = { ...data.events[index], ...patch, key };
        data.events[index] = event;
        write(data);
        return event;
      },
      remove(key: string) {
        const data = read();
        const index = data.events.findIndex((event) => event.key === key);
        if (index === -1) return false;
        data.events.splice(index, 1);
        write(data);
        return true;
      },
    },
    dateMarks: {
      query(query: DateQuery = {}) {
        validateQuery(query);
        return read().dateMarks.filter((mark) =>
          (!query.start || mark.date >= query.start) && (!query.end || mark.date <= query.end));
      },
      get(date: string, type: StoredDateMark['type']) {
        assertDate(date);
        return read().dateMarks.find((mark) => mark.date === date && mark.type === type);
      },
      insert(mark: StoredDateMark) {
        validateMark(mark);
        const data = read();
        if (data.dateMarks.some((item) => item.date === mark.date && item.type === mark.type)) {
          throw new Error('该日期的同类型标记已存在');
        }
        data.dateMarks.push({ ...mark });
        write(data);
        return { ...mark };
      },
      update(date: string, type: StoredDateMark['type'], patch: Partial<StoredDateMark>) {
        assertDate(date);
        const data = read();
        const index = data.dateMarks.findIndex((mark) => mark.date === date && mark.type === type);
        if (index === -1) throw new Error('日期标记不存在');
        const mark = { ...data.dateMarks[index], ...patch };
        data.dateMarks[index] = mark;
        write(data);
        return mark;
      },
      remove(date: string, type: StoredDateMark['type']) {
        assertDate(date);
        const data = read();
        const index = data.dateMarks.findIndex((mark) => mark.date === date && mark.type === type);
        if (index === -1) return false;
        data.dateMarks.splice(index, 1);
        write(data);
        return true;
      },
    },
  };
}

export const calendarStorage = createCalendarStorage(
  () => window.localStorage,
  () => window.dispatchEvent(new Event(CALENDAR_STORAGE_CHANGE)),
);
