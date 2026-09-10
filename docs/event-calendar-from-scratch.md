# 从零实现支持跨天对齐的任务日历

本文指导你从空目录搭建当前 demo，完成开发任务展示、重叠任务分行、跨天对齐、主题样式及可复用组件封装。示例使用 React、TypeScript、Ant Design、Emotion 和 Day.js；不需要后端服务。

按照步骤创建文件后即可运行。代码以本项目当前实现为基准，模拟数据是 2026 年 1 月的「订单后台 v2.3」迭代，不是真实业务记录。

## 1. 明确目标与实现边界

我们希望一条任务在起止日期之间每天出现，并在同一天与其他任务分行显示。同一条任务跨天时始终占据同一行；前面的任务结束后，空位仍然保留。

本 demo 将起止日期都计为占用日，使用自然日比较。跨周、跨月仍保持相同行号，但每个日期单元格各自绘制片段，不是用一个 DOM 元素横跨整个月。当前不包含拖拽排期、任务编辑、服务端存储、按小时排程或年视图任务汇总。

实现分成三个部分：

| 部分 | 职责 | 文件 |
| --- | --- | --- |
| 业务示例 | 提供模拟任务与初始月份 | `src/demo.tsx` |
| 任务布局 | 为每条任务计算固定的 `lane` | `eventLayout.ts` |
| 通用组件 | 筛选当天任务、应用样式、透传配置 | `EventCalendar.tsx` |

```mermaid
flowchart TD
  A[业务任务数组 events] --> B[按日期排序并分配固定 lane]
  B --> C[日历请求渲染某一天]
  C --> D[筛选覆盖当天的任务]
  D --> E[判断 start / middle / end / single]
  E --> F[用 gridRow 放到固定行]
```

## 2. 建立工程

### 2.1 环境与安装方式

本次文档核对环境为 Node.js `22.22.2`、npm `10.9.7`。教程沿用项目的 `react-scripts@5.0.1`，便于复现现有代码。

在一个新目录执行：

```bash
mkdir event-calendar-demo
cd event-calendar-demo
mkdir -p public src/components/EventCalendar
```

下面提供当前项目的依赖声明。`antd` 固定为 `6.6.3`，本文使用该版本的 Calendar 语义样式接口。`@ant-design/icons` 和 `clsx` 是现有项目保留的依赖，本实现没有直接使用它们；也不需要 `antd-style`。

创建 `package.json`：

```json
{
  "browserslist": [
    ">0.2%",
    "not dead"
  ],
  "dependencies": {
    "@ant-design/icons": "^6.3.4",
    "@emotion/react": "^11.14.0",
    "antd": "6.6.3",
    "clsx": "^2.1.1",
    "dayjs": "^1.11.11",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "19.2.18",
    "@types/react-dom": "^19.2.3",
    "react-scripts": "^5.0.1",
    "typescript": "^5.0.2"
  },
  "main": "index.js",
  "scripts": {
    "build": "react-scripts build",
    "eject": "react-scripts eject",
    "start": "react-scripts start",
    "test": "react-scripts test --env=jsdom"
  },
  "title": "跨日期事件 - antd@6.6.3"
}
```

保存后安装：

```bash
npm install --legacy-peer-deps
```

这里显式使用 `--legacy-peer-deps`，是因为当前工程的 TypeScript 5 超出了 `react-scripts@5.0.1` 声明的 TypeScript peer 范围。它跳过 peer 冲突检查，不代表所有版本天然兼容，后面仍需执行类型检查和构建。`^` 版本声明允许更新，安装后应保存 `package-lock.json`。

如果拿到的是本项目完整代码及锁文件，使用下面的命令复现锁定依赖，不必重新建目录：

```bash
npm ci --legacy-peer-deps
```

本教程统一使用 npm。不要交替运行 npm 和 pnpm 更新同一套依赖；本项目也存在 `pnpm-lock.yaml`，但以上步骤只使用 npm 锁文件。

### 2.2 最终目录

