require('reflect-metadata');
require('ts-node/register/transpile-only');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');
const { mkdtemp, mkdir, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { AuthController } = require('../src/application/auth/auth.controller');
const { AuthService } = require('../src/application/auth/auth.service');
const { PaymentsController } = require('../src/application/payments/payments.controller');
const { PaymentsService } = require('../src/application/payments/payments.service');
const { UploadsController } = require('../src/application/uploads/uploads.controller');
const { UploadsService } = require('../src/application/uploads/uploads.service');
const { TransformInterceptor } = require('../src/common/interceptors/transform.interceptor');
const { verifyWompiEvent } = require('../src/infrastructure/payment/wompi-event');
const { User } = require('../src/infrastructure/database/entities/user.entity');
const { getMetadataArgsStorage } = require('typeorm');

test('security regressions through real HTTP controllers, guards and services', async t => {
  const secret = randomBytes(48).toString('hex');
  const eventSecret = randomBytes(48).toString('hex');
  const jwt = new JwtService({ secret, signOptions: { expiresIn: '1h' } });
  const config = new ConfigService({ JWT_SECRET: secret });
  const users = new Map();
  const receipts = new Map();
  let emailCount = 0;
  let resetToken;
  const userRepo = {
    findByEmail: async email => [...users.values()].find(u => u.email === email) || null,
    findById: async id => users.get(id) || null,
    create: async data => { const u = { ...data, id: 'student-a', isActive: true }; users.set(u.id, u); return u; },
    update: async (id, data) => Object.assign(users.get(id), data),
  };
  const students = {
    generateStudentCode: async () => 'UPAM-001', create: async () => ({}),
    findByUserId: async id => ({ id: id + '-profile', userId: id }),
    findById: async () => ({ user: { email: 'qa@example.invalid', firstName: 'QA', lastName: 'Test' } }),
  };
  const payment = { id: 'payment-b', studentId: 'student-b-profile', amount: 10, currency: 'USD',
    reference: 'reference-b', status: 'pending', paymentMethod: 'wompi', wompiTransactionId: 'tx-b',
    student: { userId: 'student-b', user: { email: 'b@example.invalid', passwordHash: 'DO-NOT-EXPOSE', resetToken: 'DO-NOT-EXPOSE' } } };
  const repo = {
    findById: async id => id === payment.id ? payment : null,
    findByReference: async ref => ref === payment.reference ? payment : null,
    findByReceipt: async url => receipts.get(url) || null,
    applyVerifiedTransaction: async (id, tx, status) => {
      if (payment.status === status || payment.status !== 'pending') return false;
      payment.status = status; return true;
    },
  };
  let remote = { id: 'tx-b', reference: 'reference-b', status: 'APPROVED', currency: 'USD', amount_in_cents: 1000 };
  const gateway = { verifyEvent: payload => verifyWompiEvent(payload, eventSecret), getTransaction: async () => remote };
  const email = { sendPasswordResetEmail: async (_, token) => { resetToken = token; }, sendPaymentConfirmation: async () => { emailCount++; } };
  const authService = new AuthService(userRepo, students, {}, jwt, config, email);
  const paymentsService = new PaymentsService(repo, students, {}, gateway, email);
  const temp = await mkdtemp(join(tmpdir(), 'upam-security-'));
  const uploadsService = new UploadsService(repo);
  uploadsService.uploadDir = join(temp, 'uploads');
  await mkdir(join(temp, 'uploads', 'receipts'), { recursive: true });
  await mkdir(join(temp, 'uploads', 'logos'), { recursive: true });
  class TestModule {}
  Module({ controllers: [AuthController, PaymentsController, UploadsController], providers: [
    { provide: AuthService, useValue: authService }, { provide: PaymentsService, useValue: paymentsService },
    { provide: UploadsService, useValue: uploadsService }, { provide: ConfigService, useValue: config },
    { provide: JwtService, useValue: jwt },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useStaticAssets(join(temp, 'uploads', 'logos'), { prefix: '/uploads/logos/' });
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const token = (sub, role, extra = {}) => jwt.sign({ sub, email: 'qa@example.invalid', role, purpose: 'access', ...extra });
  const request = (path, bearer, body) => fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const event = () => {
    const body = { event: 'transaction.updated', data: { transaction: { id: 'tx-b', status: 'APPROVED', amount_in_cents: 1000 } },
      timestamp: 1793200000, signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'] } };
    body.signature.checksum = createHash('sha256').update('tx-bAPPROVED1000' + body.timestamp + eventSecret).digest('hex');
    return body;
  };
  try {
    await t.test('public registration rejects all privileged roles and extra fields, student succeeds', async () => {
      const valid = { email: 'qa@example.invalid', password: 'TestPassword!123', firstName: 'QA', lastName: 'Test' };
      for (const role of ['administrator', 'collector', 'administrative', 'teacher']) {
        assert.equal((await request('/api/auth/register', null, { ...valid, role })).status, 400);
      }
      assert.equal((await request('/api/auth/register', null, { ...valid, isActive: true })).status, 400);
      const result = await request('/api/auth/register', null, valid);
      assert.equal(result.status, 201);
      const data = (await result.json()).data;
      assert.equal(data.user.role, 'student'); assert.equal(jwt.verify(data.token).purpose, 'access');
      const bypass = { ...valid, email: 'other@example.invalid', role: 'administrator' };
      await assert.rejects(authService.register(bypass));
    });
    await t.test('login still works and recovery token cannot authenticate or be reused', async () => {
      assert.equal((await request('/api/auth/login', null, { email: 'qa@example.invalid', password: 'TestPassword!123' })).status, 201);
      await authService.forgotPassword({ email: 'qa@example.invalid' });
      assert.equal((await request('/api/auth/profile', resetToken)).status, 401);
      assert.equal((await request('/api/auth/profile', token('student-a', 'student'))).status, 200);
      assert.equal((await request('/api/auth/profile', token('student-a', 'student', { purpose: undefined }))).status, 401);
      assert.equal((await request('/api/auth/profile', jwt.sign({ sub: 'student-a', purpose: 'access', role: 'student' }))).status, 401);
      assert.equal((await request('/api/auth/profile', jwt.sign({ sub: 'student-a', purpose: 'access', role: 'student', email: 'qa@example.invalid' }, { expiresIn: -1 }))).status, 401);
      assert.equal((await request('/api/auth/profile', 'invalid')).status, 401);
      const usedToken = resetToken;
      assert.equal((await request('/api/auth/reset-password', null, { token: token('student-a', 'student'), newPassword: 'NewPassword!123' })).status, 400);
      assert.equal((await request('/api/auth/reset-password', null, { token: usedToken, newPassword: 'NewPassword!123' })).status, 201);
      assert.equal((await request('/api/auth/reset-password', null, { token: usedToken, newPassword: 'NewPassword!123' })).status, 400);
      assert.equal((await request('/api/auth/profile', usedToken)).status, 401);
    });
    await t.test('payment access is limited to owner or financial staff and secrets never serialize', async () => {
      assert.equal((await request('/api/payments/payment-b')).status, 401);
      for (const [sub, role] of [['student-a', 'student'], ['staff', 'administrative'], ['teacher', 'teacher']]) {
        assert.equal((await request('/api/payments/payment-b', token(sub, role))).status, 404);
      }
      for (const [sub, role] of [['student-b', 'student'], ['admin', 'administrator'], ['collector', 'collector']]) {
        const response = await request('/api/payments/payment-b', token(sub, role));
        assert.equal(response.status, 200);
        assert.doesNotMatch(await response.text(), /passwordHash|resetToken|DO-NOT-EXPOSE/);
      }
      assert.equal((await request('/api/payments/missing', token('admin', 'administrator'))).status, 404);
      for (const propertyName of ['passwordHash', 'resetToken', 'resetTokenExpires']) {
        assert.equal(getMetadataArgsStorage().columns.find(c => c.target === User && c.propertyName === propertyName).options.select, false);
      }
    });
    await t.test('webhook rejects missing/wrong signatures, tampering and missing configuration', async () => {
      assert.equal((await request('/api/payments/webhook', null, {})).status, 401);
      const bad = event(); bad.signature.checksum = '0'.repeat(64);
      assert.equal((await request('/api/payments/webhook', null, bad)).status, 401);
      const tampered = event(); tampered.data.transaction.id = 'tx-other';
      assert.equal((await request('/api/payments/webhook', null, tampered)).status, 401);
      assert.throws(() => verifyWompiEvent(event(), ''), error => error.getStatus() === 503);
    });
    await t.test('webhook binds remote identity, reference, amount, currency and blocks replay', async () => {
      const valid = { ...remote };
      for (const invalid of [{ id: 'tx-other' }, { reference: 'other' }, { currency: 'COP' }, { amount_in_cents: 1 }]) {
        remote = { ...valid, ...invalid };
        assert.equal((await request('/api/payments/webhook', null, event())).status, 400);
        assert.equal(payment.status, 'pending');
      }
      remote = valid;
      const outcomes = await Promise.all([request('/api/payments/webhook', null, event()), request('/api/payments/webhook', null, event())]);
      assert.ok(outcomes.every(r => r.status === 201)); assert.equal(emailCount, 1);
      assert.equal(payment.status, 'completed');
    });
    await t.test('new and legacy receipts are private, logos remain public', async () => {
      const filename = '11111111-1111-4111-8111-111111111111.webp';
      const legacy = '22222222-2222-4222-8222-222222222222.webp';
      for (const name of [filename, legacy]) {
        const url = name === legacy ? '/uploads/' + name : '/api/uploads/receipts/' + name;
        receipts.set(url, { ...payment, receiptImageUrl: url });
        await writeFile(join(temp, 'uploads', name === legacy ? '' : 'receipts', name), Buffer.from('fixture'));
        assert.equal((await request('/uploads/' + name)).status, 404);
        assert.equal((await request('/api/uploads/receipts/' + name)).status, 401);
        assert.equal((await request('/api/uploads/receipts/' + name, token('student-a', 'student'))).status, 404);
        const own = await request('/api/uploads/receipts/' + name, token('student-b', 'student'));
        assert.equal(own.status, 200); assert.equal(own.headers.get('cache-control'), 'private, no-store');
        assert.equal(await own.text(), 'fixture');
        assert.equal((await request('/api/uploads/receipts/' + name, token('staff', 'administrative'))).status, 404);
        assert.equal((await request('/api/uploads/receipts/' + name, token('admin', 'administrator'))).status, 200);
      }
      assert.equal((await request('/api/uploads/receipts/not-a-uuid', token('admin', 'administrator'))).status, 404);
      await writeFile(join(temp, 'uploads', 'logos', filename), 'public-logo');
      assert.equal((await request('/uploads/logos/' + filename)).status, 200);
    });
  } finally { await app.close(); await rm(temp, { recursive: true, force: true }); }
});
