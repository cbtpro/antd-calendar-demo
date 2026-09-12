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

const dayjs = require('dayjs');
const { isWorkingDate, moveEventRange } = require(path.resolve(__dirname, '../src/components/EventCalendar/workday.ts'));
const marks = [
  { date: dayjs('2026-01-19'), type: 'holiday' },
  { date: dayjs('2026-01-18'), type: 'workday' },
  { date: dayjs('2026-01-20'), type: 'leave' },
];
const working = date => isWorkingDate(date, marks.filter(mark => mark.date.isSame(date, 'day')));
const event = { start: dayjs('2026-01-05'), end: dayjs('2026-01-07') };
let moved = moveEventRange(event, dayjs('2026-01-16'), working);
assert.equal(moved.start.format('YYYY-MM-DD'), '2026-01-16');
assert.equal(moved.end.format('YYYY-MM-DD'), '2026-01-21');
// 起点为周末时保留落点，工期从后续工作日消耗，包含周日补班。
moved = moveEventRange(event, dayjs('2026-01-17'), working);
assert.equal(moved.start.format('YYYY-MM-DD'), '2026-01-17');
assert.equal(moved.end.format('YYYY-MM-DD'), '2026-01-22');
moved = moveEventRange(event, dayjs('2026-01-30'), working);
assert.equal(moved.end.format('YYYY-MM-DD'), '2026-02-03');
assert.equal(moveEventRange({start:dayjs('2026-01-10'),end:dayjs('2026-01-11')}, dayjs('2026-01-12'), working), null);
assert.equal(isWorkingDate(dayjs('2026-01-18'), [{date:dayjs('2026-01-18'),type:'workday'}, {date:dayjs('2026-01-18'),type:'leave'}]), false);
assert.equal(moveEventRange(event,event.start,working).end.format('YYYY-MM-DD'),'2026-01-07');
console.log('工作日工期检查通过：节假日、请假、补班、周末落点、跨月及零工作量。');