```text
event-calendar-demo/
├── public/
│   └── index.html
├── src/
│   ├── index.tsx
│   ├── demo.tsx
│   └── components/
│       └── EventCalendar/
│           ├── index.ts
│           ├── types.ts
│           ├── eventLayout.ts
│           ├── useStyle.ts
│           └── EventCalendar.tsx
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

`react-scripts` 要求 HTML 模板位于 `public/index.html`，业务代码位于 `src/`。把 HTML 放在根目录会出现 “Could not find a required file: index.html”。这里使用 TypeScript 入口 `src/index.tsx`，同时提供 `tsconfig.json`。[目录规则来源](https://create-react-app.dev/docs/folder-structure/)

### 2.3 页面模板与 TypeScript 配置

创建 `public/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>开发任务日历</title>
  </head>
  <body>
    <div id="container" style="padding: 24px"></div>
  </body>
</html>
```

挂载容器 ID 必须和入口文件一致。构建工具会自动注入 JavaScript，不必手写 script 引用。

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

`jsx: react-jsx` 启用 JSX 自动转换；`strict` 开启严格类型检查；`include: ["src"]` 限定源码目录。Emotion 组件还会声明自己的 JSX import source。

## 3. 定义任务模型和组件接口

先明确业务数据契约：任务具有唯一字符串 `key`、标题、Dayjs 起止日期和可选颜色。传入组件前应保证日期有效且开始不晚于结束，当前组件不会自动校验或修复错误数据。

组件继承常用 Calendar props，但移除原始单元格渲染入口，避免调用方覆盖负责对齐的布局。业务内容通过 `renderEvent` 扩展，外层任务条仍由组件管理。

创建 `src/components/EventCalendar/types.ts`：

```ts
import type { ReactNode } from 'react';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';

export interface CalendarEvent {
  /** Unique within this calendar. */
  key: string;
  title: string;
  /** Both start and end dates are inclusive. */
  start: Dayjs;
  end: Dayjs;
  /** Defaults to the current theme's primary color. */
  color?: string;
}

export interface EventRenderInfo {
  date: Dayjs;
  lane: number;
  position: 'start' | 'middle' | 'end' | 'single';
}

export type EventCalendarProps<T extends CalendarEvent = CalendarEvent> = Omit<
  CalendarProps<Dayjs>,
  | 'cellRender'
  | 'fullCellRender'
  | 'dateCellRender'
  | 'dateFullCellRender'
  | 'monthCellRender'
  | 'monthFullCellRender'
> & {
  events: readonly T[];
  /** Customizes each daily segment's content while retaining its layout. */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
};
```

泛型 `T extends CalendarEvent` 允许任务携带 `owner`、`priority` 等业务字段，并在自定义渲染函数里保持类型推断。`readonly T[]` 表示组件不会修改传入数组。

## 4. 实现固定行位分配算法

### 4.1 为什么每天 filter 后直接 map 会错位

假设 A 占 1 月 7–9 日，B 占 1 月 8–10 日。8 日过滤出的数组是 `[A, B]`，B 在第二行；10 日只剩 `[B]`，普通纵向列表会把 B 放到第一行。日期筛选没有错，缺少的是贯穿整个任务区间的行号。

因此先在完整任务集合上分配行号，再筛选某天任务。筛选时保留行号，不按当天数组索引重新编号。

### 4.2 排序和分配规则

1. 按开始日期升序处理任务。
2. 同一天开始的任务，结束更晚的排在前面。
3. 起止日期都相同时，按唯一 `key` 排序，使结果在同一运行环境中不依赖输入顺序。
4. 用 `laneEnds[i]` 记录第 i 行最后一个任务的结束日期。
5. 为新任务寻找第一条可复用行：该行结束日期必须严格早于新任务开始日期。
6. 找到则复用；否则在末尾新增一行。更新该行结束日期，返回任务及其 `lane`。

结束日包含在占用区间内，所以 10 日结束的任务和 10 日开始的任务不能共享同一行。Day.js 的 `isBefore(date, 'day')` 按日粒度比较，能表达这一规则。[日期比较来源](https://day.js.org/docs/en/query/is-before)

创建 `src/components/EventCalendar/eventLayout.ts`：

```ts
import type { Dayjs } from 'dayjs';

