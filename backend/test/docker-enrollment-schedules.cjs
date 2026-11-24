// Synthetic read-model fixtures only. Run via docker compose exec -T backend node < this file.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { JwtService } = require('@nestjs/jwt');
(async () => {
  const db = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
  await db.connect();
  const ids = { users: [randomUUID(), randomUUID()], students: [randomUUID(), randomUUID()], subjects: [randomUUID(), randomUUID()], groups: [randomUUID(), randomUUID()], enrollments: [randomUUID(), randomUUID()], cycle: randomUUID(), room: randomUUID(), teacher: randomUUID() };
  const schedules = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  const tag = randomUUID().slice(0, 8);
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  let checks = 0;
  const check = (a, b) => { assert.deepEqual(a, b); checks++; };
  const request = (user, path = '/enrollments/my/' + ids.cycle) => fetch('http://127.0.0.1:3000/api' + path, { headers: user ? { Authorization: 'Bearer ' + jwt.sign({ sub: user, role: 'student', email: 'qa@example.invalid', purpose: 'access' }, { expiresIn: '5m' }) } : {} });
  try {
    await db.query("INSERT INTO cycles(id,name,year,semester,start_date,end_date,tuition_amount,monthly_amount) VALUES($1,$2,2191,1,'2191-01-01','2191-05-31',100,50)", [ids.cycle, 'Schedule QA ' + tag]);
    await db.query('INSERT INTO classrooms(id,name,capacity) VALUES($1,$2,20)', [ids.room, 'ScheduleQA-' + tag]);
    await db.query('INSERT INTO teachers(id,name) VALUES($1,$2)', [ids.teacher, 'Schedule QA ' + tag]);
    for (let i = 0; i < 2; i++) {
      await db.query("INSERT INTO users(id,email,password_hash,role,first_name,last_name) VALUES($1,$2,'synthetic-not-a-password','student','ScheduleQA','Fixture')", [ids.users[i], tag + i + '@example.invalid']);
      await db.query('INSERT INTO students(id,user_id,student_code,carnet,career,enrollment_year) VALUES($1,$2,$3,$3,$4,2191)', [ids.students[i], ids.users[i], 'SCHEDULE-QA-' + tag + i, 'Schedule QA']);
      await db.query('INSERT INTO subjects(id,code,name,credits,career,year,semester) VALUES($1,$2,$3,4,$4,1,1)', [ids.subjects[i], tag + i, 'Schedule QA', 'Schedule QA']);
      await db.query('INSERT INTO subject_groups(id,subject_id,cycle_id,classroom_id,teacher_id,capacity) VALUES($1,$2,$3,$4,$5,20)', [ids.groups[i], ids.subjects[i], ids.cycle, ids.room, ids.teacher]);
      await db.query('INSERT INTO enrollments(id,student_id,cycle_id) VALUES($1,$2,$3)', [ids.enrollments[i], ids.students[i], ids.cycle]);
    }
    for (let i = 0; i < 4; i++) {
      await db.query('INSERT INTO schedules(id,group_id,day_of_week,start_time,end_time) VALUES($1,$2,$3,$4,$5)', [schedules[i], ids.groups[i === 3 ? 1 : 0], ['monday', 'wednesday', 'friday', 'tuesday'][i], i === 2 ? '22:00' : '07:00', i === 2 ? '23:30' : '09:00']);
    }
    for (let i = 0; i < 2; i++) await db.query('INSERT INTO enrollment_subjects(enrollment_id,subject_id,schedule_id) VALUES($1,$2,$3)', [ids.enrollments[i], ids.subjects[i], schedules[i === 0 ? 0 : 3]]);
    for (let i = 0; i < 2; i++) {
      const response = await request(ids.users[i]); check(response.status, 200);
      const enrollment = (await response.json()).data;
      check(enrollment.studentId, ids.students[i]); check(enrollment.subjects.length, 1);
      const subject = enrollment.subjects[0]; check(subject.subjectId, ids.subjects[i]); check(subject.subject.credits, 4);
      const blocks = subject.schedule.group.schedules;
      check(blocks.map(s => s.id).sort(), (i === 0 ? schedules.slice(0, 3) : [schedules[3]]).sort());
      check(blocks.every(s => s.groupId === ids.groups[i]), true);
      check(blocks.some(s => 'enrollmentSubjects' in s || 'group' in s), false);
      const text = JSON.stringify(enrollment);
      for (const field of ['passwordHash', 'password_hash', 'passwordResetToken', 'passwordResetTokenHash']) check(text.includes('"' + field + '"'), false);
    }
    check((await request(null)).status, 401);
    check((await request(ids.users[0], '/enrollments/all')).status, 403);
    check((await request(ids.users[0], '/enrollments/my/' + randomUUID())).status, 404);
    check(Number((await db.query('SELECT count(*) FROM enrollment_subjects WHERE enrollment_id=ANY($1::uuid[])', [ids.enrollments])).rows[0].count), 2);
    check(Number((await db.query('SELECT count(*) FROM schedules WHERE group_id=ANY($1::uuid[])', [ids.groups])).rows[0].count), 4);
    console.log(JSON.stringify({ checks, result: 'passed', subjectsNotDuplicated: true, syntheticOnly: true }));
  } finally {
    await db.query('DELETE FROM students WHERE id=ANY($1::uuid[])', [ids.students]);
    await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])', [ids.users]);
    await db.query('DELETE FROM subject_groups WHERE id=ANY($1::uuid[])', [ids.groups]);
    await db.query('DELETE FROM cycles WHERE id=$1', [ids.cycle]);
    await db.query('DELETE FROM subjects WHERE id=ANY($1::uuid[])', [ids.subjects]);
    await db.query('DELETE FROM teachers WHERE id=$1', [ids.teacher]);
    await db.query('DELETE FROM classrooms WHERE id=$1', [ids.room]);
    await db.end();
  }
})().catch(() => { console.error('Enrollment schedules check failed; private details withheld.'); process.exitCode = 1; });
