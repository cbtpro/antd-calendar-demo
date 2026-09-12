# 日历本地存储

`calendarStorage` 管理任务及日期标记，使用 localStorage 键 `event-calendar-demo:data:v1`。demo 调用 `initialize()`，仅在存储键不存在时写入 `calendarSeed.ts` 的初始模拟数据；刷新时加载已保存的修改。当前页面内的增删改仅由用户操作主动调用 API 触发；查询和组件重渲染不会写入或重置数据。

## 任务增删改查

```ts
import { calendarStorage } from './data/calendarStorage';

// 初始化不会覆盖已有数据，业务按钮无需重复调用。
calendarStorage.initialize();
const all = calendarStorage.events.query();
// 日期范围查询返回与该区间重叠的任务，包含首尾日期。
const february = calendarStorage.events.query({ start: '2026-02-01', end: '2026-02-28' });
const task = calendarStorage.events.get('order-query-api');

calendarStorage.events.insert({
  key: 'new-task',
  title: '开发审批接口',
  start: '2026-02-04',
  end: '2026-02-06',
  color: '#1677ff',
});
calendarStorage.events.update('new-task', { title: '开发并联调审批接口', end: '2026-02-09' });
calendarStorage.events.remove('new-task');
```

## 日期标记增删改查

```ts
calendarStorage.dateMarks.query({ start: '2026-02-01', end: '2026-02-28' });
calendarStorage.dateMarks.get('2026-02-04', 'leave');
calendarStorage.dateMarks.insert({ date: '2026-02-04', type: 'leave', label: '年假' });
calendarStorage.dateMarks.update('2026-02-04', 'leave', { label: '事假' });
calendarStorage.dateMarks.remove('2026-02-04', 'leave');
```

任务通过 `key` 唯一定位，更新不改变 key。标记通过 `date + type` 唯一定位，允许同一天有不同类型标记。标记更新可以修改日期或类型，但不能与已有记录重复。

日期统一为有效的 `YYYY-MM-DD` 自然日字符串；不保存 Dayjs 对象或转换为 UTC 时间。存储层返回普通记录，`useCalendarData` 在展示层转换为 Dayjs。

## 返回值与错误

- `query` 返回新读取的记录数组，可传起止日期；不传返回全部。查询是只读操作，存储未初始化时抛错。
- `initialize()` 仅在存储不存在时写入种子；`initialize({ reset: true })` 主动覆盖为种子数据。demo 在页面加载时调用前者，不自动重置。
- `get` 找不到时返回 `undefined`。
- `insert`、`update` 返回保存的记录；重复插入、更新不存在的记录、无效日期或逆序区间会抛错。
- `remove` 返回是否删除成功，不存在返回 `false`。
- 存储不可用、空间不足、JSON 损坏或数据版本不兼容时抛错，查询不会覆盖已有内容；显式 reset 会恢复种子数据。业务调用方应捕获并展示错误。

## demo 响应更新

`useCalendarData()` 返回 `{ events, dateMarks, error, refresh }`。通过 API 写入成功后，本页会收到自定义事件并自动更新；其他同源标签页通过浏览器 `storage` 事件更新。直接在同页手动修改 localStorage 不会自动通知 hook，需要调用 `refresh()`。

当前不提供编辑表单，demo 从存储读取并展示详情，后续业务按钮可直接调用以上方法。存储层不依赖 React 或组件状态，也不会直接操作日历。

数据按浏览器和网站来源隔离，不会同步到服务器。拖动后通过 update 主动保存，刷新会加载修改后的数据。只有显式调用 reset 才会恢复模拟数据，其他同源标签页也会收到更新通知。多标签页写入没有事务锁，近乎同时修改时可能出现后写覆盖；多人协作应改用服务端。初始化颜色保存为具体颜色值，之后切换主题不会重写已存颜色。

## 验证

在项目根目录执行：

```bash
node scripts/check-calendar-storage.cjs
```

该检查使用内存 Storage，不修改真实浏览器数据。