interface EventRange {
  key: string;
  start: Dayjs;
  end: Dayjs;
}

export const assignEventLanes = <T extends EventRange>(events: readonly T[]) => {
  const laneEnds: Dayjs[] = [];
  const sortedEvents = [...events].sort(
    (a, b) =>
      a.start.startOf('day').valueOf() - b.start.startOf('day').valueOf() ||
      b.end.startOf('day').valueOf() - a.end.startOf('day').valueOf() ||
      a.key.localeCompare(b.key),
  );

  return sortedEvents.map((event) => {
    // End dates are inclusive: a lane can only be reused on a later day.
    const availableLane = laneEnds.findIndex((end) => end.isBefore(event.start, 'day'));
    const lane = availableLane === -1 ? laneEnds.length : availableLane;
    laneEnds[lane] = event.end;

    return { ...event, lane };
  });
};
```

### 4.3 逐步推演

使用四个任务说明分配过程：

| 任务 | 开始 | 结束 | 分配过程 | lane |
| --- | --- | --- | --- | --- |
| A | 1 月 7 日 | 1 月 9 日 | 没有已有行，新建 | 0 |
| B | 1 月 8 日 | 1 月 10 日 | 第 0 行尚未结束，新建 | 1 |
| C | 1 月 9 日 | 1 月 13 日 | A、B 均占用当天，新建 | 2 |
| D | 1 月 10 日 | 1 月 10 日 | 第 0 行已于 9 日结束，复用 | 0 |

最终按日期渲染：

| 行位 | 1/7 | 1/8 | 1/9 | 1/10 | 1/11 | 1/12 | 1/13 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lane 0 | A | A | A | D | 空 | 空 | 空 |
| lane 1 | 空 | B | B | B | 空 | 空 | 空 |
| lane 2 | 空 | 空 | C | C | C | C | C |

11 日只有 C，但它仍在第 3 行。前两行留空是对齐要求的一部分。

### 4.4 为什么这个算法成立

开始日期有序，所以每一行里已经放置的任务都不晚于当前任务开始。只有上一条任务已经在更早的日期结束时才复用该行，因此同一行内不会有日期重叠。

任务分配一次 `lane` 后，渲染期间不再改变它，所以各日期上的片段能保持行号一致。当所有行都不可复用时，每行都有一个任务覆盖当前开始日，必须新增行才能避免重叠。由此，所需行数等于最大同时占用任务数；每天的视觉空位仍可能很多。

### 4.5 复杂度与稳定性的范围

设任务数为 n、使用行数为 L：排序为 O(n log n)，逐个扫描可用行为 O(nL)，总计 O(n log n + nL)，最坏为 O(n²)。存储排序结果、输出数组及行状态需要 O(n + L) 空间。

当前日历每个日期都扫描任务，渲染 D 个日期的筛选成本约为 O(Dn)。对 demo 的 15 条任务足够简单直接；大量任务时可进一步按日期建立索引。

行位固定只针对同一份任务集合。新增、删除或调整日期会重新分配，部分旧任务可能换行。如果只向组件提供当前月的子集，跨月切换时也可能换行；要求稳定时应传入一致的数据集合，或进一步设计持久行位分配。

## 5. 用 Emotion 编写样式 hook

Emotion 的 `css` 返回序列化样式对象，不能当作 className 字符串使用。组件通过 `css={styles.cell}` 或 `css={[styles.bar, rangeStyle]}` 应用样式，并在 TSX 文件首行添加 `/** @jsxImportSource @emotion/react */`。[Emotion css prop 来源](https://emotion.sh/docs/css-prop)

样式 hook 使用 `theme.useToken()` 读取 Ant Design 主题，用 `useMemo` 根据 token 生成样式。模板字符串内的尺寸 token 是数字，因此需要显式添加 `px`。

创建 `src/components/EventCalendar/useStyle.ts`：

```ts
import { useMemo } from 'react';
import { css } from '@emotion/react';
import { theme } from 'antd';

