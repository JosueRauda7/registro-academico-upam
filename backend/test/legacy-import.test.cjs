require('reflect-metadata');
require('ts-node/register/transpile-only');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const JSZip = require('jszip'); // ExcelJS's existing archive dependency; no new package.
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { ConfigService } = require('@nestjs/config');
const { randomBytes } = require('node:crypto');
const { LegacyImportService, IMPORT_HEADERS } = require('../src/application/legacy-subjects/legacy-import.service');
const { inspectXlsx, MAX_XLSX_BYTES } = require('../src/application/legacy-subjects/safe-xlsx');
const { LegacySubjectsController } = require('../src/application/legacy-subjects/legacy-subjects.controller');
const { LegacySubjectsService } = require('../src/application/legacy-subjects/legacy-subjects.service');
const { TransformInterceptor } = require('../src/common/interceptors/transform.interceptor');
const { GlobalExceptionFilter } = require('../src/common/filters/http-exception.filter');

const valid = ['000001', 'MAT-01', 7.25, 2020, 1, 'Migración histórica'];
async function workbook(rows = [valid], edit = () => {}) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Notas previas');
  sheet.addRow(IMPORT_HEADERS); rows.forEach(row => sheet.addRow(row)); edit(book, sheet);
  return Buffer.from(await book.xlsx.writeBuffer());
}
function file(buffer, originalname = 'notas.xlsx') {
  return { originalname, mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer };
}
function fixture() {
  const writes = [];
  const subjects = { findByCode: async code => code === 'MAT-01' ? { id: 'subject-1', isActive: true, career: 'QA' } : null,
    findAll: async () => [{ code: 'MAT-01', name: 'Matemática', career: 'QA' }] };
  const students = { findByCarnet: async carnet => carnet === '000001' ? { id: 'student-1', career: 'QA' } : null };
  const repo = { findByStudent: async () => [], importBatch: async rows => writes.push(rows) };
  return { service: new LegacyImportService(repo, students, subjects), repo, students, subjects, writes };
}

test('valid historical grades, zero, failed score, optional fields and actor are preserved', async () => {
  for (const score of [0, 5, 7.25, 10, '8,50']) {
    const { service, writes } = fixture();
    const result = await service.importFile(file(await workbook([['000001', 'MAT-01', score]])), 'actor');
    assert.deepEqual(result, { imported: 1, students: 1 });
    assert.equal(writes[0][0].registeredById, 'actor');
    assert.equal(writes[0][0].score, typeof score === 'string' ? 8.5 : score);
    assert.equal(writes[0][0].year, null);
  }
});

test('template has headers, instructions and catalog, no personal data, and passes archive inspection', async () => {
  const { service } = fixture(); const data = await service.template();
  await inspectXlsx(data);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(data);
  assert.deepEqual(book.getWorksheet('Notas previas').getRow(1).values.slice(1), IMPORT_HEADERS);
  assert.equal(book.getWorksheet('Notas previas').rowCount, 1);
  assert.equal(book.getWorksheet('Materias').getCell('A2').value, 'MAT-01');
  await assert.rejects(service.importFile(file(data), 'actor'), /no contiene notas/);
  book.getWorksheet('Notas previas').addRow(valid);
  assert.equal((await service.importFile(file(Buffer.from(await book.xlsx.writeBuffer())), 'actor')).imported, 1);
});

test('rejects invalid rows atomically with row numbers and no uploaded content in errors', async () => {
  const invalid = [
    ['', 'MAT-01', 7], [123, 'MAT-01', 7], ['000001', '', 7], ['000001', 'MAT-01', ''],
    ['000001', 'MAT-01', 11], ['000001', 'MAT-01', -1], ['000001', 'MAT-01', 7.123],
    ['000001', 'MAT-01', 7, 1800], ['000001', 'MAT-01', 7, 9999], ['000001', 'MAT-01', 7, 2020, 3],
    ['000001', 'MAT-01', 7, 2020, 1, 'x'.repeat(501)], ['000001', 'MAT-01', 7, null, null, '=HYPERLINK("evil")'],
    ['000001', 'MAT-01', 7, null, null, 0], ['000001', 'MAT-01', 7, null, null, '\u0001bad'],
  ];
  for (const row of invalid) {
    const { service, writes } = fixture();
    await assert.rejects(service.importFile(file(await workbook([valid, row])), 'actor'), error => {
      assert.equal(error.getStatus(), 400); assert.match(JSON.stringify(error.getResponse()), /Fila 3/); return true;
    });
    assert.equal(writes.length, 0);
  }
});

