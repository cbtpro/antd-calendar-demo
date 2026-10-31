import React from 'react';

import { Alert, Card, Col, List, Row, Segmented, Space, Tag, theme } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  ProfileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';

import useCalendarData from '../useCalendarData';
import StatCard from '../components/StatCard';
import type { StatCardProps } from '../components/StatCard/types';
import { countDateMarks, countOngoing, filterOngoing } from '../shared/dashboard/analytics';
import { readEnumParam, updateSearchParams } from '../router/searchParams';
import DashboardCharts from './dashboard/DashboardCharts';

/** 查询参数控制列表范围，用于验证标签页刷新后路由参数保持。 */
const RANGE_VALUES = ['all', 'ongoing'] as const;
type RangeKey = (typeof RANGE_VALUES)[number];

const RANGE_PARAM = 'range';
const DATE_FORMAT = 'YYYY-MM-DD';

const RANGE_OPTIONS: readonly { label: string; value: RangeKey }[] = [
  { label: '全部任务', value: 'all' },
  { label: '进行中', value: 'ongoing' },
];

interface DashboardMetrics {
  total: number;
  ongoing: number;
  holidays: number;
  leaves: number;
}

/** 概览指标配置：新增指标只需在此追加一项，页面布局不变。 */
const buildMetrics = ({ total, ongoing, holidays, leaves }: DashboardMetrics): (StatCardProps & { key: string })[] => [
  {
    key: 'total',
    icon: <CalendarOutlined />,
    label: '任务总数',
    value: total,
    hint: `其中进行中 ${ongoing} 个`,
    tone: 'primary',
  },
  {
    key: 'ongoing',
    icon: <ClockCircleOutlined />,
    label: '进行中',
    value: ongoing,
    hint: '今日仍在执行',
    tone: 'success',
  },
  {
    key: 'holidays',
    icon: <FlagOutlined />,
    label: '节假日',
    value: holidays,
    hint: '已标记的假期',
    tone: 'warning',
  },
  {
    key: 'leaves',
    icon: <UserOutlined />,
    label: '请假',
    value: leaves,
    hint: '已标记的请假',
    tone: 'error',
  },
];

const DashboardPage: React.FC = () => {
  const { token } = theme.useToken();
  const { events, dateMarks, error } = useCalendarData();
  const location = useLocation();
  const navigate = useNavigate();
  const range = readEnumParam(location.search, RANGE_PARAM, RANGE_VALUES, 'all');
  const today = dayjs().startOf('day');

  const sortedEvents = React.useMemo(
    () => [...events].sort((left, right) => left.start.valueOf() - right.start.valueOf()),
    [events],
  );
  const ongoingCount = countOngoing(sortedEvents, today);
  const visibleEvents = range === 'ongoing' ? filterOngoing(sortedEvents, today) : sortedEvents;
  const metrics = buildMetrics({
    total: sortedEvents.length,
    ongoing: ongoingCount,
    holidays: countDateMarks(dateMarks, 'holiday'),
    leaves: countDateMarks(dateMarks, 'leave'),
  });

  const changeRange = (value: string | number) => {
    const next: RangeKey = value === 'ongoing' ? 'ongoing' : 'all';
    navigate(
      {
        pathname: location.pathname,
        // 默认范围不写参数，保持地址简洁。
        search: updateSearchParams(location.search, { [RANGE_PARAM]: next === 'ongoing' ? next : null }),
      },
      { replace: true },
    );
  };

  return (
    <>
      {error && <Alert type="error" showIcon message="日历数据读取失败" description={error} />}
      <Row gutter={[token.marginSM, token.marginSM]}>
        {metrics.map(({ key, ...metric }) => (
          <Col key={key} xs={12} md={6}>
            <StatCard {...metric} />
          </Col>
        ))}
      </Row>
      <div style={{ marginTop: token.marginSM }}>
        <DashboardCharts events={sortedEvents} ongoing={ongoingCount} />
      </div>
      <Card
        size="small"
        style={{ marginTop: token.marginSM }}
        title={(
          <Space size={token.marginXXS}>
            <ProfileOutlined />
            任务列表
          </Space>
        )}
        extra={<Segmented size="small" options={[...RANGE_OPTIONS]} value={range} onChange={changeRange} />}
      >
        <List
          size="small"
          dataSource={visibleEvents}
          locale={{ emptyText: '暂无任务' }}
          renderItem={(event) => (
            <List.Item
              extra={<Tag>{event.end.startOf('day').diff(event.start.startOf('day'), 'day') + 1} 天</Tag>}
            >
              <List.Item.Meta
                title={event.title}
                description={`${event.start.format(DATE_FORMAT)} → ${event.end.format(DATE_FORMAT)}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
};

export default DashboardPage;