const useStyle = () => {
  const { token } = theme.useToken();

  const styles = useMemo(() => {
    const barRadius = 999;

    const {
      controlHeight,
      marginXXS,
      controlHeightSM,
      colorTextLightSolid,
      fontSizeSM,
      paddingXS,
      marginXS,
      paddingXXS,
    } = token;

    return {
      itemContent: { overflow: 'visible' as const },
      cell: css`
        min-height: ${controlHeight}px;
      `,
      list: css`
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-auto-rows: calc(${controlHeightSM}px - ${marginXXS}px);
        gap: ${marginXXS}px;
        margin-top: ${marginXXS}px;
      `,
      bar: css`
        display: block;
        height: calc(${controlHeightSM}px - ${marginXXS}px);
        overflow: hidden;
        color: ${colorTextLightSolid};
        font-size: ${fontSizeSM}px;
        white-space: nowrap;
        text-overflow: ellipsis;
      `,
      barStart: css`
        margin-inline-end: calc(-1 * (${paddingXS}px + ${marginXS}px / 2));
        padding-inline-start: calc(${paddingXXS}px + ${paddingXXS}px);
        border-start-start-radius: ${barRadius}px;
        border-end-start-radius: ${barRadius}px;
      `,
      barMiddle: css`
        margin-inline: calc(-1 * (${paddingXS}px + ${marginXS}px / 2));
      `,
      barEnd: css`
        margin-inline-start: calc(-1 * (${paddingXS}px + ${marginXS}px / 2));
        border-start-end-radius: ${barRadius}px;
        border-end-end-radius: ${barRadius}px;
      `,
      barSingle: css`
        padding-inline-start: calc(${paddingXXS}px + ${paddingXXS}px);
        border-radius: ${barRadius}px;
      `,
    };
  }, [token]);

  return { styles };
};

export default useStyle;
```

### 5.1 Grid 如何保留空行

关键是单列 Grid、统一的隐式行高，以及每个任务的显式行号：

```tsx
<div css={styles.list}>
  <span style={{ gridRow: event.lane + 1 }}>任务内容</span>
</div>
```

CSS Grid 行号从 1 开始，算法从 0 开始，所以需要 `+ 1`。即使当天只有 `lane = 2` 的任务，Grid 也会为前两行保留固定高度和间距。`minmax(0, 1fr)` 允许列在长标题下收缩，配合省略号限制溢出。

### 5.2 任务条如何连接

| 片段位置 | 样式处理 | 默认标题 |
| --- | --- | --- |
| start | 左侧圆角，向右扩展 | 显示 |
| middle | 两侧扩展，无圆角 | 不显示 |
| end | 右侧圆角，向左扩展 | 不显示 |
| single | 两端圆角 | 显示 |

负 margin 补偿日期单元格的内边距与间隔；`itemContent.overflow = visible` 允许片段越过单元格内容区域，产生连续任务条的视觉效果。该补偿与当前 Ant Design 全尺寸日历布局有关；修改单元格 padding、紧凑模式或主题尺寸后应重新检查接缝。

算法保证的是行位。当前样式不在每周起点补画圆角或重复标题；跨周时仍依据任务真实起止日期判断片段。任务开始日在可视区外时，可能只看到没有文字的延续条，可悬停查看 `title`。

## 6. 封装 EventCalendar

Calendar 的 `cellRender` 提供日期和单元格类型。我们只为日期单元格绘制任务条；年视图的月份单元格不绘制任务。[Calendar API 来源](https://ant.design/components/calendar/)

组件流程：

1. `useMemo` 根据整个 `events` 数组计算布局。
2. 在 `cellRender` 中筛选 `start ≤ date ≤ end` 的任务。
3. 判断片段位置，选择首段、末段或中间段样式。
4. 使用预先分配的 `lane` 定位，按任务颜色或主题主色绘制。
5. 若传入 `renderEvent`，由业务方生成片段内容。
6. 合并语义样式，将其他 Calendar props 透传。

创建 `src/components/EventCalendar/EventCalendar.tsx`：

```tsx
/** @jsxImportSource @emotion/react */
import { useCallback, useMemo } from 'react';
import { Calendar, theme } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';

