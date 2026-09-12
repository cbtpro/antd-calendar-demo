# 开发任务日历 Demo

基于 React、TypeScript、Ant Design 和 Emotion，支持开发任务展示、重叠任务分行以及跨天固定行位对齐。

- [从零到一开发教程](docs/event-calendar-from-scratch.md)：工程搭建、完整源码、布局算法推演、组件封装与验证。
- [组件使用说明](src/components/EventCalendar/README.md)：数据接口、自定义渲染和业务字段扩展。

- [本地存储接口](src/data/README.md)：首次初始化、任务与日期标记的增删改查。

## 运行

```bash
npm ci --legacy-peer-deps
npm run start
```

使用 `--legacy-peer-deps` 处理当前 react-scripts 与 TypeScript 的 peer 版本声明冲突。模拟任务位于 2026 年 1 月，初始月份已配置为该月。

## 检查

```bash
npx tsc --noEmit
npm run build
```
