// Run INSIDE the local backend container via stdin. Uses only synthetic fixtures;
// never prints credentials/tokens and removes its own records/files in finally.
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { readFile, writeFile, unlink } = require('node:fs/promises');
const { join } = require('node:path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { JwtService } = require('@nestjs/jwt');
const { PaymentRepository } = require('./dist/infrastructure/database/repositories/payment.repository');
const { Payment } = require('./dist/infrastructure/database/entities/payment.entity');

(async () => {
  const db = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
  await db.connect();
  const ids = Array.from({ length: 7 }, () => randomUUID());
  const [a, b, admin, sa, sb, cycle, payment] = ids;
  const tag = randomUUID();
  const password = randomBytes(24).toString('hex');
  const hash = await bcrypt.hash(password, 10);
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const token = (sub, role, purpose = 'access') => jwt.sign({ sub, role, purpose, email: `qa-${tag}@example.invalid` }, { expiresIn: '10m' });
  const files = [];
  let checks = 0;
  const check = (actual, expected) => { assert.equal(actual, expected); checks++; };
  const request = (path, bearer, body) => fetch('http://127.0.0.1:3000' + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      try { await request('/api/auth/profile'); break; }
      catch (error) { if (attempt === 39) throw error; await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    const roles = await db.query('SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname=current_user');
    check(process.env.DATABASE_USER, 'upam_app');
    for (const permission of Object.values(roles.rows[0])) check(permission, false);
    check(process.env.JWT_SECRET.length >= 64, true);
    const oldDatabase = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME, user: 'postgres', password: 'postgres' });
    try { await assert.rejects(oldDatabase.connect(), error => error.code === '28P01'); checks++; }
    finally { await oldDatabase.end().catch(() => {}); }
    for (const [id, role] of [[a, 'student'], [b, 'student'], [admin, 'administrator']]) {
      await db.query('INSERT INTO users(id,email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5,$6)',
        [id, `${id}@example.invalid`, hash, role, 'SecurityQA', tag]);
    }
    for (const [id, userId] of [[sa, a], [sb, b]]) {
      await db.query('INSERT INTO students(id,user_id,student_code,carnet,career,enrollment_year) VALUES($1,$2,$3,$4,$5,2026)',
        [id, userId, id, id, 'SecurityQA']);
    }
    await db.query("INSERT INTO cycles(id,name,year,semester,start_date,end_date,tuition_amount,monthly_amount) VALUES($1,$2,2026,1,'2026-01-01','2026-06-30',10,10)", [cycle, tag]);
    await db.query("INSERT INTO payments(id,student_id,cycle_id,amount,status,type,reference,wompi_transaction_id) VALUES($1,$2,$3,10,'pending','tuition',$4,$5)",
      [payment, sb, cycle, tag, tag]);
    const login = await request('/api/auth/login', null, { email: `${a}@example.invalid`, password });
    check(login.status, 201);
    const logged = (await login.json()).data;
    check(jwt.verify(logged.token).purpose, 'access');
    for (const role of ['administrator', 'collector', 'administrative', 'teacher']) {
      check((await request('/api/auth/register', null, { email: `register-${tag}@example.invalid`, password,
        firstName: 'SecurityQA', lastName: tag, role })).status, 400);
    }
    check((await request('/api/auth/profile', token(a, 'student', 'password-reset'))).status, 401);
    check((await request('/api/payments/' + payment, token(a, 'student'))).status, 404);
    for (const actor of [token(b, 'student'), token(admin, 'administrator')]) {
      const own = await request('/api/payments/' + payment, actor);
      check(own.status, 200);
      assert.doesNotMatch(await own.text(), /passwordHash|password_hash|resetToken|reset_token/); checks++;
    }
    check((await request('/api/payments/webhook', null, {})).status, process.env.WOMPI_EVENTS_SECRET ? 401 : 503);

    const image = await require('sharp')({ create: { width: 1, height: 1, channels: 3, background: '#ffffff' } }).png().toBuffer();
    for (const kind of ['receipts', 'logos']) {
      const form = new FormData(); form.append('file', new Blob([image], { type: 'image/png' }), 'qa.png');
      const uploaded = await fetch('http://127.0.0.1:3000/api/uploads' + (kind === 'logos' ? '/logos' : ''),
        { method: 'POST', headers: { Authorization: 'Bearer ' + token(admin, 'administrator') }, body: form });
      check(uploaded.status, 201);
      const url = (await uploaded.json()).data.url;
      const name = url.split('/').pop(); files.push(join('/app/uploads', kind, name));
      if (kind === 'logos') { check((await request(url)).status, 200); continue; }
      await db.query('UPDATE payments SET receipt_image_url=$1 WHERE id=$2', [url, payment]);
      check((await request(url)).status, 401);
      check((await request(url, token(a, 'student'))).status, 404);
      const own = await request(url, token(b, 'student'));
      check(own.status, 200); check(own.headers.get('cache-control'), 'private, no-store');
      check((await request('/uploads/' + name)).status, 404);
      const legacy = randomUUID() + '.webp'; files.push(join('/app/uploads', legacy));
      await writeFile(join('/app/uploads', legacy), await readFile(join('/app/uploads/receipts', name)));
      await db.query('UPDATE payments SET receipt_image_url=$1 WHERE id=$2', ['/uploads/' + legacy, payment]);
      check((await request('/uploads/' + legacy)).status, 404);
      check((await request('/api/uploads/receipts/' + legacy, token(b, 'student'))).status, 200);
    }
    const { DataSource } = require('typeorm');
    const orm = new DataSource({ type: 'postgres', host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT), database: process.env.DATABASE_NAME,
      username: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD,
      entities: ['/app/dist/infrastructure/database/entities/*.entity.js'], synchronize: false, logging: false });
    await orm.initialize();
    try {
      const repo = new PaymentRepository(orm.getRepository(Payment));
      const outcomes = await Promise.all([repo.applyVerifiedTransaction(payment, tag, 'completed'), repo.applyVerifiedTransaction(payment, tag, 'completed')]);
      check(outcomes.filter(Boolean).length, 1);
      check(await repo.applyVerifiedTransaction(payment, tag, 'failed'), false);
      check(await repo.applyVerifiedTransaction(payment, 'wrong-transaction', 'refunded'), false);
    } finally { await orm.destroy(); }
    console.log(`Docker/API/PostgreSQL: ${checks} comprobaciones correctas; fixtures eliminados al finalizar.`);
  } finally {
    await db.query('DELETE FROM payments WHERE id=$1', [payment]);
    await db.query('DELETE FROM cycles WHERE id=$1', [cycle]);
    await db.query('DELETE FROM students WHERE id=ANY($1::uuid[])', [[sa, sb]]);
    await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [[a, b, admin]]);
    for (const file of files) await unlink(file).catch(() => {});
    await db.end();
  }
})().catch(error => { console.error('Security verification failed:', error.message); process.exitCode = 1; });
