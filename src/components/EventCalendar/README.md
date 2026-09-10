# EventCalendar

基于 Ant Design Calendar 和 Emotion 的任务日历。组件接收外部数据，统一分配固定行位，保持重叠任务和跨天任务对齐；不包含模拟数据或业务日期。

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
- `color`：任务的可选颜色，默认使用 Ant Design 主题主色。
- `renderEvent(event, info)`：可选的任务内容渲染函数，每个日期上的任务片段都会调用。`info` 包含 `date`、从 0 开始的 `lane` 和 `position`（`start`、`middle`、`end`、`single`）。外层布局和颜色仍由组件处理；默认只在起始日或单日任务显示标题。
- 支持透传 `value`、`defaultValue`、`onChange`、`onSelect`、`onPanelChange`、`headerRender`、`locale`、`disabledDate`、`validRange`、`className` 等 Calendar 配置。受控日期用 `value` 配合 `onChange`。
- `styles` 支持对象或函数，与内部样式合并。自定义 `itemContent.overflow` 会影响跨天条的可见性。
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
