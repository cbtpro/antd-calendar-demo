# 从零实现支持跨天对齐的任务日历

本文指导你从空目录搭建当前 demo，完成开发任务展示、重叠任务分行、跨天对齐、主题样式及可复用组件封装。示例使用 React、TypeScript、Ant Design、Emotion 和 Day.js；不需要后端服务。

按照步骤创建文件后即可运行。代码以本项目当前实现为基准，模拟数据是 2026 年 1 月的「订单后台 v2.3」迭代，不是真实业务记录。

## 效果预览

下图展示「订单后台 v2.3」在 2026 年 1 月的任务排期。颜色仅用于视觉上区分任务，不代表任务类型、状态或优先级。

![开发任务日历演示：多任务重叠展示，跨日期片段按固定泳道对齐](../screenshot/screenshot-20260911-091403.png)

可以重点观察 1 月 11 日：第一条泳道留空，订单列表任务和权限审计任务仍分别位于第二、第三条泳道。12 日新的异步导出任务进入第一条泳道，原有任务的位置保持不变。这正是后文泳道 `lane` 算法要实现的效果。

## 示例来源与 antd 5 适配背景

本教程参考了 Ant Design 6 官方 Calendar 的 [「跨日期事件」示例](https://ant-design.antgroup.com/components/calendar-cn#calendar-demo-event-range)。在 antd 6 文档中可以看到这一效果；对于仍然使用 antd 5 的内网项目，也可以沿用这种按日期绘制任务片段的思路，通过调整样式接入方式实现跨日期展示，无需仅为此功能升级到 antd 6。

**本文面向 antd 5 的实现方案：保留日期单元格自定义渲染，将 v6 的内部语义样式入口替换为局部 CSS 选择器，再加入泳道 lane 算法解决重叠任务的跨天对齐。**

### 官方示例思路如何用在 antd 5 中

跨日期任务可以拆成多个日期单元格里的片段，根据真实起止日期分别绘制首段、中间段和末段，再通过样式把相邻片段连接起来。这一实现依赖自定义渲染与 CSS 布局，不要求 Calendar 提供一个独立的“跨日期事件”数据接口。

版本之间需要适配的是样式入口。官方 Calendar API 标注：`cellRender` 从 5.4.0 开始提供，`styles`、`classNames` 从 6.0.0 开始提供，其中 `itemContent` 语义节点标注为 6.4.0。因此，迁移到 antd 5 时不能直接使用 `styles.itemContent` 或 `classNames.itemContent`。[版本依据](https://ant-design.antgroup.com/components/calendar-cn#api)

| 实现环节 | 本文在 antd 5 中的处理 |
| --- | --- |
| 日期单元格渲染 | 使用 `cellRender`，要求 antd ≥ 5.4.0 |
| 跨日期片段 | 保留 `start`、`middle`、`end`、`single` 的判断和样式 |
| 内部内容区溢出 | 通过 Emotion 根节点样式中的嵌套选择器设置 `overflow: visible` |
| 自定义类名前缀 | 使用 `getPrefixCls('picker', customizePrefixCls)`，与 Calendar 保持一致 |
| 多任务跨天对齐 | 增加固定泳道 `lane`，用 CSS Grid 保留行位与空位 |
| 业务复用 | 将数据、布局算法、样式和组件接口分别组织 |

例如，在默认前缀下，本文覆盖的内容区是 `.ant-picker-calendar-date-content`。对应的核心样式为：

```ts
calendar: css`
  &&& .${prefixCls}-calendar-date-content {
    overflow: visible;
  }
`,
```

再通过 `<Calendar css={styles.calendar} cellRender={cellRender} />` 应用。Emotion 会生成根节点 className，嵌套选择器只作用于当前日历。完整实现见第 5、6 节。

对基本跨日期效果而言，主要是调整样式接入方式；对于多个任务同时进行的业务场景，还需要处理固定行位。本文第 4 节详细介绍的**泳道 lane** 就负责这一部分：前面的任务结束后，后面的跨天任务仍留在原泳道，避免每天重新排列造成错位。

### 教程目标与仓库验证版本

当前演示仓库使用 `antd: 5.0.2`，日期渲染采用该版本支持的 `dateCellRender`。前面的 `cellRender` 说明用于理解较新版本的适配：5.4.0 及以上可以使用 `cellRender`；本文完整源码保留对 5.0.2 的支持。

在公司已有 antd 5 项目中，可保留该项目现有的 React、构建工具与依赖版本，接入本文组件并按第 8 节验证；不需要照搬演示仓库的整份 `package.json`。内部 CSS 类名、间距和跨天条接缝仍需在实际使用的 antd 5 小版本中核对。

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

下面提供当前项目的依赖声明。`antd` 固定为 `5.0.2`，组件使用 `dateCellRender` 和 Emotion 嵌套选择器，不依赖 v6 的 `styles`/`classNames` 接口。`@ant-design/icons` 和 `clsx` 是现有项目保留的依赖，本实现没有直接使用它们；也不需要 `antd-style`。

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
    "antd": "5.0.2",
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
<html lang="zh-CN" class="event-calendar-demo">
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
  /** 在当前日历中唯一的任务标识。 */
  key: string;
  title: string;
  /** 开始日期和结束日期都计入任务占用范围。 */
  start: Dayjs;
  end: Dayjs;
  /** 默认使用当前主题的主色。 */
  color?: string;
}

export interface EventRenderInfo {
  date: Dayjs;
  lane: number;
  position: 'start' | 'middle' | 'end' | 'single';
}

export type EventCalendarProps<T extends CalendarEvent = CalendarEvent> = Omit<
  CalendarProps<Dayjs>,
  | 'styles'
  | 'classNames'
  | 'cellRender'
  | 'fullCellRender'
  | 'dateCellRender'
  | 'dateFullCellRender'
  | 'monthCellRender'
  | 'monthFullCellRender'
> & {
  events: readonly T[];
  /** 自定义任务在每天的片段内容，同时保留组件的布局。 */
  renderEvent?: (event: T, info: EventRenderInfo) => ReactNode;
  /** 点击任务片段时触发，由业务方展示详情；不会触发日期选择。 */
  onEventClick?: (event: T, info: EventRenderInfo) => void;
};
```

泛型 `T extends CalendarEvent` 允许任务携带 `owner`、`priority` 等业务字段，并在自定义渲染函数里保持类型推断。`readonly T[]` 表示组件不会修改传入数组。

## 4. 核心概念：泳道 lane 与固定行位分配

> **泳道 lane 是任务在时间轴上的固定纵向位置。先给整个任务分配泳道，再让它在每一天的片段使用同一个泳道，跨天才能对齐。**

### 4.1 什么是泳道

把日历展开为一张排期表：横轴是日期，纵轴是泳道。一条泳道是一条可以容纳任务的水平轨道，在每个日期单元格中对应相同编号的任务行。

`lane = 0` 表示第一条泳道，`lane = 1` 表示第二条，依此类推。任务从开始到结束都占据自己的泳道；只要日期不重叠，不同任务就可以先后复用同一条泳道。

这里的泳道是**布局坐标**：它不表示负责人、任务优先级、任务状态，也不表示日历里的第几周。日历换到下一周时，任务仍然位于日期内容区域内相同编号的任务行，并非停留在页面上相同的绝对 y 坐标。

| 概念 | 表示什么 | 示例 |
| --- | --- | --- |
| `event.key` | 任务的唯一身份 | C 无论在哪一天都叫 C |
| `event.lane` | 任务在本次布局中的泳道编号 | C 从 9 日到 13 日都在 lane 2 |
| 当天数组的 `index` | 任务在当天过滤结果中的位置 | 其他任务结束后，C 的 index 可能变成 0 |
| `gridRow` | CSS Grid 使用的行位置 | lane 2 对应 gridRow 3 |
| `laneEnds[i]` | 分配过程中第 i 条泳道最后占用的日期 | laneEnds[0] 为 9 日，则 10 日可分配新任务 |

业务方传入的任务不需要填写 `lane`，由 `assignEventLanes` 计算并附加到输出对象上。`renderEvent` 中的 `info.lane` 也来自这一计算结果。

### 4.2 泳道必须遵守的三个规则

1. **重叠隔离**：同一天仍在进行的两个任务必须使用不同泳道。
2. **跨天固定**：一个任务的所有日期片段使用相同泳道，不能因为当天任务数量减少而上移。
3. **结束后复用**：某条泳道上的任务结束后，后续任务可以复用它；首尾日期均计入占用，复用只能从结束日的下一天开始。

“泳道空了”只意味着新任务可以占用该位置，不意味着应把其他泳道上的进行中任务搬过来。这样既能复用空间，也能保留跨天对齐关系。

例如 A 在 lane 0 上于 9 日结束，C 在 lane 2 上持续到 13 日：10 日开始的新任务 D 可以放到 lane 0，但 C 仍留在 lane 2。

### 4.3 为什么每天 filter 后直接 map 会错位

假设 A 占 1 月 7–9 日，B 占 1 月 8–10 日。8 日过滤出的数组是 `[A, B]`，B 在第二行；10 日只剩 `[B]`，普通纵向列表会把 B 放到第一行。日期筛选没有错，缺少的是贯穿整个任务区间的行号。

因此先在完整任务集合上分配行号，再筛选某天任务。筛选时保留行号，不按当天数组索引重新编号。

### 4.4 如何分配和复用泳道

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
    // 结束日仍被任务占用，泳道只能从结束日的下一天开始复用。
    const availableLane = laneEnds.findIndex((end) => end.isBefore(event.start, 'day'));
    const lane = availableLane === -1 ? laneEnds.length : availableLane;
    laneEnds[lane] = event.end;

    return { ...event, lane };
  });
};
```

### 4.5 逐步推演：任务如何进入泳道

使用四个任务说明分配过程：

| 任务 | 开始 | 结束 | 分配过程 | lane |
| --- | --- | --- | --- | --- |
| A | 1 月 7 日 | 1 月 9 日 | 没有已有行，新建 | 0 |
| B | 1 月 8 日 | 1 月 10 日 | 第 0 行尚未结束，新建 | 1 |
| C | 1 月 9 日 | 1 月 13 日 | A、B 均占用当天，新建 | 2 |
| D | 1 月 10 日 | 1 月 10 日 | 第 0 行已于 9 日结束，复用 | 0 |

`laneEnds` 是分配算法的临时状态，随每次分配更新；任务对象上的 `lane` 则保留给后续渲染：

| 处理完的任务 | laneEnds（日期均为 1 月） | 发生了什么 |
| --- | --- | --- |
| A | [9 日] | 新增 lane 0 |
| B | [9 日, 10 日] | 新增 lane 1 |
| C | [9 日, 10 日, 13 日] | 新增 lane 2；9 日仍被 A 占用 |
| D | [10 日, 10 日, 13 日] | 复用 lane 0，并更新其结束日 |

分配完成后，A 和 D 都带有 `lane: 0`，它们的日期区间没有重叠，因此不会在同一天争用位置。`laneEnds` 不需要传给 UI。

最终按日期渲染，下面每一横行就是一条泳道：

| 行位 | 1/7 | 1/8 | 1/9 | 1/10 | 1/11 | 1/12 | 1/13 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lane 0 | A | A | A | D | 空 | 空 | 空 |
| lane 1 | 空 | B | B | B | 空 | 空 | 空 |
| lane 2 | 空 | 空 | C | C | C | C | C |

11 日只有 C，但它仍在第 3 行。前两行留空是对齐要求的一部分。

```text
日期         1/10       1/11
lane 0       [ D ]      [ 空 ]
lane 1       [ B ]      [ 空 ]
lane 2       [ C ] ───→ [ C ]   同一泳道，保持对齐
```

对照前面的[演示截图](#效果预览)，1 月 11 日第一条泳道留空、12 日被新任务复用，就是同一规则在实际开发任务中的体现。

11 日筛选出的数组只有 `[C]`，所以 C 的数组下标是 0；但它的 `lane` 仍然是 2。渲染必须使用 `gridRow: C.lane + 1`，不能使用 `gridRow: index + 1`。

这些空位由 Grid 的隐式行产生，不需要往任务数组里插入空任务。空位只占据布局空间，没有任务数据，也没有业务身份。

### 4.6 为什么这个算法成立

开始日期有序，所以每一行里已经放置的任务都不晚于当前任务开始。只有上一条任务已经在更早的日期结束时才复用该行，因此同一行内不会有日期重叠。

任务分配一次 `lane` 后，渲染期间不再改变它，所以各日期上的片段能保持行号一致。当所有行都不可复用时，每行都有一个任务覆盖当前开始日，必须新增行才能避免重叠。由此，所需行数等于最大同时占用任务数；每天的视觉空位仍可能很多。

### 4.7 复杂度与稳定性的范围

设任务数为 n、使用行数为 L：排序为 O(n log n)，逐个扫描可用行为 O(nL)，总计 O(n log n + nL)，最坏为 O(n²)。存储排序结果、输出数组及行状态需要 O(n + L) 空间。

当前日历每个日期都扫描任务，渲染 D 个日期的筛选成本约为 O(Dn)。对 demo 的 15 条任务足够简单直接；大量任务时可进一步按日期建立索引。

行位固定只针对同一份任务集合。新增、删除或调整日期会重新分配，部分旧任务可能换行。如果只向组件提供当前月的子集，跨月切换时也可能换行；要求稳定时应传入一致的数据集合，或进一步设计持久行位分配。

## 5. 用 Emotion 编写样式 hook

Emotion 的 `css` 返回序列化样式对象，不能当作 className 字符串使用。组件通过 `css={styles.cell}` 或 `css={[styles.bar, rangeStyle]}` 应用样式，并在 TSX 文件首行添加 `/** @jsxImportSource @emotion/react */`。[Emotion css prop 来源](https://emotion.sh/docs/css-prop)

样式 hook 使用 `theme.useToken()` 读取 Ant Design 主题，用 `useMemo` 根据 token 生成样式。模板字符串内的尺寸 token 是数字，因此需要显式添加 `px`。

创建 `src/components/EventCalendar/useStyle.ts`：

```ts
import { useContext, useMemo } from 'react';
import { css } from '@emotion/react';
import { ConfigProvider, theme } from 'antd';

const useStyle = (customizePrefixCls?: string) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('picker', customizePrefixCls);
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
      calendar: css`
        /* 仅作用于当前日历，覆盖 Ant Design 默认的溢出设置。 */
        &&& .${prefixCls}-calendar-date-content {
          overflow: visible;
        }
      `,
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
  }, [token, prefixCls]);

  return { styles };
};

export default useStyle;
```

### 5.1 将逻辑泳道映射为 Grid 行

关键是单列 Grid、统一的隐式行高，以及每个任务的显式行号：

```tsx
<div css={styles.list}>
  <span style={{ gridRow: event.lane + 1 }}>任务内容</span>
</div>
```

泳道算法决定“放在哪一行”，Grid 决定“这一行在页面上如何占据空间”，两者缺一不可：只计算 lane 却继续使用普通纵向列表，仍然会错位。

CSS Grid 行号从 1 开始，算法从 0 开始，所以需要 `+ 1`。即使当天只有 `lane = 2` 的任务，Grid 也会为前两行保留固定高度和间距。`minmax(0, 1fr)` 允许列在长标题下收缩，配合省略号限制溢出。

### 5.2 任务条如何连接

| 片段位置 | 样式处理 | 默认标题 |
| --- | --- | --- |
| start | 左侧圆角，向右扩展 | 显示 |
| middle | 两侧扩展，无圆角 | 不显示 |
| end | 右侧圆角，向左扩展 | 不显示 |
| single | 两端圆角 | 显示 |

负 margin 补偿日期单元格的内边距与间隔；对日历内部 `*-calendar-date-content` 设置 `overflow: visible` 允许片段越过单元格内容区域，产生连续任务条的视觉效果。该补偿与当前 Ant Design 全尺寸日历布局有关；修改单元格 padding、紧凑模式或主题尺寸后应重新检查接缝。

算法保证的是行位。当前样式不在每周起点补画圆角或重复标题；跨周时仍依据任务真实起止日期判断片段。任务开始日在可视区外时，可能只看到没有文字的延续条，可悬停查看 `title`。

## 6. 封装 EventCalendar

当前 Calendar 的 `dateCellRender` 提供日期，我们只为日期单元格绘制任务条；年视图的月份单元格不绘制任务。[Calendar API 来源](https://ant.design/components/calendar/)

组件流程：

1. `useMemo` 根据整个 `events` 数组计算布局。
2. 在 `dateCellRender` 中筛选 `start ≤ date ≤ end` 的任务。
3. 判断片段位置，选择首段、末段或中间段样式。
4. 使用预先分配的 `lane` 定位，按任务颜色或主题主色绘制。
5. 若传入 `renderEvent`，由业务方生成片段内容。
6. 通过 Emotion 的 `css` 属性给 Calendar 根节点附加样式类，将其他 Calendar props 透传。

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
  onEventClick,
  ...calendarProps
}: EventCalendarProps<T>) {
  const { token } = theme.useToken();
  const { styles } = useStyle(calendarProps.prefixCls);
  const layoutEvents = useMemo(() => assignEventLanes(events), [events]);

  const dateCellRender = useCallback<NonNullable<CalendarProps<Dayjs>['dateCellRender']>>(
    (date) => {
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
                  role={onEventClick ? 'button' : undefined}
                  tabIndex={onEventClick ? 0 : undefined}
                  aria-label={event.title}
                  onClick={(clickEvent) => {
                    // 任务交互不向日期单元格冒泡，保留日历自身的日期选择逻辑。
                    clickEvent.stopPropagation();
                    onEventClick?.(event, { date, lane: event.lane, position });
                  }}
                  onKeyDown={(keyEvent) => {
                    // 避免日历响应任务上的键盘操作；自定义内容自行处理内部交互。
                    keyEvent.stopPropagation();
                    if (
                      onEventClick &&
                      keyEvent.target === keyEvent.currentTarget &&
                      (keyEvent.key === 'Enter' || keyEvent.key === ' ')
                    ) {
                      keyEvent.preventDefault();
                      if (!keyEvent.repeat) {
                        onEventClick(event, { date, lane: event.lane, position });
                      }
                    }
                  }}
                  style={{
                    cursor: onEventClick ? 'pointer' : undefined,
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
    [layoutEvents, renderEvent, onEventClick, styles, token.colorPrimary],
  );

  return <Calendar {...calendarProps} css={styles.calendar} dateCellRender={dateCellRender} />;
}

export default EventCalendar;
```

Ant Design 5 没有 Calendar 的 `styles` 接口，因此使用 `css={styles.calendar}`。Emotion 将其转换为根节点的 className，嵌套选择器只影响当前日历。`&&&` 提高选择器优先级，以覆盖组件默认 overflow。通过 `ConfigProvider.ConfigContext.getPrefixCls` 获取与 Calendar 一致的前缀，也兼容全局或单组件自定义 prefixCls。可以继续用 `className` 引用业务 CSS，或用 `style` 设置根节点行内样式。

此方案依据 [Ant Design 5 Calendar 源码](https://github.com/ant-design/ant-design/blob/5.29.3/components/calendar/generateCalendar.tsx) 的内部类名实现；升级组件库时应核对 DOM 类名。当前 demo 使用 antd 5.0.2，内网项目可按自己的小版本验证。

`useMemo` 的依赖是数组引用。更新任务时请创建新数组，例如 `setEvents(previous => [...previous, newEvent])`，不要原地 `push` 后仍传入同一个数组。

创建统一导出入口，使业务侧只需从组件目录导入：

创建 `src/components/EventCalendar/index.ts`：

```ts
export { default } from './EventCalendar';
export type { CalendarEvent, EventCalendarProps, EventRenderInfo } from './types';
```

## 7. 接入真实风格的模拟任务

模拟任务围绕一次完整迭代展开：需求评审 → 前后端并行开发 → 联调 → 回归与压测 → 缺陷修复 → 验收和灰度观察。

任务颜色仅用于辅助区分不同任务，可按需设置，没有业务含义。泳道分配和跨天对齐不依赖颜色。

创建 `src/demo.tsx`：

```tsx
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
```

这里指定初始日期为 `2026-01-01`，确保打开后能看到模拟任务。如果改为当前日期，请同步调整任务日期，否则初始月份可能没有任务。

最后创建 React 入口：

创建 `src/index.tsx`：

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Demo from './demo';
import './index.css';

const container = document.getElementById('container');

if (!container) {
  throw new Error('Missing root container');
}

createRoot(container).render(<Demo />);
```

入口检查容器是否存在，既满足 TypeScript 严格空值检查，也使模板配置错误更容易定位。任务条样式集中在 hook 中；入口还引入 `index.css`，用于下面的页面滚动条占位优化。

### 7.1 点击任务，由业务方展示详情

`onEventClick(event, info)` 接收被点击的任务及片段上下文：`date` 是点击日期，`lane` 是泳道编号，`position` 是片段位置。泛型任务上的业务字段会保留。任务条的首段、中间段和末段都可以点击。

组件先调用 `stopPropagation()`，再调用外部回调，阻止点击冒泡到日期单元格。即使没有传入回调，点击任务也不会触发日期选择。日期空白区域继续由 Calendar 处理，`onSelect`、`onChange` 无需拦截或改写。

传入回调后，任务条可通过 Tab 聚焦，Enter 或空格键触发回调；键盘事件也不会冒泡到日历。自定义渲染内容若有按钮等内部交互，可以自行阻止冒泡，避免触发外层任务回调。

demo 用 `selectedEvent` 保存点击的任务，并通过声明式 `Modal` 显示标题、标识、起止日期和持续天数。通用组件不管理弹窗状态，业务方可替换为抽屉、详情页或自己的弹窗。

### 7.2 避免详情弹窗引起页面宽度变化

弹窗会锁定背景滚动。传统滚动条消失后，可用页面宽度会变化；当前弹窗依赖还会设置 body 宽度来补偿滚动条。可以用 `scrollbar-gutter: stable` 固定滚动条占位，并取消重复的宽度补偿。[属性说明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter)

在 HTML 根元素添加 `class="event-calendar-demo"`（上方模板已包含），创建 `src/index.css`：

```css
@supports (scrollbar-gutter: stable) {
  html.event-calendar-demo {
    /* 弹窗隐藏滚动条时仍保留占位，避免日历列宽变化。 */
    scrollbar-gutter: stable;
  }

  html.event-calendar-demo body {
    /* 浏览器已经预留空间，无需弹窗再次缩减页面宽度；保留滚动锁定。 */
    width: auto;
  }
}
```

入口通过 `import './index.css'` 加载。该规则只作用于 demo 页面，不写入可复用日历组件。`html.event-calendar-demo body` 的优先级高于当前弹窗注入的 `html body`，仅覆盖 width，不覆盖 overflow，因此背景仍然无法滚动。

`@supports` 保证只有支持该属性的浏览器才取消宽度补偿；旧浏览器继续使用弹窗原有补偿。浮层滚动条不占布局宽度，此属性不会为它额外留空。接入其他项目时应结合其滚动容器及弹窗库的补偿方式调整。

验收时分别在页面有、无纵向滚动条的情况下反复打开与关闭详情，检查日历左右边缘不移动，弹窗打开期间背景不可滚动，关闭后恢复原滚动位置。

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
| 点击任务 | 点击首段、中间段、末段，或聚焦后按 Enter/空格 | 打开详情，不改变选中日期，不触发日期回调 |
| 点击日期空白 | 点击没有任务条覆盖的日期区域 | 正常触发日期选择 |
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
| 条形之间出现间隙或被裁切 | 核对负 margin、主题尺寸和 日期内容容器的 overflow |
| 更新任务后不变化 | 不要原地修改数组；传入新的数组引用 |
| 月份中间的延续任务不显示标题 | 当前仅真实起点显示标题，可通过 renderEvent 扩展 |
| 任务太多时超出日期格 | 当前无折叠或“更多”入口；需要额外设计周行高度或汇总交互 |
| npm 提示 peer 依赖冲突 | 使用本文的 legacy-peer-deps 安装方式，再运行类型与构建检查 |

## 11. 初始化版本控制

创建忽略文件：

创建 `.gitignore`：

```gitignore
# 依赖目录
node_modules/

# 构建与测试产物
build/
dist/
coverage/
*.tsbuildinfo
.cache/

# 本地环境变量
.env
.env.*
!.env.example

# 日志
*.log

# 编辑器历史与操作系统文件
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

本教程已经完成从数据到布局再到封装的实现。若业务需要更多能力，可分别增加日期索引加速、任务详情编辑、周起点标签、高密度任务折叠、服务端数据接入或数据变化后的持久行位策略。每项扩展都应保持「先统一分配行位，再按日期筛选并使用固定行号渲染」的基本流程。

快速 API 说明见 [组件 README](../src/components/EventCalendar/README.md)，完整源码见 [组件目录](../src/components/EventCalendar/)。