test('rejects duplicate, unknown, inactive or wrong-career records before writing', async () => {
  const cases = [
    (f) => { f.repo.findByStudent = async () => [{ subjectId: 'subject-1' }]; },
    (f) => { f.subjects.findByCode = async () => null; },
    (f) => { f.students.findByCarnet = async () => null; },
    (f) => { f.subjects.findByCode = async () => ({ id: 's', isActive: false, career: 'QA' }); },
    (f) => { f.subjects.findByCode = async () => ({ id: 's', isActive: true, career: 'OTHER' }); },
  ];
  for (const change of cases) {
    const f = fixture(); change(f);
    await assert.rejects(f.service.importFile(file(await workbook()), 'actor'), error => error.getStatus() === 400);
    assert.equal(f.writes.length, 0);
  }
  const f = fixture();
  await assert.rejects(f.service.importFile(file(await workbook([valid, valid])), 'actor'), /Bad Request/);
  assert.equal(f.writes.length, 0);
});

test('accepts 500 unique notes in one batch and serializes work per process', async () => {
  const f = fixture();
  f.subjects.findByCode = async code => ({ id: code, isActive: true, career: 'QA' });
  const rows = Array.from({ length: 500 }, (_, i) => ['000001', 'MAT-' + i, 6]);
  const buffer = await workbook(rows);
  let release; let entered;
  const waiting = new Promise(resolve => { entered = resolve; });
  f.repo.importBatch = async records => { entered(); await new Promise(resolve => { release = resolve; }); f.writes.push(records); };
  const first = f.service.importFile(file(buffer), 'actor');
  await waiting;
  await assert.rejects(f.service.importFile(file(buffer), 'actor'), error => error.getStatus() === 409);
  release();
  assert.equal((await first).imported, 500);
  assert.equal(f.writes[0].length, 500);
});

test('rejects formulas including cached results, links, objects, hidden/extra sheets and wrong headers', async () => {
  for (const value of [{ formula: '1+6', result: 7 }, { text: '7', hyperlink: 'https://example.invalid' }, { richText: [{ text: '7' }] }, new Date()]) {
    const f = fixture();
    await assert.rejects(f.service.importFile(file(await workbook([['000001', 'MAT-01', value]])), 'actor'));
    assert.equal(f.writes.length, 0);
  }
  for (const edit of [
    (_, s) => { s.getCell('A1').value = 'nombre'; },
    (_, s) => { s.state = 'hidden'; },
    (b) => { b.addWorksheet('Extra'); },
    (_, s) => { s.getCell('A502').value = 'exceso'; },
    (_, s) => { s.getCell('K2').value = 'exceso'; },
    (_, s) => { s.mergeCells('A4:F4'); },
  ]) {
    const f = fixture(); await assert.rejects(f.service.importFile(file(await workbook([valid], edit)), 'actor'));
    assert.equal(f.writes.length, 0);
  }
});