import { assignEventLanes } from './eventLayout';
import useStyle from './useStyle';
import type { CalendarEvent, EventCalendarProps, EventRenderInfo } from './types';

const getRangePosition = (date: Dayjs, event: CalendarEvent): EventRenderInfo['position'] => {
  const starts = date.isSame(event.start, 'day');
  const ends = date.isSame(event.end, 'day');

  if (starts && ends) return 'single';
  if (starts) return 'start';
  if (ends) return 'end';
  return 'middle';
};

function EventCalendar<T extends CalendarEvent = CalendarEvent>({
  events,
  renderEvent,
  styles: calendarStyles,
  ...calendarProps
}: EventCalendarProps<T>) {
  const { token } = theme.useToken();
  const { styles } = useStyle();
  const layoutEvents = useMemo(() => assignEventLanes(events), [events]);

  const cellRender = useCallback<NonNullable<CalendarProps<Dayjs>['cellRender']>>(
    (date, info) => {
      if (info.type !== 'date') return null;

      const currentEvents = layoutEvents.filter(
        (event) => !date.isBefore(event.start, 'day') && !date.isAfter(event.end, 'day'),
      );

      return (
        <div css={styles.cell}>
          <div css={styles.list}>
            {currentEvents.map((event) => {
              const position = getRangePosition(date, event);
              const rangeStyle = {
                start: styles.barStart,
                middle: styles.barMiddle,
                end: styles.barEnd,
                single: styles.barSingle,
              }[position];

              return (
                <span
                  key={event.key}
                  css={[styles.bar, rangeStyle]}
                  title={event.title}
                  style={{
                    backgroundColor: event.color ?? token.colorPrimary,
                    gridRow: event.lane + 1,
                  }}
                >
                  {renderEvent
                    ? renderEvent(event, { date, lane: event.lane, position })
                    : position === 'start' || position === 'single'
                      ? event.title
                      : null}
                </span>
              );
            })}
          </div>
        </div>
      );
    },
    [layoutEvents, renderEvent, styles, token.colorPrimary],
  );

  const mergedStyles: CalendarProps<Dayjs>['styles'] = (info) => {
    const overrides = typeof calendarStyles === 'function' ? calendarStyles(info) : calendarStyles;
    return {
      ...overrides,
      itemContent: { ...styles.itemContent, ...overrides?.itemContent },
    };
  };

  return <Calendar {...calendarProps} styles={mergedStyles} cellRender={cellRender} />;
}

export default EventCalendar;
```

`styles` 同时支持对象和函数，因此合并时先解析用户样式，再合并 `itemContent`。调用方的同名样式优先；覆盖 `overflow` 可能改变跨天条显示。

`useMemo` 的依赖是数组引用。更新任务时请创建新数组，例如 `setEvents(previous => [...previous, newEvent])`，不要原地 `push` 后仍传入同一个数组。

创建统一导出入口，使业务侧只需从组件目录导入：

创建 `src/components/EventCalendar/index.ts`：

```ts
export { default } from './EventCalendar';
export type { CalendarEvent, EventCalendarProps, EventRenderInfo } from './types';
```

## 7. 接入真实风格的模拟任务

模拟任务围绕一次完整迭代展开：需求评审 → 前后端并行开发 → 联调 → 回归与压测 → 缺陷修复 → 验收和灰度观察。

蓝色表示开发，绿色表示测试验收，红色表示修复，黄色表示评审、联调或发布观察。这些颜色只是本 demo 的约定，由业务数据提供，通用组件不识别具体任务类别。

创建 `src/demo.tsx`：

```tsx
import React from 'react';

import { theme } from 'antd';
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

  return <EventCalendar events={events} defaultValue={dayjs('2026-01-01')} />;
};

