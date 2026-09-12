# EventCalendar

基于 Ant Design Calendar 和 Emotion 的任务日历。组件接收外部数据，统一分配固定行位，保持重叠任务和跨天任务对齐；不包含模拟数据或业务日期。

从空目录搭建并理解实现过程，请阅读 [从零到一开发教程](../../../docs/event-calendar-from-scratch.md)，其中包含完整源码、固定行位算法推演及验证方法。

## 示例来源与版本适配

本组件参考 [Ant Design 6 官方「跨日期事件」示例](https://ant-design.antgroup.com/components/calendar-cn#calendar-demo-event-range)，采用适用于 antd 5 的样式接入方式：使用 `dateCellRender` 和 Emotion 局部嵌套选择器，不依赖 v6 的 `styles`/`classNames`。在跨日期片段展示的基础上，增加泳道算法处理重叠任务对齐。

当前仓库使用 antd 5.0.2，通过 `dateCellRender` 渲染日期任务。接入内网项目时保留现有依赖，并验证实际小版本下的布局。

## 核心概念：泳道 lane

**泳道是任务在日期单元格中的固定行位，从 0 开始编号。** 组件先对完整任务集合分配泳道，再按日期筛选任务并使用 `gridRow: lane + 1` 渲染。

- 同一天重叠的任务分配到不同泳道。
- 同一任务的跨天片段始终使用相同泳道，即使前面的任务结束，也保留空位。
- 日期不重叠的任务可以先后复用同一泳道，结束日当天不可复用。

例如 C 在 lane 2 上持续到 13 日：即使 11 日当天只有 C，它仍然显示在第 3 行，不会因当天数组下标变成 0 而上移。`lane` 由组件计算，无需业务方填写；它是布局坐标，不是负责人或优先级。任务集合变化时会重新分配，不保证行号永久不变。

完整教程第 4 节通过泳道图和 `laneEnds` 状态表逐步解释分配过程。

## 基础用法

```tsx
import dayjs from 'dayjs';
import EventCalendar from './components/EventCalendar';
import type { CalendarEvent } from './components/EventCalendar';

const events: CalendarEvent[] = [
  {
    key: 'release',
    title: '版本发布',
    start: dayjs('2026-01-08'),
    end: dayjs('2026-01-10'),
  },
];

export default function Schedule() {
  return (
    <EventCalendar
      events={events}
      defaultValue={dayjs('2026-01-01')}
      onSelect={(date) => console.log(date.format('YYYY-MM-DD'))}
    />
  );
}
```

## 接口

- `events`：必传的只读任务数组；无任务时传 `[]`。`key` 必须唯一，`start` 和 `end` 为有效 Dayjs，且开始日期不晚于结束日期。首尾日期均计入占用范围。
- `color`：任务的可选颜色，默认使用 Ant Design 主题主色；仅用于视觉区分，不代表任务类型、状态或优先级，也不参与泳道分配。
- `onEventClick(event, info)`：任务点击回调，携带原有业务字段和片段上下文。点击任务不会触发日历日期选择；未传回调时也会阻止冒泡。支持 Enter/空格键激活，由业务方决定展示弹窗、抽屉或详情页。
- `renderEvent(event, info)`：可选的任务内容渲染函数，每个日期上的任务片段都会调用。`info` 包含 `date`、从 0 开始的 `lane` 和 `position`（`start`、`middle`、`end`、`single`）。外层布局和颜色仍由组件处理；默认只在起始日或单日任务显示标题。
- 支持透传 `value`、`defaultValue`、`onChange`、`onSelect`、`onPanelChange`、`headerRender`、`locale`、`disabledDate`、`validRange`、`className` 等 Calendar 配置。受控日期用 `value` 配合 `onChange`。
- 样式兼容 Ant Design 5：不使用 Calendar 的 `styles`/`classNames`，通过 Emotion 根节点样式和嵌套选择器覆盖日期内容容器。支持 `className` 和根节点 `style`，也支持 ConfigProvider 或组件的自定义 `prefixCls`。
- 单元格渲染由组件管理，不暴露原始 `cellRender`、`fullCellRender` 及其旧版接口。任务条显示在日期单元格中，年视图保留日历原有月份展示。

## 扩展业务字段

组件使用泛型推断任务类型，自定义渲染中可以直接访问业务字段：

```tsx
interface TeamEvent extends CalendarEvent {
  owner: string;
}

function TeamSchedule({ events }: { events: TeamEvent[] }) {
  return (
    <EventCalendar
      events={events}
      renderEvent={(event, { position }) =>
        position === 'start' || position === 'single'
          ? `${event.title} · ${event.owner}`
          : null
      }
    />
  );
}
```

更新任务时传入新的数组，以触发布局重新计算。同一份任务数据中每个任务的行位固定；任务集合变化后会重新分配行位。布局函数和样式 hook 均位于此目录，可整体迁移复用。

## 点击任务展示详情

```tsx
<EventCalendar
  events={events}
  onEventClick={(event, { date, lane, position }) => {
    setSelectedEvent(event);
  }}
/>
```

业务页面通过状态管理详情弹窗，完整示例见 `src/demo.tsx`。组件仅处理任务事件冒泡并调用回调，保留 Calendar 对空白日期区域的选择逻辑。自定义任务内容中的独立交互可自行阻止冒泡。

## 日期标记

```tsx
<EventCalendar
  events={events}
  dateMarks={[
    { date: dayjs('2026-01-01'), type: 'holiday', label: '元旦' },
    { date: dayjs('2026-01-04'), type: 'workday', label: '补班' },
    { date: dayjs('2026-01-14'), type: 'leave', label: '请假（模拟）' },
  ]}
/>
```

`CalendarDateMark` 类型从组件入口导出。节假日显示红字、红色透明背景及红底白字“休”；补班显示灰底白字“班”；请假显示灰底白字“请”。周末自动显示红色日期，补班优先覆盖周末和节假日样式，请假可以与其他标记并列。标记不占泳道，也不改变日期选择逻辑；不传 `dateMarks` 时仍自动标记周末。

## 非工作日任务片段

节假日、周末、请假日上的任务以半透明灰色背景和半透明灰色虚线边框显示，表示当天不计工作量。补班恢复任务原色；若补班日同时请假，仍按请假显示灰色。片段保持原泳道、尺寸、连接和点击行为，保证任务连续可见。

`renderEvent`、`onEventClick` 回调的 `info.isWorkingDay` 表示当前片段是否计入工作量。此标记不改变任务日期或详情中的自然日持续天数；当前请假标记作用于该日所有任务。
