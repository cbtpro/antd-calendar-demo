import React from 'react';

import { Card, Col, Row, Space, theme, Typography } from 'antd';
import { FieldTimeOutlined, PieChartOutlined, TagsOutlined } from '@ant-design/icons';

import BarDistribution from '../../components/BarDistribution';
import RingStat from '../../components/RingStat';
import {
  buildDurationDistribution,
  buildTypeDistribution,
  getOngoingRatio,
} from '../../shared/dashboard/analytics';
import type { CalendarEvent } from '../../shared/event/types';

const { Text } = Typography;

/** 类型分布最多展示的条数，避免长尾类型把卡片撑得过高。 */
const TOP_TYPE_ROWS = 5;

interface DashboardChartsProps {
  events: readonly CalendarEvent[];
  /** 进行中的任务数量。 */
  ongoing: number;
}

/** 仪表盘图表区：类型分布、时长分布、进行中占比，图表与文字说明组合展示。 */
const DashboardCharts: React.FC<DashboardChartsProps> = ({ events, ongoing }) => {
  const { token } = theme.useToken();
  const typeDistribution = buildTypeDistribution(events);
  const durationDistribution = buildDurationDistribution(events);
  const ongoingRatio = getOngoingRatio(ongoing, events.length);

  const renderTitle = (icon: React.ReactNode, text: string) => (
    <Space size={token.marginXXS}>
      {icon}
      {text}
    </Space>
  );

  return (
    <Row gutter={[token.marginSM, token.marginSM]}>
      <Col xs={24} md={8}>
        <Card
          size="small"
          style={{ height: '100%' }}
          title={renderTitle(<TagsOutlined />, '任务类型分布')}
          extra={<Text type="secondary">{`${typeDistribution.length} 类`}</Text>}
        >
          <BarDistribution items={typeDistribution.slice(0, TOP_TYPE_ROWS)} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card
          size="small"
          style={{ height: '100%' }}
          title={renderTitle(<FieldTimeOutlined />, '任务时长分布')}
          extra={<Text type="secondary">{`${events.length} 个任务`}</Text>}
        >
          <BarDistribution items={durationDistribution} tone="success" />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card
          size="small"
          style={{ height: '100%' }}
          title={renderTitle(<PieChartOutlined />, '进行中占比')}
        >
          <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
            <RingStat
              percent={ongoingRatio}
              label={`${ongoing} / ${events.length}`}
              hint="今日仍在执行的任务占比"
            />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {`共 ${events.length} 个任务，其余 ${events.length - ongoing} 个未开始或已结束`}
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardCharts;