export default App;
```

这里指定初始日期为 `2026-01-01`，确保打开后能看到模拟任务。如果改为当前日期，请同步调整任务日期，否则初始月份可能没有任务。

最后创建 React 入口：

创建 `src/index.tsx`：

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Demo from './demo';

const container = document.getElementById('container');

if (!container) {
  throw new Error('Missing root container');
}

createRoot(container).render(<Demo />);
```

入口检查容器是否存在，既满足 TypeScript 严格空值检查，也使模板配置错误更容易定位。当前任务样式都在 hook 中，不依赖独立的全局 CSS 文件。

## 8. 启动和验收

### 8.1 执行检查

在项目根目录运行：

```bash
npx tsc --noEmit
npm run build
npm run start
```

前两条应成功退出；启动后访问终端提示的本地地址，默认是 `http://localhost:3000`。开发服务器会持续运行，结束时按 Ctrl+C。

文档生成时，当前项目的生产构建已通过；本文没有在全新的空目录重新联网安装所有依赖。复现时以自己的锁文件、类型检查和构建结果为准。

### 8.2 独立验证布局算法

为了不依赖浏览器验证核心逻辑，可创建 `scripts/check-event-layout.cjs`，粘贴以下代码。它使用项目现有 TypeScript 依赖转译纯函数，再用 Node.js 断言验证；不需要安装测试框架。这里的转译不代替 `tsc --noEmit` 的类型检查。

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const dayjs = require('dayjs');

const source = fs.readFileSync(
  path.resolve('src/components/EventCalendar/eventLayout.ts'),
  'utf8',
);
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(output, context);
const { assignEventLanes } = context.exports;

const task = (key, start, end) => ({
  key,
  start: dayjs(start),
  end: dayjs(end),
});
const input = [
  task('A', '2026-01-07', '2026-01-09'),
  task('B', '2026-01-08', '2026-01-10'),
  task('C', '2026-01-09', '2026-01-13'),
  task('D', '2026-01-10', '2026-01-10'),
  task('E', '2026-01-30', '2026-02-03'),
  task('F', '2026-01-30', '2026-01-31'),
];
const result = assignEventLanes(input);
const laneOf = (key) => result.find((event) => event.key === key).lane;
assert.equal(laneOf('A'), 0);
assert.equal(laneOf('B'), 1);
assert.equal(laneOf('C'), 2);
assert.equal(laneOf('D'), 0);
assert.equal(laneOf('E'), 0); // 同日起始，较长任务先分配
assert.equal(laneOf('F'), 1);
assert.equal(assignEventLanes([]).length, 0);
assert.ok(input.every((event) => !('lane' in event)));
const signature = (events) => JSON.stringify(
  events.map(({ key, lane }) => ({ key, lane })),
);
assert.equal(signature(result), signature(assignEventLanes([...input].reverse())));

for (
  let date = dayjs('2026-01-01');
  date.isBefore('2026-02-05');
  date = date.add(1, 'day')
) {
  const active = result.filter(
    (event) => !date.isBefore(event.start, 'day') && !date.isAfter(event.end, 'day'),
  );
  assert.equal(new Set(active.map((event) => event.lane)).size, active.length);
}
console.log('布局检查通过');
```

从项目根目录执行：

```bash
node scripts/check-event-layout.cjs
```

### 8.3 浏览器验收

纯函数检查不能证明 CSS 的实际布局，仍需在页面核对：

| 场景 | 检查方法 | 期望结果 |
| --- | --- | --- |
| 重叠任务 | 查看 1 月 8–9 日 | 多条任务占据不同行，无互相覆盖 |
| 前序任务结束 | 比较 1 月 8 日和 9 日的权限审计任务 | 较早一行的筛选栏任务结束后，权限任务不向上补位 |
| 单日任务 | 查看 1 月 20 日的页码修复 | 只有一段，左右圆角都有 |
| 跨周 | 查看跨越周末的异步导出任务 | 每天仍使用相同行位 |
| 跨月 | 查看 1 月 30 日到 2 月 3 日的灰度观察 | 切到 2 月后仍在同一行位，最后一天显示末段 |
| 空数据 | 临时传入 `events={[]}` | 保留日历，无任务条 |
| 长标题 | 缩小浏览器宽度 | 标题省略，不撑宽日期列；悬停显示标题 |
| 数据更新 | 以新数组替换 events | 按新数据重新分配与渲染 |

## 9. 在其他业务页面复用

完整组件目录可迁移到另一个具有相同兼容依赖的 React 项目。下面是带负责人字段的受控日历示例，可保存为 `src/TeamSchedule.tsx`：

```tsx
import { useState } from 'react';
import dayjs from 'dayjs';
import EventCalendar from './components/EventCalendar';
import type { CalendarEvent } from './components/EventCalendar';

