import React from 'react';

import { Alert, Button, Descriptions, Modal, Space } from 'antd';
import dayjs from 'dayjs';

import EventCalendar from './components/EventCalendar';
import type { CalendarEvent } from './components/EventCalendar';
import useCalendarData from './useCalendarData';
import { calendarStorage } from './data/calendarStorage';

const App: React.FC = () => {
  const { events, dateMarks, error } = useCalendarData();
  const [editable, setEditable] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  const saveEventRange = (event: CalendarEvent, range: { start: dayjs.Dayjs; end: dayjs.Dayjs }) => {
    try {
      calendarStorage.events.update(event.key, {
        start: range.start.format('YYYY-MM-DD'),
        end: range.end.format('YYYY-MM-DD'),
      });
      setSaveError(null);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : '无法保存日期');
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type={editable ? 'primary' : 'default'} onClick={() => setEditable((value) => !value)} aria-pressed={editable}>
          {editable ? '退出编辑模式' : '开启编辑模式'}
        </Button>
        {editable && <span>拖动任务主体可整体移动；拖动两端 ↔ 可调整起止日期</span>}
      </Space>
      {saveError && <Alert type="error" showIcon message="任务日期保存失败" description={saveError} />}
      {error && <Alert type="error" showIcon message="日历数据读取失败" description={error} />}
      <EventCalendar
        events={events}
        editable={editable}
        onEventResize={saveEventRange}
        onEventMove={saveEventRange}
        dateMarks={dateMarks}
        defaultValue={dayjs('2026-01-01')}
        onEventClick={(event) => setSelectedEvent(event)}
      />
      <Modal
        title="任务详情"
        open={selectedEvent !== null}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
      >
        {selectedEvent && (
          <Descriptions column={1}>
            <Descriptions.Item label="任务名称">{selectedEvent.title}</Descriptions.Item>
            <Descriptions.Item label="任务标识">{selectedEvent.key}</Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {selectedEvent.start.format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {selectedEvent.end.format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="持续天数">
              {selectedEvent.end.startOf('day').diff(selectedEvent.start.startOf('day'), 'day') + 1} 天
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default App;
