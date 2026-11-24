const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(resolve(__dirname, '../src/pages/schedule/schedule-blocks.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} }; runInNewContext(code, { module: loaded, exports: loaded.exports });
const { subjectScheduleBlocks, timetableBlocks, timetableRange } = loaded.exports;
const block = (id, dayOfWeek, startTime = '07:00', endTime = '09:00', groupId = 'group-a') => ({ id, dayOfWeek, startTime, endTime, groupId });
const monday = block('monday-slot', 'monday');
const wednesday = block('wednesday-slot', 'wednesday', '13:30', '15:00');
const friday = block('friday-slot', 'friday', '22:00', '23:30');
const enrolled = { id: 'enrolled-a', status: 'reserved', subject: { credits: 4 }, schedule: { ...monday, group: { schedules: [friday, wednesday, monday] } } };

test('an enrollment anchored to Monday includes all three group blocks in weekly order', () => {
  assert.equal(subjectScheduleBlocks(enrolled).map(s => s.id).join(','), 'monday-slot,wednesday-slot,friday-slot');
  const cards = timetableBlocks([enrolled]);
  assert.equal(cards.length, 3);
  assert.equal(cards.filter(b => b.schedule.dayOfWeek === 'wednesday').length, 1);
  assert.equal(cards.every(card => card.subject === enrolled), true);
});
test('empty or older group responses retain their enrolled anchor', () => {
  for (const schedule of [monday, { ...monday, group: { schedules: [] } }]) {
    assert.equal(subjectScheduleBlocks({ ...enrolled, schedule })[0].id, monday.id);
  }
});
test('cancelled and missing schedules do not create cards', () => {
  assert.equal(timetableBlocks([{ ...enrolled, status: 'cancelled' }, { ...enrolled, schedule: undefined }]).length, 0);
});
test('duplicate schedule IDs and foreign group blocks are excluded', () => {
  const schedule = { ...monday, group: { schedules: [monday, monday, block('foreign-slot', 'tuesday', '07:00', '09:00', 'group-b')] } };
  assert.equal(subjectScheduleBlocks({ ...enrolled, schedule }).map(s => s.id).join(','), monday.id);
});
test('a second subject has its own blocks without multiplying subject credits', () => {
  const subjects = [enrolled, { ...enrolled, id: 'enrolled-b', schedule: block('tuesday-slot', 'tuesday', '10:00', '11:00', 'group-b') }];
  assert.equal(subjects.length, 2);
  assert.equal(subjects.reduce((sum, es) => sum + es.subject.credits, 0), 8);
  assert.equal(timetableBlocks(subjects).length, 4);
});
test('grid range includes classes before 6 AM and after 8 PM, including partial hours', () => {
  const range = timetableRange([block('early', 'monday', '05:30', '06:30'), friday]);
  assert.equal(range.startHour, 5); assert.equal(range.endHour, 24);
  assert.equal(timetableRange([]).startHour, 6); assert.equal(timetableRange([]).endHour, 20);
});

test('actual timetable renders one card per block, every detail day and one subject total', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const file = readFileSync(resolve(__dirname, '../src/pages/schedule/SchedulePage.tsx'), 'utf8');
  const output = ts.transpileModule(file, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const fixture = { ...enrolled, subject: { name: 'Test Subject', code: 'QA', credits: 4 } };
  const states = [[{ id: 'cycle-a', name: 'Cycle QA', year: 2191 }], 'cycle-a', { subjects: [fixture] }, false, false];
  let stateIndex = 0;
  const page = { exports: {} };
  const node = tag => props => React.createElement(tag, null, props.children);
  const localRequire = name => {
    if (name === 'react') return { ...React, useState: () => [states[stateIndex++], () => {}], useEffect: () => {} };
    if (name === './schedule-blocks') return loaded.exports;
    if (name === '@/components/layout/Layout') return { Layout: node('main') };
    if (name === '@/components/ui/Card') return { Card: node('section') };
    if (name === '@/components/ui/SearchableSelect') return { SearchableSelect: node('select') };
    if (name === '@/components/ui/Badge') return { Badge: () => null };
    if (name === '@/utils/formatDate') return { getDayName: day => day, formatTime: time => time };
    if (name.startsWith('@/api/')) return {};
    return require(name);
  };
  runInNewContext(output, { module: page, exports: page.exports, require: localRequire });
  const html = renderToStaticMarkup(React.createElement(page.exports.SchedulePage));
  assert.equal((html.match(/class="absolute inset-x-1 overflow-hidden/g) || []).length, 3);
  for (const day of ['monday', 'wednesday', 'friday']) assert.ok(html.includes('title="Test Subject · ' + day));
  assert.match(html, /wednesday 13:30 - 15:00/);
  assert.match(html, /friday 22:00 - 23:30/);
  assert.match(html, /1 materias · 4 créditos/);
  assert.match(html, /height:1008px/);
});