interface TeamEvent extends CalendarEvent {
  owner: string;
}

export default function TeamSchedule({ events }: { events: readonly TeamEvent[] }) {
  const [value, setValue] = useState(dayjs('2026-01-01'));

  return (
    <EventCalendar
      events={events}
      value={value}
      onChange={setValue}
      onSelect={(date) => console.log('选择日期', date.format('YYYY-MM-DD'))}
      renderEvent={(event, { position }) =>
        position === 'start' || position === 'single'
          ? `${event.title} · ${event.owner}`
          : null
      }
    />
  );
}
```

接口返回字符串日期时，应在业务数据转换层转为 Dayjs，并检查唯一 key、无效日期与逆序区间。需要时区语义时，也在转换层统一业务时区；当前 demo 只处理本地自然日，不推断服务端时间戳应该属于哪一天。

## 10. 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 找不到 public/index.html | 将模板放在 `public/`，确认从项目根目录启动 |
| 无法解析 ./demo | 检查 `src/demo.tsx`、导入大小写及根目录 tsconfig，添加配置后重启 |
| css 属性类型错误或样式不生效 | 确认 TSX 首行的 Emotion pragma 和 `jsx: react-jsx` |
| className 变成对象 | Emotion `css()` 结果要通过 `css` 属性使用，不能交给 clsx |
| 尺寸样式无效 | CSS 模板字符串插入数字 token 时添加 px |
| 跨天任务上移 | 检查是否按当天数组下标定位，应使用预分配 lane |
| 同一天任务被放入同一行 | 复用条件必须为严格早于，不能小于等于 |
| 条形之间出现间隙或被裁切 | 核对负 margin、主题尺寸和 itemContent 的 overflow |
| 更新任务后不变化 | 不要原地修改数组；传入新的数组引用 |
| 月份中间的延续任务不显示标题 | 当前仅真实起点显示标题，可通过 renderEvent 扩展 |
| 任务太多时超出日期格 | 当前无折叠或“更多”入口；需要额外设计周行高度或汇总交互 |
| npm 提示 peer 依赖冲突 | 使用本文的 legacy-peer-deps 安装方式，再运行类型与构建检查 |

## 11. 初始化版本控制

创建忽略文件：

创建 `.gitignore`：

```gitignore
# Dependencies
node_modules/

# Build and test output
build/
dist/
coverage/
*.tsbuildinfo
.cache/

# Local environment variables
.env
.env.*
!.env.example

# Logs
*.log

# Editor history and operating system files
.history/
.DS_Store
Thumbs.db
*.swp
*.swo
```

完成后可以执行：

```bash
git init
git status --short
git add .gitignore package.json package-lock.json tsconfig.json public src
git commit -m "feat: add reusable event calendar"
```

首次提交前配置自己的 Git 用户名与邮箱。应提交业务源码和 npm 锁文件，忽略 `node_modules/`、`build/`、日志及本地环境文件。

## 12. 后续扩展方向

本教程已经完成从数据到布局再到封装的实现。若业务需要更多能力，可分别增加日期索引加速、任务详情交互、周起点标签、高密度任务折叠、服务端数据接入或数据变化后的持久行位策略。每项扩展都应保持「先统一分配行位，再按日期筛选并使用固定行号渲染」的基本流程。

快速 API 说明见 [组件 README](../src/components/EventCalendar/README.md)，完整源码见 [组件目录](../src/components/EventCalendar/)。
