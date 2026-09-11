import React from 'react';

import { Descriptions, Modal, theme } from 'antd';
import dayjs from 'dayjs';

import EventCalendar from './components/EventCalendar';
import type { CalendarEvent } from './components/EventCalendar';

// 模拟订单后台 v2.3 迭代：开发、联调、测试、缺陷修复与灰度发布。
const getEvents = (token: ReturnType<typeof theme.useToken>['token']): CalendarEvent[] => [
  {
    key: 'scope-review',
    title: '订单后台 v2.3 需求与接口评审',
    start: dayjs('2026-01-05'),
    end: dayjs('2026-01-05'),
    color: token.colorWarning,
  },
  {
    key: 'order-query-api',
    title: '后端：订单组合筛选与分页接口',
    start: dayjs('2026-01-06'),
    end: dayjs('2026-01-09'),
    color: token.colorPrimary,
  },
  {
    key: 'order-filter-ui',
    title: '前端：订单筛选栏与 URL 状态同步',
    start: dayjs('2026-01-06'),
    end: dayjs('2026-01-08'),
    color: token.colorPrimary,
  },
  {
    key: 'order-table-ui',
    title: '前端：订单列表、排序与详情抽屉',
    start: dayjs('2026-01-09'),
    end: dayjs('2026-01-14'),
    color: token.colorPrimary,
  },
  {
    key: 'permission-api',
    title: '后端：订单导出权限与操作审计',
    start: dayjs('2026-01-08'),
    end: dayjs('2026-01-13'),
    color: token.colorPrimary,
  },
  {
    key: 'export-worker',
    title: '后端：异步导出队列与文件下载',
    start: dayjs('2026-01-12'),
    end: dayjs('2026-01-16'),
    color: token.colorPrimary,
  },
  {
    key: 'order-integration',
    title: '联调：筛选参数、分页与异常提示',
    start: dayjs('2026-01-15'),
    end: dayjs('2026-01-16'),
    color: token.colorWarning,
  },
  {
    key: 'export-ui',
    title: '前端：导出进度轮询与失败重试',
    start: dayjs('2026-01-15'),
    end: dayjs('2026-01-20'),
    color: token.colorPrimary,
  },
  {
    key: 'order-regression',
    title: '测试：订单查询与角色权限回归',
    start: dayjs('2026-01-19'),
    end: dayjs('2026-01-22'),
    color: token.colorSuccess,
  },
  {
    key: 'pagination-fix',
    title: '修复：切换筛选条件后页码未重置',
    start: dayjs('2026-01-20'),
    end: dayjs('2026-01-20'),
    color: token.colorError,
  },
  {
    key: 'export-load-test',
    title: '测试：十万条订单导出压测',
    start: dayjs('2026-01-21'),
    end: dayjs('2026-01-23'),
    color: token.colorSuccess,
  },
  {
    key: 'export-memory-fix',
    title: '修复：大批量导出内存峰值过高',
    start: dayjs('2026-01-23'),
    end: dayjs('2026-01-27'),
    color: token.colorError,
  },
  {
    key: 'release-acceptance',
    title: '验收：导出修复复测与发布检查',
    start: dayjs('2026-01-28'),
    end: dayjs('2026-01-29'),
    color: token.colorSuccess,
  },
  {
    key: 'production-release',
    title: '发布：订单后台 v2.3 灰度上线',
    start: dayjs('2026-01-30'),
    end: dayjs('2026-01-30'),
    color: token.colorWarning,
  },
  {
    key: 'release-observation',
    title: '观察：灰度错误率与导出队列积压',
    start: dayjs('2026-01-30'),
    end: dayjs('2026-02-03'),
    color: token.colorWarning,
  },
];

const App: React.FC = () => {
  const { token } = theme.useToken();
  const events = React.useMemo(() => getEvents(token), [token]);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  return (
    <>
      <EventCalendar
        events={events}
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
