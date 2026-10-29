// Run via stdin inside the local backend container. Synthetic fixtures only, cleaned in finally.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { JwtService } = require('@nestjs/jwt');
const ExcelJS = require('exceljs');
const { DataSource } = require('typeorm');
const { LegacyCompletedSubjectRepository } = require('./dist/infrastructure/database/repositories/legacy-completed-subject.repository');
const { LegacyCompletedSubject } = require('./dist/infrastructure/database/entities/legacy-completed-subject.entity');

(async () => {
  const db = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
  await db.connect();
  const ids = Array.from({ length: 6 }, () => randomUUID());
  const [admin, user, student, subject1, subject2, subject3] = ids;
  const tag = randomUUID(); const carnet = 'QA-' + tag;
  const codes = ['QA1-' + tag.slice(0, 8), 'QA2-' + tag.slice(0, 8), 'QA3-' + tag.slice(0, 8)];
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const token = role => jwt.sign({ sub: admin, role, email: 'qa@example.invalid', purpose: 'access' }, { expiresIn: '5m' });
  let orm; let checks = 0;
  const check = (a, b) => { assert.deepEqual(a, b); checks++; };
  const buffer = async rows => {
    const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet('Notas previas');
    sheet.addRow(['carnet','codigo_materia','nota','anio','semestre','observaciones']); rows.forEach(row => sheet.addRow(row));
    return Buffer.from(await book.xlsx.writeBuffer());
  };
  const upload = async (rows, role = 'administrator') => {
    const form = new FormData(); form.append('file', new Blob([await buffer(rows)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'notas.xlsx');
    return fetch('http://127.0.0.1:3000/api/legacy-subjects/import', { method: 'POST', headers: { Authorization: 'Bearer ' + token(role) }, body: form });
  };
  const count = async () => Number((await db.query('SELECT count(*) FROM legacy_completed_subjects WHERE student_id=$1',[student])).rows[0].count);
  try {
    for (const [id, role] of [[admin,'administrator'],[user,'student']]) {
      await db.query('INSERT INTO users(id,email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5,$6)',[id,id+'@example.invalid','synthetic-not-a-login-hash',role,'ImportQA','Fixture']);
    }
    await db.query('INSERT INTO students(id,user_id,student_code,carnet,career,enrollment_year) VALUES($1,$2,$3,$4,$5,2020)',[student,user,'QA-'+tag,carnet,'ImportQA']);
    for (const [index,id] of [subject1,subject2,subject3].entries()) {
      await db.query('INSERT INTO subjects(id,code,name,credits,career,year,semester) VALUES($1,$2,$3,4,$4,1,1)',[id,codes[index],'ImportQA','ImportQA']);
    }
    const response = await upload([[carnet,codes[0],8.25,2020,1,'Synthetic migration']]);
    check(response.status,201); check((await response.json()).data,{imported:1,students:1}); check(await count(),1);
    const stored = (await db.query('SELECT score,registered_by FROM legacy_completed_subjects WHERE student_id=$1',[student])).rows[0];
    check(Number(stored.score),8.25); check(stored.registered_by,admin);
    check((await upload([[carnet,codes[0],9]])).status,400); check(await count(),1);
    check((await upload([[carnet,codes[1],7],[carnet,codes[2],11]])).status,400); check(await count(),1);
    check((await upload([[carnet,codes[1],7]],'student')).status,403);
    check((await upload([[carnet,codes[1],7]],'administrative')).status,201); check(await count(),2);
    // Real transaction rollback: second row duplicates an existing key; first row must not remain.
    orm = new DataSource({ type:'postgres',host:process.env.DATABASE_HOST,port:Number(process.env.DATABASE_PORT),
      database:process.env.DATABASE_NAME,username:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD,
      entities:['/app/dist/infrastructure/database/entities/*.entity.js'],synchronize:false,logging:false });
    await orm.initialize();
    const repo = new LegacyCompletedSubjectRepository(orm.getRepository(LegacyCompletedSubject));
    await assert.rejects(repo.importBatch([
      { studentId:student,subjectId:subject3,score:6,registeredById:admin },
      { studentId:student,subjectId:subject1,score:9,registeredById:admin },
    ]),error=>error.getStatus()===409); checks++; check(await count(),2);
    const concurrent = await Promise.all([
      repo.importBatch([{studentId:student,subjectId:subject3,score:7,registeredById:admin}]).then(()=>201,e=>e.getStatus()),
      repo.importBatch([{studentId:student,subjectId:subject3,score:8,registeredById:admin}]).then(()=>201,e=>e.getStatus()),
    ]);
    check(concurrent.sort(),[201,409]); check(await count(),3);
    const template = await fetch('http://127.0.0.1:3000/api/legacy-subjects/template',{headers:{Authorization:'Bearer '+token('administrator')}});
    check(template.status,200); check(template.headers.get('cache-control'),'private, no-store');
    const book = new ExcelJS.Workbook(); await book.xlsx.load(Buffer.from(await template.arrayBuffer()));
    check(book.getWorksheet('Notas previas').getCell('A1').value,'carnet');
    console.log(JSON.stringify({ checks, result:'passed', realPaymentsOrEmails:false }));
  } finally {
    if (orm?.isInitialized) await orm.destroy();
    await db.query('DELETE FROM legacy_completed_subjects WHERE student_id=$1',[student]);
    await db.query('DELETE FROM students WHERE id=$1',[student]);
    await db.query('DELETE FROM subjects WHERE id=ANY($1::uuid[])',[[subject1,subject2,subject3]]);
    await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[admin,user]]);
    await db.end();
  }
})().catch(()=>{ console.error('Legacy import Docker checks failed; details withheld to avoid exposing fixture data.'); process.exitCode=1; });
