import React from 'react';

import { Alert, Button, Descriptions, Modal, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';

import EventCalendar from '../components/EventCalendar';
import EventGantt from '../components/EventGantt';
import { useTaskPage } from '../hooks/useTaskPage';
import { usePageActive } from '../layout/PageActiveContext';
import { readEnumParam, updateSearchParams } from '../router/searchParams';
import type { CalendarEvent } from '../shared/event';

const VIEW_VALUES = ['calendar', 'gantt'] as const;
type ViewKey = (typeof VIEW_VALUES)[number];

const VIEW_PARAM = 'view';
const DATE_PARAM = 'date';
const DATE_FORMAT = 'YYYY-MM-DD';
/** 默认锚点日期，与演示任务数据的起始月份对齐。 */
const DEFAULT_DATE = dayjs('2026-01-01');

const VIEW_ITEMS: readonly { key: ViewKey; label: string }[] = [
  { key: 'calendar', label: '日历' },
  { key: 'gantt', label: '甘特图' },
];

/** 读取路由里的锚点日期，非法值回退默认日期。 */
function readAnchorDate(search: string): Dayjs {
  const raw = new URLSearchParams(search).get(DATE_PARAM);
  const parsed = raw ? dayjs(raw) : null;
  return parsed?.isValid() ? parsed : DEFAULT_DATE;
}

const TasksPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = usePageActive();
  // 视图与锚点日期以查询参数为准，刷新页面或复制链接后可直接恢复。
  const view = readEnumParam(location.search, VIEW_PARAM, VIEW_VALUES, 'calendar');
  const anchorDate = readAnchorDate(location.search);
  const {
    events,
    dateMarks,
    error,
    editable,
    setEditable,
    saveError,
    selectedEvent,
    setSelectedEvent,
    saveEventRange,
  } = useTaskPage();

  const commitSearch = React.useCallback((updates: Record<string, string | null>) => {
    navigate(
      { pathname: location.pathname, search: updateSearchParams(location.search, updates) },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  // 默认视图不写参数，保持地址简洁。
  const changeView = (key: string) => {
    const next: ViewKey = key === 'gantt' ? 'gantt' : 'calendar';
    commitSearch({ [VIEW_PARAM]: next === 'calendar' ? null : next });
  };

  const changeDate = React.useCallback((date: Dayjs) => {
    commitSearch({ [DATE_PARAM]: date.format(DATE_FORMAT) });
  }, [commitSearch]);

  // 页面被保活隐藏时收起详情弹窗，避免 portal 内容盖在其他页面之上。
  React.useEffect(() => {
    if (!active) setSelectedEvent(null);
  }, [active, setSelectedEvent]);

  const handleEventClick = React.useCallback(
    (event: CalendarEvent) => setSelectedEvent(event),
    [setSelectedEvent],
  );
  // 两个视图共享同一份任务数据、锚点日期与编辑行为，避免业务逻辑漂移。
  const viewProps = {
    events,
    editable,
    dateMarks,
    value: anchorDate,
    onChange: changeDate,
    onEventMove: saveEventRange,
    onEventResize: saveEventRange,
    onEventClick: handleEventClick,
  };

  return (
    <>
      <Space style={{ marginBottom: 8 }}>
        <Button type={editable ? 'primary' : 'default'} onClick={() => setEditable((v) => !v)} aria-pressed={editable}>
          {editable ? '退出编辑模式' : '开启编辑模式'}
        </Button>
        {editable && <span>落点自动跳过周末、节假日与请假；整体移动保持工作日数</span>}
      </Space>
      {saveError && <Alert type="error" showIcon message="任务日期保存失败" description={saveError} />}
      {error && <Alert type="error" showIcon message="日历数据读取失败" description={error} />}
      <Tabs
        activeKey={view}
        onChange={changeView}
        items={[...VIEW_ITEMS]}
      />
      {view === 'calendar' ? <EventCalendar {...viewProps} /> : <EventGantt {...viewProps} />}
      <Modal title="任务详情" open={selectedEvent !== null} onCancel={() => setSelectedEvent(null)} footer={null}>
        {selectedEvent && (
          <Descriptions column={1}>
            <Descriptions.Item label="任务名称">{selectedEvent.title}</Descriptions.Item>
            <Descriptions.Item label="任务标识">{selectedEvent.key}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{selectedEvent.start.format(DATE_FORMAT)}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{selectedEvent.end.format(DATE_FORMAT)}</Descriptions.Item>
            <Descriptions.Item label="持续天数">
              {selectedEvent.end.startOf('day').diff(selectedEvent.start.startOf('day'), 'day') + 1} 天
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default TasksPage;