test('rejects masquerading/corrupt/oversized files and hostile ZIP/XML before parsing', async () => {
  const good = await workbook();
  const mutate = async (fn) => { const zip = await JSZip.loadAsync(good); await fn(zip); return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }); };
  const forgedSize = await mutate(z => z.file('xl/sharedStrings.xml', ' '.repeat(8 * 1024 * 1024 + 1)));
  // Lie about the expanded size: the actual decompression limit must still stop it.
  for (let at = 0; at < forgedSize.length - 46; at++) {
    if (forgedSize.readUInt32LE(at) === 0x02014b50) {
      const length = forgedSize.readUInt16LE(at + 28);
      if (forgedSize.subarray(at + 46, at + 46 + length).toString() === 'xl/sharedStrings.xml') forgedSize.writeUInt32LE(100, at + 24);
    }
  }
  const attacks = [
    Buffer.from('not a workbook'), good.subarray(0, good.length - 1), Buffer.alloc(MAX_XLSX_BYTES + 1), forgedSize,
    await mutate(z => z.file('xl/vbaProject.bin', 'macro')),
    await mutate(z => z.file('xl/embeddings/oleObject1.bin', 'object')),
    await mutate(async z => z.file('xl/worksheets/sheet1.xml', (await z.file('xl/worksheets/sheet1.xml').async('string')).replace('<worksheet ', '<!DOCTYPE x [<!ENTITY y "evil">]><worksheet '))),
    await mutate(async z => z.file('xl/worksheets/sheet1.xml', (await z.file('xl/worksheets/sheet1.xml').async('string')).replace('r="A2"', 'r="A999999999"'))),
    await mutate(async z => z.file('xl/worksheets/sheet1.xml', (await z.file('xl/worksheets/sheet1.xml').async('string')).replace('<sheetData>', '<cols><col min="1" max="999999999"/></cols><sheetData>'))),
    await mutate(z => z.file('xl/sharedStrings.xml', ' '.repeat(8 * 1024 * 1024 + 1))),
  ];
  for (const buffer of attacks) {
    const f = fixture(); await assert.rejects(f.service.importFile(file(buffer), 'actor')); assert.equal(f.writes.length, 0);
  }
  const f = fixture(); await assert.rejects(f.service.importFile(file(good, 'notas.xlsm'), 'actor'));
  await assert.rejects(f.service.importFile(undefined, 'actor'));
});

test('HTTP permissions, multipart bounds, template and import contract', async () => {
  const f = fixture(); const secret = randomBytes(48).toString('hex');
  const jwt = new JwtService({ secret });
  class TestModule {}
  Module({ controllers: [LegacySubjectsController], providers: [
    { provide: LegacySubjectsService, useValue: {} }, { provide: LegacyImportService, useValue: f.service },
    { provide: JwtService, useValue: jwt }, { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET: secret }) },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api'); app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new GlobalExceptionFilter()); app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(0, '127.0.0.1'); const base = (await app.getUrl()) + '/api/legacy-subjects';
  const token = role => jwt.sign({ sub: 'actor', email: 'qa@example.invalid', purpose: 'access', role });
  const upload = async (role, buffer, extra = false) => {
    const form = new FormData(); form.append('file', new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'notas.xlsx');
    if (extra) form.append('studentId', 'injected');
    return fetch(base + '/import', { method: 'POST', headers: role ? { Authorization: 'Bearer ' + token(role) } : {}, body: form });
  };
  try {
    const good = await workbook();
    assert.equal((await upload(null, good)).status, 401);
    for (const role of ['student', 'teacher', 'collector']) {
      assert.equal((await upload(role, good)).status, 403);
      assert.equal((await fetch(base + '/template', { headers: { Authorization: 'Bearer ' + token(role) } })).status, 403);
    }
    for (const role of ['administrator', 'administrative']) {
      const response = await fetch(base + '/template', { headers: { Authorization: 'Bearer ' + token(role) } });
      assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store');
      assert.equal((await upload(role, good)).status, 201);
    }
    assert.equal((await upload('administrator', Buffer.alloc(MAX_XLSX_BYTES + 1))).status, 413);
    assert.equal((await upload('administrator', good, true)).status, 400);
    const form = new FormData();
    assert.equal((await fetch(base + '/import', { method: 'POST', headers: { Authorization: 'Bearer ' + token('administrator') }, body: form })).status, 400);
  } finally { await app.close(); }
});
