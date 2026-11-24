// Synthetic local fixtures only. No payments/email triggered. Cleanup in finally.
const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const {Client}=require('pg');const {JwtService}=require('@nestjs/jwt');
(async()=>{const db=new Client({host:process.env.DATABASE_HOST,port:Number(process.env.DATABASE_PORT),database:process.env.DATABASE_NAME,user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD});await db.connect();
const [admin,user,other,student,cycle]=Array.from({length:5},()=>randomUUID());const jwt=new JwtService({secret:process.env.JWT_SECRET});
const token=(role,sub=admin)=>jwt.sign({sub,email:'qa@example.invalid',role,purpose:'access'},{expiresIn:'5m'});
const call=async(path,data,role='administrator',sub=admin)=>fetch('http://127.0.0.1:3000/api'+path,{method:data===undefined?'GET':'PUT',headers:{Authorization:'Bearer '+token(role,sub),'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
let checks=0;const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
try{
 for(const [id,role]of[[admin,'administrator'],[user,'student'],[other,'student']])await db.query('INSERT INTO users(id,email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5,$6)',[id,id+'@example.invalid','synthetic',role,'FeesQA','Fixture']);
 await db.query('INSERT INTO students(id,user_id,student_code,carnet,career,enrollment_year) VALUES($1,$2,$3,$4,$5,2020)',[student,user,'QA-'+student,'QA-'+student,'FeesQA']);
 await db.query('INSERT INTO cycles(id,name,year,semester,start_date,end_date,tuition_amount,monthly_amount,monthly_count) VALUES($1,$2,2020,1,$3,$4,150,60,3)',[cycle,'FeesQA','2020-01-01','2020-06-30']);
 const path='/students/'+student+'/fees';
 let r=await call(path,{tuitionAmount:120.25,monthlyAmount:45.5});check(r.status,200);check((await r.json()).data,{studentId:student,tuitionAmount:120.25,monthlyAmount:45.5});
 for(const role of ['student','teacher','collector'])check((await call(path,{monthlyAmount:1},role,user)).status,403);
 for(const value of [-1,0,1.111,'20',100000000])check((await call(path,{monthlyAmount:value})).status,400);
 check((await call(path,{monthlyAmount:10,role:'administrator'})).status,400);
 check((await call(path,{})).status,400);
 check((await call(path,{monthlyAmount:40},'administrative')).status,200);
 check((await call('/students/'+student,undefined,'student',user)).status,200);
 for(const role of ['administrator','administrative','collector'])check((await call('/students/'+student,undefined,role)).status,200);
 check((await call('/students/'+student,undefined,'student',other)).status,404);
 check((await call('/students/'+student,undefined,'teacher')).status,404);
 check((await call('/students/invalid-id/fees',{monthlyAmount:10})).status,400);
 let summary=(await(await call('/payments/my/'+cycle+'/summary',undefined,'student',user)).json()).data;
 check(summary.tuitionAmount,120.25);check(summary.monthlyAmount,40);check(summary.totalPending,240.25);
 await db.query("INSERT INTO payments(student_id,cycle_id,amount,type,status,month,reference,payment_method) VALUES($1,$2,30,'monthly','completed',1,$3,'cash')",[student,cycle,'fees-qa-'+randomUUID()]);
 check((await call(path,{monthlyAmount:50})).status,200);
 summary=(await(await call('/payments/my/'+cycle+'/summary',undefined,'student',user)).json()).data;
 check(summary.totalPaid,30);check(summary.monthlyPayments[0].amount,30);check(summary.totalPending,220.25);
 check((await call(path,{tuitionAmount:null,monthlyAmount:null})).status,200);
 summary=(await(await call('/payments/my/'+cycle+'/summary',undefined,'student',user)).json()).data;
 check(summary.tuitionAmount,150);check(summary.monthlyAmount,60);check(summary.totalPaid,30);check(summary.totalPending,270);
 const count=Number((await db.query('SELECT count(*) FROM payments WHERE student_id=$1',[student])).rows[0].count);check(count,1);
 console.log(JSON.stringify({checks,result:'passed',syntheticOnly:true,externalPaymentsOrEmails:false}));
}finally{await db.query('DELETE FROM payments WHERE student_id=$1',[student]);await db.query('DELETE FROM students WHERE id=$1',[student]);await db.query('DELETE FROM cycles WHERE id=$1',[cycle]);await db.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[admin,user,other]]);await db.end();}
})().catch(()=>{console.error('Student fees checks failed; details withheld.');process.exitCode=1;});
