require('reflect-metadata');
require('ts-node/register/transpile-only');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { TeachersController } = require('../src/application/teachers/teachers.controller');
const { TeachersService } = require('../src/application/teachers/teachers.service');
const { ClassroomsController } = require('../src/application/classrooms/classrooms.controller');
const { ClassroomsService } = require('../src/application/classrooms/classrooms.service');
const { SubjectGroupsController } = require('../src/application/subject-groups/subject-groups.controller');
const { SubjectGroupsService } = require('../src/application/subject-groups/subject-groups.service');

test('planning creation uses real HTTP guards and validates new catalog inputs', async t => {
  const secret = randomBytes(48).toString('hex');
  const jwt = new JwtService({ secret });
  let writes = 0;
  const repository = {
    findAll: async () => [],
    create: async data => { writes++; return { id: randomUUID(), ...data }; },
  };
  class TestModule {}
  Module({ controllers: [TeachersController, ClassroomsController, SubjectGroupsController], providers: [
    { provide: TeachersService, useValue: new TeachersService(repository) },
    { provide: ClassroomsService, useValue: new ClassroomsService(repository) },
    // Group persistence is outside this authorization test; its real controller/guards are exercised.
    { provide: SubjectGroupsService, useValue: {
      create: async (data, schedules) => { writes++; return { ...data, schedules }; },
      addSchedule: async (id, data) => { writes++; return { groupId: id, ...data }; },
    } },
    { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET: secret }) },
    { provide: JwtService, useValue: jwt },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const request = (path, role, body, method = 'POST') => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: 'Bearer ' + jwt.sign({
      sub: randomUUID(), email: 'qa@example.invalid', role, purpose: 'access',
    }, { expiresIn: '5m' }) } : {}) }, body: JSON.stringify(body),
  });
  const cases = [
    ['/teachers', { name: ' Docente QA ', email: '', phone: '', department: '' }],
    ['/classrooms', { name: 'Aula QA', capacity: 20, building: '' }],
    ['/subject-groups', { subjectId: randomUUID(), cycleId: randomUUID(), classroomId: randomUUID(), schedules: [] }],
    ['/subject-groups/' + randomUUID() + '/schedules', { dayOfWeek: 'monday', startTime: '07:00', endTime: '09:00' }],
  ];
  try {
    await t.test('administrator and administrative can create all four resources', async () => {
      for (const role of ['administrator', 'administrative']) {
        for (const [path, body] of cases) assert.equal((await request(path, role, body)).status, 201, role + path);
      }
      assert.equal(writes, 8);
    });
    await t.test('student, teacher, collector and anonymous requests never reach creation', async () => {
      const before = writes;
      for (const role of ['student', 'teacher', 'collector', null]) {
        for (const [path, body] of cases) assert.equal((await request(path, role, body)).status, role ? 403 : 401);
      }
      assert.equal(writes, before);
    });
    await t.test('invalid fields and internal identifiers are rejected before persistence', async () => {
      const before = writes;
      for (const extra of [{ id: randomUUID() }, { userId: randomUUID() }, { groups: [] }, { role: 'administrator' }, { isActive: false }]) {
        assert.equal((await request('/teachers', 'administrative', { name: 'QA', ...extra })).status, 400);
      }
      for (const body of [{ name: '  ' }, { name: 'QA', email: 'bad-email' }, { name: 12 }]) {
        assert.equal((await request('/teachers', 'administrative', body)).status, 400);
      }
      for (const body of [{ name: 'QA', capacity: 0 }, { name: 'QA', capacity: 1.5 }, { name: 'QA', capacity: '20' },
        { name: ' ', capacity: 20 }, { name: 'QA', capacity: 20, groups: [] }]) {
        assert.equal((await request('/classrooms', 'administrative', body)).status, 400);
      }
      assert.equal(writes, before);
      const result = await request('/teachers', 'administrative', { name: ' QA ' });
      assert.equal((await result.json()).name, 'QA');
    });
    await t.test('creating catalogs does not grant administrative edit/delete rights', async () => {
      for (const path of ['/teachers/', '/classrooms/']) {
        for (const method of ['PUT', 'DELETE']) assert.equal((await request(path + randomUUID(), 'administrative', {}, method)).status, 403);
      }
    });
  } finally { await app.close(); }
});
