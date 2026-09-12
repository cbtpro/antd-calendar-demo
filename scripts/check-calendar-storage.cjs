const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// 在 Node 中加载存储层的 TypeScript，测试不读写真实浏览器数据。
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, filename);
};
const { createCalendarStorage, CALENDAR_STORAGE_KEY } = require(path.resolve(__dirname, '../src/data/calendarStorage.ts'));
const records = new Map();
let notifications = 0;
let failWrite = false;
const storage = {
  getItem: (key) => records.get(key) ?? null,
  setItem(key, value) {
    if (failWrite) throw new Error('存储空间不足');
    records.set(key, value);
  },
};
const store = createCalendarStorage(() => storage, () => notifications++);
assert.throws(() => store.events.query(), /尚未初始化/);
assert.equal(records.size, 0);
assert.equal(store.initialize().events.length, 15);
assert.equal(store.initialize().dateMarks.length, 6);
assert.equal(notifications, 1);
const event = { key: 'storage-test', title: '持久化测试', start: '2026-01-31', end: '2026-02-02' };
store.events.insert(event);
assert.ok(store.events.query({ start: '2026-02-01', end: '2026-02-01' }).some(e => e.key === event.key));
assert.ok(store.events.query({ start: '2026-02-02', end: '2026-02-02' }).some(e => e.key === event.key));
assert.throws(() => store.events.insert(event), /已存在/);
const beforeInvalid = records.get(CALENDAR_STORAGE_KEY);
assert.throws(() => store.events.update(event.key, { end: '2026-02-30' }), /日期/);
assert.throws(() => store.events.update(event.key, { end: '2026-01-01' }), /开始日期/);
assert.equal(records.get(CALENDAR_STORAGE_KEY), beforeInvalid);
store.events.update(event.key, { title: '已更新' });
assert.equal(createCalendarStorage(() => storage).events.get(event.key).title, '已更新');
// 模拟拖动保存后刷新：创建新的存储实例并重新初始化，日期不能被种子覆盖。
store.events.update(event.key, { start: '2026-01-29', end: '2026-02-05' });
const reloaded = createCalendarStorage(() => storage);
reloaded.initialize();
assert.equal(reloaded.events.get(event.key).start, '2026-01-29');
assert.equal(reloaded.events.get(event.key).end, '2026-02-05');
const copy = store.events.get(event.key);
copy.title = '不能直接修改存储';
assert.equal(store.events.get(event.key).title, '已更新');
assert.throws(() => store.events.update('missing', {}), /不存在/);
assert.equal(store.events.remove('missing'), false);
assert.equal(store.events.remove(event.key), true);
assert.equal(store.events.get(event.key), undefined);
store.dateMarks.insert({ date: '2026-02-04', type: 'leave', label: '年假' });
store.dateMarks.insert({ date: '2026-02-04', type: 'workday' });
assert.equal(store.dateMarks.query({ start: '2026-02-04', end: '2026-02-04' }).length, 2);
assert.throws(() => store.dateMarks.update('2026-02-04', 'leave', { type: 'workday' }), /重复/);
store.dateMarks.update('2026-02-04', 'leave', { label: '事假' });
assert.equal(store.dateMarks.get('2026-02-04', 'leave').label, '事假');
assert.equal(store.dateMarks.remove('2026-02-04', 'leave'), true);
assert.equal(store.dateMarks.remove('2026-02-04', 'leave'), false);
const beforeFailure = records.get(CALENDAR_STORAGE_KEY);
const beforeNotifications = notifications;
failWrite = true;
assert.throws(() => store.events.insert(event), /空间不足/);
assert.equal(records.get(CALENDAR_STORAGE_KEY), beforeFailure);
assert.equal(notifications, beforeNotifications);
failWrite = false;
for (const e of store.events.query()) store.events.remove(e.key);
for (const m of store.dateMarks.query()) store.dateMarks.remove(m.date, m.type);
assert.equal(store.initialize().events.length, 0);
assert.equal(store.initialize().dateMarks.length, 0);
store.initialize({ reset: true });
assert.equal(store.events.query().length, 15);
assert.equal(store.dateMarks.query().length, 6);
records.set(CALENDAR_STORAGE_KEY, '{broken');
assert.throws(() => store.initialize());
assert.equal(records.get(CALENDAR_STORAGE_KEY), '{broken');
console.log('存储检查通过：初始化、查询、插入、更新、删除、重新读取、输入校验、空数据保留及写入失败保护。');
