import type { StoredDateMark, StoredEvent } from './calendarStorage';

// 元旦放假与补班依据 2026 年放假安排，请假记录为演示数据。
export const initialDateMarks: StoredDateMark[] = [
  { date: '2026-01-01', type: 'holiday', label: '元旦放假' },
  { date: '2026-01-02', type: 'holiday', label: '元旦放假调休' },
  { date: '2026-01-03', type: 'holiday', label: '元旦放假' },
  { date: '2026-01-04', type: 'workday', label: '元旦补班' },
  { date: '2026-01-14', type: 'leave', label: '请假（模拟）' },
  { date: '2026-01-15', type: 'leave', label: '请假（模拟）' },
];

// 模拟订单后台 v2.3 迭代：开发、联调、测试、缺陷修复与灰度发布。
export const initialEvents: StoredEvent[] = [
  {
    key: 'scope-review',
    title: '订单后台 v2.3 需求与接口评审',
    start: '2026-01-05',
    end: '2026-01-05',
    color: '#faad14',
  },
  {
    key: 'order-query-api',
    title: '后端：订单组合筛选与分页接口',
    start: '2026-01-06',
    end: '2026-01-09',
    color: '#1677ff',
  },
  {
    key: 'order-filter-ui',
    title: '前端：订单筛选栏与 URL 状态同步',
    start: '2026-01-06',
    end: '2026-01-08',
    color: '#1677ff',
  },
  {
    key: 'order-table-ui',
    title: '前端：订单列表、排序与详情抽屉',
    start: '2026-01-09',
    end: '2026-01-14',
    color: '#1677ff',
  },
  {
    key: 'permission-api',
    title: '后端：订单导出权限与操作审计',
    start: '2026-01-08',
    end: '2026-01-13',
    color: '#1677ff',
  },
  {
    key: 'export-worker',
    title: '后端：异步导出队列与文件下载',
    start: '2026-01-11',
    end: '2026-01-17',
    color: '#1677ff',
  },
  {
    key: 'order-integration',
    title: '联调：筛选参数、分页与异常提示',
    start: '2026-01-15',
    end: '2026-01-16',
    color: '#faad14',
  },
  {
    key: 'export-ui',
    title: '前端：导出进度轮询与失败重试',
    start: '2026-01-15',
    end: '2026-01-20',
    color: '#1677ff',
  },
  {
    key: 'order-regression',
    title: '测试：订单查询与角色权限回归',
    start: '2026-01-19',
    end: '2026-01-22',
    color: '#52c41a',
  },
  {
    key: 'pagination-fix',
    title: '修复：切换筛选条件后页码未重置',
    start: '2026-01-20',
    end: '2026-01-20',
    color: '#ff4d4f',
  },
  {
    key: 'export-load-test',
    title: '测试：十万条订单导出压测',
    start: '2026-01-21',
    end: '2026-01-23',
    color: '#52c41a',
  },
  {
    key: 'export-memory-fix',
    title: '修复：大批量导出内存峰值过高',
    start: '2026-01-23',
    end: '2026-01-27',
    color: '#ff4d4f',
  },
  {
    key: 'release-acceptance',
    title: '验收：导出修复复测与发布检查',
    start: '2026-01-28',
    end: '2026-01-29',
    color: '#52c41a',
  },
  {
    key: 'production-release',
    title: '发布：订单后台 v2.3 灰度上线',
    start: '2026-01-30',
    end: '2026-01-30',
    color: '#faad14',
  },
  {
    key: 'release-observation',
    title: '观察：灰度错误率与导出队列积压',
    start: '2026-01-30',
    end: '2026-02-03',
    color: '#faad14',
  },
];

