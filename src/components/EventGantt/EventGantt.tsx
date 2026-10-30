/** @jsxImportSource @emotion/react */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Tooltip, theme } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import {
  compareEvents,
  getEventTooltipText,
  getRangePosition,
  isWorkingDate,
  resolveEventRange,
} from '../../shared/event';
import type { CalendarDateMark, CalendarEvent, DragEdge } from '../../shared/event';
import useStyle from './useStyle';
import type { EventGanttProps } from './types';

const DAY_FORMAT = 'YYYY-MM-DD';
/** 左侧任务名列和每天列的宽度，表头与数据行共用同一模板保证对齐。 */
const LABEL_COLUMN_WIDTH = 200;
const DAY_COLUMN_WIDTH = 36;

function EventGantt<T extends CalendarEvent = CalendarEvent>({
  events,
  renderEvent,
  onEventClick,
  dateMarks,
  editable = false,
  onEventResize,
  onEventMove,
  value,
  defaultValue,
  onChange,
  validRange,
  disabledDate,
}: EventGanttProps<T>) {
  const [innerValue, setInnerValue] = useState(() => (defaultValue ?? dayjs()).startOf('month'));
  const current = (value ?? innerValue).startOf('month');
  const [dragging, setDragging] = useState<{ event: T; edge: DragEdge } | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    if (!editable) {
      setDragging(null);
      setDropDate(null);
    }
  }, [editable]);
  const { token } = theme.useToken();
  const styles = useStyle();

  const days = useMemo(() => {
    const count = current.daysInMonth();
    return Array.from({ length: count }, (_, index) => current.date(index + 1));
  }, [current]);

  const marksByDate = useMemo(() => {
    const result = new Map<string, CalendarDateMark[]>();
    for (const mark of dateMarks ?? []) {
      const key = mark.date.format(DAY_FORMAT);
      result.set(key, [...(result.get(key) ?? []), mark]);
    }
    return result;
  }, [dateMarks]);

  const isWorking = useCallback((date: Dayjs) =>
    isWorkingDate(date, marksByDate.get(date.format(DAY_FORMAT)) ?? []), [marksByDate]);
  const sortedEvents = useMemo(() => [...events].sort(compareEvents), [events]);
  // 每条任务只计算一次提示内容，避免为每天的片段重复统计工期。
  const eventTitles = useMemo(() => new Map(events.map((event) => [
    event.key,
    getEventTooltipText(event, isWorking),
  ])), [events, isWorking]);

  const dropRange = useCallback((date: Dayjs) => {
    if (!editable || !dragging) return null;
    return resolveEventRange(dragging, date, {
      isWorking,
      allowMove: Boolean(onEventMove),
      allowResize: Boolean(onEventResize),
      disabledDate,
      validRange,
    });
  }, [editable, dragging, onEventMove, onEventResize, isWorking, disabledDate, validRange]);

  // 月份与 validRange 存在交集才允许导航。
  const inValidRange = useCallback((month: Dayjs) =>
    !validRange ||
    (!month.endOf('month').isBefore(validRange[0], 'day') &&
      !month.startOf('month').isAfter(validRange[1], 'day')),
  [validRange]);
  const today = dayjs().startOf('day');
  const navigate = (month: Dayjs) => {
    const next = month.startOf('month');
    setInnerValue(next);
    onChange?.(next);
  };

  const renderDayCell = (date: Dayjs, row: number) => {
    const key = date.format(DAY_FORMAT);
    const marks = marksByDate.get(key) ?? [];
    const holiday = !marks.some((mark) => mark.type === 'workday') &&
      marks.some((mark) => mark.type === 'holiday');

    return (
      <div
        key={key}
        css={styles.dayCell}
        style={{ gridRow: row, gridColumn: date.date() + 1 }}
        data-holiday={holiday || undefined}
        data-today={date.isSame(today, 'day') || undefined}
        data-disabled={disabledDate?.(date) || undefined}
        data-drop-target={dropDate === key || undefined}
        onDragOver={(dragEvent) => {
          if (!dragging) return;
          dragEvent.preventDefault();
          dragEvent.stopPropagation();
          const range = dropRange(date);
          dragEvent.dataTransfer.dropEffect = range ? 'move' : 'none';
          setDropDate(range ? key : null);
        }}
        onDragLeave={(dragEvent) => {
          if (!dragEvent.currentTarget.contains(dragEvent.relatedTarget as Node | null)) setDropDate(null);
        }}
        onDrop={(dragEvent) => {
          if (!dragging) return;
          dragEvent.preventDefault();
          dragEvent.stopPropagation();
          const range = dropRange(date);
          const original = dragging.event;
          setDragging(null);
          setDropDate(null);
          if (range && (!range.start.isSame(original.start, 'day') || !range.end.isSame(original.end, 'day'))) {
            if (dragging.edge === 'move') onEventMove?.(original, range);
            else onEventResize?.(original, range);
          }
        }}
      />
    );
  };

  const renderSegment = (event: T, date: Dayjs, row: number) => {
    const position = getRangePosition(date, event);
    const isWorkingDay = isWorking(date);
    const rangeStyle = {
      start: styles.barStart,
      middle: styles.barMiddle,
      end: styles.barEnd,
      single: styles.barSingle,
    }[position];

    return (
      <Tooltip
        key={date.format(DAY_FORMAT)}
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
            clickEvent.stopPropagation();
            if (suppressClick.current) return;
            onEventClick?.(event, { date, lane: row - 2, position, isWorkingDay });
          }}
          onKeyDown={(keyEvent) => {
            // 自定义内容自行处理内部交互，组件只响应片段自身的确认键。
            keyEvent.stopPropagation();
            if (
              onEventClick &&
              keyEvent.target === keyEvent.currentTarget &&
              (keyEvent.key === 'Enter' || keyEvent.key === ' ')
            ) {
              keyEvent.preventDefault();
              if (!keyEvent.repeat) {
                onEventClick(event, { date, lane: row - 2, position, isWorkingDay });
              }
            }
          }}
          style={{
            gridRow: row,
            gridColumn: date.date() + 1,
            cursor: editable && onEventMove ? 'grab' : onEventClick ? 'pointer' : undefined,
            backgroundColor: isWorkingDay ? event.color ?? token.colorPrimary : undefined,
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
            ? renderEvent(event, { date, lane: row - 2, position, isWorkingDay })
            : position === 'start' || position === 'single'
              ? event.title
              : null}
        </span>
      </Tooltip>
    );
  };

  return (
    <div>
      <div css={styles.toolbar}>
        <Button
          icon={<LeftOutlined />}
          disabled={!inValidRange(current.subtract(1, 'month'))}
          onClick={() => navigate(current.subtract(1, 'month'))}
          aria-label="上一月"
        />
        <Button
          icon={<RightOutlined />}
          disabled={!inValidRange(current.add(1, 'month'))}
          onClick={() => navigate(current.add(1, 'month'))}
          aria-label="下一月"
        />
        <Button disabled={!inValidRange(today)} onClick={() => navigate(today)}>今天</Button>
        <span css={styles.title} aria-live="polite">{current.format('YYYY年M月')}</span>
      </div>
      <div css={styles.scroller}>
        <div
          css={styles.grid}
          style={{ gridTemplateColumns: `${LABEL_COLUMN_WIDTH}px repeat(${days.length}, ${DAY_COLUMN_WIDTH}px)` }}
        >
          <div css={styles.cornerCell} style={{ gridRow: 1, gridColumn: 1 }}>任务</div>
          {days.map((date) => {
            const key = date.format(DAY_FORMAT);
            const marks = marksByDate.get(key) ?? [];
            const workday = marks.find((mark) => mark.type === 'workday');
            const holiday = !workday && marks.find((mark) => mark.type === 'holiday');
            const leave = marks.find((mark) => mark.type === 'leave');
            const isWeekend = date.day() === 0 || date.day() === 6;

            return (
              <div
                key={key}
                css={styles.headerCell}
                style={{ gridRow: 1, gridColumn: date.date() + 1 }}
                data-today={date.isSame(today, 'day') || undefined}
                data-disabled={disabledDate?.(date) || undefined}
              >
                <span css={!workday && (holiday || isWeekend) ? styles.redDate : undefined}>
                  {String(date.date()).padStart(2, '0')}
                </span>
                <span css={styles.badges}>
                  {holiday && (
                    <span css={[styles.badge, styles.holidayBadge]} title={holiday.label ?? '节假日'} aria-label={holiday.label ?? '节假日'}>休</span>
                  )}
                  {workday && (
                    <span css={styles.badge} title={workday.label ?? '补班'} aria-label={workday.label ?? '补班'}>班</span>
                  )}
                  {leave && (
                    <span css={styles.badge} title={leave.label ?? '请假'} aria-label={leave.label ?? '请假'}>请</span>
                  )}
                </span>
              </div>
            );
          })}
          {sortedEvents.map((event, rowIndex) => {
            const row = rowIndex + 2;
            // 任务片段只绘制与当月相交的部分，行本身保持完整任务列表。
            const segmentStart = event.start.isAfter(current, 'day') ? event.start : current;
            const segmentEnd = event.end.isBefore(current.endOf('month'), 'day')
              ? event.end
              : current.endOf('month');
            const visible = !segmentStart.isAfter(segmentEnd, 'day');

            return (
              <React.Fragment key={event.key}>
                <div css={styles.labelCell} style={{ gridRow: row, gridColumn: 1 }} title={event.title}>
                  {event.title}
                </div>
                {days.map((date) => renderDayCell(date, row))}
                {visible && days
                  .slice(segmentStart.date() - 1, segmentEnd.date())
                  .map((date) => renderSegment(event, date, row))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default EventGantt;
