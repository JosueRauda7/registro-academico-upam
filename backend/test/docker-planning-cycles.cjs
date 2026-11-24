// Run with docker compose exec -T backend node < backend/test/docker-planning-cycles.cjs.
// Only synthetic fixtures, no real payment or email. Clean up in finally.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { JwtService } = require('@nestjs/jwt');
(async () => {
  const db = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT), database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
  await db.connect();
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const tag = randomUUID().slice(0, 8);
  const ids = { cycles: [], subjects: [randomUUID(), randomUUID()], teachers: [randomUUID(), randomUUID(), randomUUID()], classrooms: [randomUUID(), randomUUID(), randomUUID()], user: randomUUID(), student: randomUUID() };
  let checks = 0;
  const check = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
  const call = async (path, body, method = 'POST', role = 'administrative') => {
    const token = role ? jwt.sign({ sub: ids.user, email: 'qa@example.invalid', role, purpose: 'access' }, { expiresIn: '10m' }) : null;
    return fetch('http://127.0.0.1:3000/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  };
  const cycleData = { name: 'Planning QA ' + tag, year: 2190, semester: 1, startDate: '2190-01-01', endDate: '2190-04-30', tuitionAmount: 150, monthlyAmount: 60, monthlyCount: 4 };
  const cycle = async (extra = {}, role = 'administrative') => {
    const response = await call('/cycles', { ...cycleData, ...extra }, 'POST', role);
    check(response.status, 201, 'cycle creation');
    const data = (await response.json()).data; ids.cycles.push(data.id); return data;
  };
  const schedule = (startTime = '07:00', endTime = '09:00', dayOfWeek = 'monday') => ({ dayOfWeek, startTime, endTime });
  let primary;
  const group = (extra = {}) => ({ subjectId: ids.subjects[0], cycleId: primary.id, teacherId: ids.teachers[0], classroomId: ids.classrooms[0], capacity: 10, schedules: [schedule()], ...extra });
  const createGroup = async (extra = {}) => {
    const response = await call('/subject-groups', group(extra)); check(response.status, 201, 'group creation'); return (await response.json()).data;
  };
  const groupCount = async () => Number((await db.query('SELECT count(*) FROM subject_groups WHERE cycle_id=ANY($1::uuid[])', [ids.cycles])).rows[0].count);
  try {
    for (let i = 0; i < ids.teachers.length; i++) await db.query('INSERT INTO teachers(id,name,is_active) VALUES($1,$2,$3)', [ids.teachers[i], 'Planning QA ' + tag, i !== 2]);
    for (let i = 0; i < ids.classrooms.length; i++) await db.query('INSERT INTO classrooms(id,name,capacity,is_active) VALUES($1,$2,20,$3)', [ids.classrooms[i], 'PlanningQA-' + tag + i, i !== 2]);
    for (let i = 0; i < ids.subjects.length; i++) await db.query('INSERT INTO subjects(id,code,name,credits,career,year,semester) VALUES($1,$2,$3,4,$4,1,1)', [ids.subjects[i], tag + i, 'Planning QA', 'Planning QA ' + tag]);
    primary = await cycle();
    const other = await cycle({}, 'administrator');
    const future = await cycle({ startDate: '2190-05-01', endDate: '2190-08-31', semester: 2 });
    check(primary.isActive, true); check(primary.enrollmentOpen, false);
    // Role matrix for every management action.
    for (const role of ['student', 'teacher', 'collector', null]) {
      for (const [path, body, method] of [
        ['/cycles', cycleData, 'POST'], ['/cycles/' + primary.id, { name: 'Denied QA' }, 'PUT'],
        ['/cycles/' + primary.id + '/open-enrollment', undefined, 'PUT'], ['/cycles/' + primary.id + '/close-enrollment', undefined, 'PUT'],
      ]) check((await call(path, body, method, role)).status, role ? 403 : 401, 'cycle role matrix');
    }
    for (const role of ['administrator', 'administrative']) {
      check((await call('/cycles/' + primary.id, { name: 'Planning QA ' + tag }, 'PUT', role)).status, 200);
      check((await call('/cycles/' + primary.id + '/open-enrollment', undefined, 'PUT', role)).status, 200);
      check((await call('/cycles/' + primary.id + '/close-enrollment', undefined, 'PUT', role)).status, 200);
    }
    for (const bad of [{ tuitionAmount: -1 }, { monthlyAmount: 1.234 }, { monthlyAmount: '60' }, { monthlyCount: 0 }, { name: ' ' }, { endDate: '2189-01-01' }, { startDate: '2190-02-30' }, { enrollmentOpen: true }, { id: randomUUID() }]) {
      check((await call('/cycles', { ...cycleData, ...bad })).status, 400, 'invalid cycle input');
    }
    for (const bad of [{ tuitionAmount: null }, { year: null }, {}, { endDate: '2189-01-01' }, { enrollmentOpen: true }]) check((await call('/cycles/' + primary.id, bad, 'PUT')).status, 400);
    check((await call('/cycles/' + other.id, { isActive: false }, 'PUT')).status, 200);
    check((await call('/cycles/' + other.id + '/open-enrollment', undefined, 'PUT')).status, 400);
    check((await call('/cycles/' + other.id, { isActive: true }, 'PUT')).status, 200);

    const first = await createGroup();
    const countBefore = await groupCount();
    // Same teacher, same room, self overlap, invalid duration, inactive resources and invalid capacity.
    for (const [data, expected] of [
      [{ classroomId: ids.classrooms[1], subjectId: ids.subjects[1] }, 409],
      [{ teacherId: ids.teachers[1], subjectId: ids.subjects[1] }, 409],
      [{ schedules: [schedule('10:00', '12:00'), schedule('11:00', '13:00')] }, 409],
      [{ schedules: [schedule('12:00', '11:00')] }, 400],
      [{ schedules: [schedule('24:00', '25:00')] }, 400],
      [{ teacherId: ids.teachers[2], schedules: [] }, 400],
      [{ classroomId: ids.classrooms[2], schedules: [] }, 400],
      [{ capacity: 21, schedules: [] }, 400], [{ capacity: 0 }, 400], [{ enrolledCount: 99 }, 400],
    ]) check((await call('/subject-groups', group(data))).status, expected, 'planning validation');
    check(await groupCount(), countBefore, 'failed groups rolled back');
    const adjacent = await createGroup({ schedules: [schedule('09:00', '10:00')] });
    const independent = await createGroup({ teacherId: ids.teachers[1], classroomId: ids.classrooms[1] });
    await createGroup({ schedules: [schedule('07:00', '09:00', 'tuesday')] });
    check((await call('/subject-groups/' + adjacent.id + '/schedules', schedule('08:00', '09:00'))).status, 409);
    check((await call('/subject-groups/' + first.id + '/schedules', schedule('08:00', '08:30'))).status, 409);
    check((await call('/subject-groups/' + first.id + '/schedules', schedule('11:00', '12:00', 'wednesday'))).status, 201);
    check((await call('/subject-groups/' + independent.id, { teacherId: ids.teachers[0] }, 'PUT')).status, 409);
    check((await call('/subject-groups/' + independent.id, { classroomId: ids.classrooms[0] }, 'PUT')).status, 409);
    check((await call('/subject-groups/' + independent.id, { teacherId: null }, 'PUT')).status, 200);
    check((await db.query('SELECT teacher_id FROM subject_groups WHERE id=$1', [independent.id])).rows[0].teacher_id, null);
    check((await call('/subject-groups/' + independent.id, { teacherId: ids.teachers[1] }, 'PUT')).status, 200);
    check((await db.query('SELECT teacher_id FROM subject_groups WHERE id=$1', [independent.id])).rows[0].teacher_id, ids.teachers[1]);
    check((await call('/subject-groups/' + independent.id, { cycleId: future.id }, 'PUT')).status, 400);
    check((await call('/subject-groups/' + adjacent.id, { classroomId: ids.classrooms[1] }, 'PUT')).status, 200);
    check((await db.query('SELECT classroom_id FROM subject_groups WHERE id=$1', [adjacent.id])).rows[0].classroom_id, ids.classrooms[1]);
    check((await call('/subject-groups/' + adjacent.id, { classroomId: ids.classrooms[0] }, 'PUT')).status, 200);
    await db.query('UPDATE subjects SET is_active=false WHERE id=$1', [ids.subjects[1]]);
    check((await call('/subject-groups', group({ subjectId: ids.subjects[1], schedules: [] }))).status, 400);
    await db.query('UPDATE subjects SET is_active=true WHERE id=$1', [ids.subjects[1]]);
    // Existing schedules with seconds must also block overlapping minute-based input.
    await db.query("UPDATE schedules SET end_time='09:00:30' WHERE id=$1", [first.schedules[0].id]);
    check((await call('/subject-groups', group({ schedules: [schedule('09:00', '09:01')], classroomId: ids.classrooms[1] }))).status, 409);
    await db.query("UPDATE schedules SET end_time='09:00:00' WHERE id=$1", [first.schedules[0].id]);
    // Legacy route must not bypass checks.
    check((await call('/subjects/schedules', { groupId: adjacent.id, ...schedule('08:00', '09:00') })).status, 409);
    check((await call('/subjects/schedules', { groupId: adjacent.id, ...schedule('14:00', '15:00', 'wednesday') })).status, 201);
    // Overlapping cycles share physical resources; consecutive cycles may reuse them.
    check((await call('/subject-groups', group({ cycleId: other.id }))).status, 409);
    await createGroup({ cycleId: future.id });
    check((await call('/cycles/' + future.id, { startDate: '2190-04-01' }, 'PUT')).status, 409);
    check((await db.query('SELECT start_date::text FROM cycles WHERE id=$1', [future.id])).rows[0].start_date, '2190-05-01');
    check((await call('/cycles/' + future.id, { isActive: false }, 'PUT')).status, 200);
    check((await call('/subject-groups', group({ cycleId: future.id }))).status, 400);
    check((await call('/cycles/' + future.id, { startDate: '2190-04-01' }, 'PUT')).status, 200);
    check((await call('/cycles/' + future.id, { isActive: true }, 'PUT')).status, 409);
    check((await db.query('SELECT is_active FROM cycles WHERE id=$1', [future.id])).rows[0].is_active, false);
    // Concurrent requests cannot both reserve the same resources; adjacent automatic group numbers both succeed.
    const concurrent = await Promise.all([call('/subject-groups', group({ schedules: [schedule('16:00', '17:00', 'friday')] })), call('/subject-groups', group({ schedules: [schedule('16:00', '17:00', 'friday')], subjectId: ids.subjects[1] }))]);
    check(concurrent.map(r => r.status).sort(), [201, 409]);
    const sequential = await Promise.all([call('/subject-groups', group({ schedules: [schedule('10:00', '11:00', 'saturday')] })), call('/subject-groups', group({ schedules: [schedule('11:00', '12:00', 'saturday')] }))]);
    check(sequential.map(r => r.status), [201, 201]);
    const concurrentAdds = await Promise.all([call('/subject-groups/' + first.id + '/schedules', schedule('18:00', '19:00', 'friday')), call('/subject-groups/' + adjacent.id + '/schedules', schedule('18:00', '19:00', 'friday'))]);
    check(concurrentAdds.map(r => r.status).sort(), [201, 409]);
    // Group/schedule relationship is enforced on deletion.
    const firstSchedule = first.schedules[0].id;
    check((await call('/subject-groups/' + adjacent.id + '/schedules/' + firstSchedule, undefined, 'DELETE')).status, 404);
    // New cycle base fees, student overrides and historical amounts remain consistent.
    await db.query("INSERT INTO users(id,email,password_hash,role,first_name,last_name) VALUES($1,$2,'synthetic-not-a-password','student','PlanningQA','Fixture')", [ids.user, tag + '@example.invalid']);
    await db.query('INSERT INTO students(id,user_id,student_code,carnet,career,enrollment_year) VALUES($1,$2,$3,$3,$4,2190)', [ids.student, ids.user, 'QA-' + tag, 'Planning QA']);
    const enrollmentId = randomUUID();
    await db.query('INSERT INTO enrollments(id,student_id,cycle_id) VALUES($1,$2,$3)', [enrollmentId, ids.student, primary.id]);
    await db.query('INSERT INTO enrollment_subjects(enrollment_id,subject_id,schedule_id) VALUES($1,$2,$3)', [enrollmentId, ids.subjects[0], first.schedules[0].id]);
    await db.query('UPDATE subject_groups SET enrolled_count=2 WHERE id=$1', [first.id]);
    check((await call('/subject-groups/' + first.id, { capacity: 1 }, 'PUT')).status, 400);
    check((await call('/subject-groups/' + first.id, undefined, 'DELETE')).status, 400);
    check((await call('/subject-groups/' + first.id + '/schedules/' + first.schedules[0].id, undefined, 'DELETE')).status, 400);
    check((await db.query('SELECT count(*)::int AS count FROM enrollment_subjects WHERE enrollment_id=$1', [enrollmentId])).rows[0].count, 1);
    const summary = async () => (await (await call('/payments/my/' + primary.id + '/summary', undefined, 'GET', 'student')).json()).data;
    let fees = await summary(); check(fees.tuitionAmount, 150); check(fees.monthlyAmount, 60);
    await db.query("INSERT INTO payments(student_id,cycle_id,amount,type,status,month,reference,payment_method) VALUES($1,$2,60,'monthly','completed',1,$3,'cash')", [ids.student, primary.id, 'qa-' + randomUUID()]);
    check((await call('/cycles/' + primary.id, { tuitionAmount: 160, monthlyAmount: 65 }, 'PUT')).status, 200);
    fees = await summary(); check(fees.tuitionAmount, 160); check(fees.monthlyAmount, 65); check(fees.totalPaid, 60); check(fees.monthlyPayments[0].amount, 60);
    await db.query('UPDATE students SET monthly_amount=45 WHERE id=$1', [ids.student]);
    fees = await summary(); check(fees.tuitionAmount, 160); check(fees.monthlyAmount, 45);
    await db.query("INSERT INTO payments(student_id,cycle_id,amount,type,status,month,reference,payment_method) VALUES($1,$2,65,'monthly','pending',4,$3,'cash')", [ids.student, primary.id, 'qa-' + randomUUID()]);
    check((await call('/cycles/' + primary.id, { monthlyCount: 3 }, 'PUT')).status, 400);
    check((await db.query('SELECT amount::text FROM payments WHERE student_id=$1 AND status=\'completed\'', [ids.student])).rows[0].amount, '60.00');
    check((await call('/cycles/' + primary.id + '/open-enrollment', undefined, 'PUT')).status, 200);
    check((await call('/cycles/' + primary.id, { isActive: false }, 'PUT')).status, 200);
    const closed = (await db.query('SELECT is_active,enrollment_open FROM cycles WHERE id=$1', [primary.id])).rows[0];
    check(closed, { is_active: false, enrollment_open: false });
    const removable = await createGroup({ cycleId: other.id, teacherId: ids.teachers[1], classroomId: ids.classrooms[1], schedules: [schedule('20:00', '21:00', 'saturday')] });
    check((await call('/subject-groups/' + removable.id + '/schedules/' + removable.schedules[0].id, undefined, 'DELETE')).status, 200);
    check((await call('/subject-groups/' + removable.id, undefined, 'DELETE')).status, 200);
    console.log(JSON.stringify({ checks, result: 'passed', syntheticOnly: true, externalPaymentsOrEmails: false }));
  } finally {
    await db.query('DELETE FROM payments WHERE student_id=$1', [ids.student]);
    await db.query('DELETE FROM students WHERE id=$1', [ids.student]);
    await db.query('DELETE FROM users WHERE id=$1', [ids.user]);
    await db.query('DELETE FROM subject_groups WHERE cycle_id=ANY($1::uuid[])', [ids.cycles]);
    await db.query('DELETE FROM cycles WHERE id=ANY($1::uuid[])', [ids.cycles]);
    await db.query('DELETE FROM subjects WHERE id=ANY($1::uuid[])', [ids.subjects]);
    await db.query('DELETE FROM teachers WHERE id=ANY($1::uuid[])', [ids.teachers]);
    await db.query('DELETE FROM classrooms WHERE id=ANY($1::uuid[])', [ids.classrooms]);
    await db.end();
  }
})().catch(error => { console.error('Planning/cycle check failed: ' + (error.code === 'ERR_ASSERTION' ? error.message : 'details withheld')); process.exitCode = 1; });
