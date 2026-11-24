// Run locally via docker compose exec -T backend node < backend/test/docker-prerequisites.cjs.
// Synthetic records only; remove fixtures in finally. No payments or email.
const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const {Client}=require('pg');const {JwtService}=require('@nestjs/jwt');
(async()=>{
 const db=new Client({host:process.env.DATABASE_HOST,port:Number(process.env.DATABASE_PORT),database:process.env.DATABASE_NAME,user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD});await db.connect();
 const tag=randomUUID().slice(0,8);const career='PrereqQA-'+tag;const otherCareer='OtherQA-'+tag;const userId=randomUUID();const careerIds=[randomUUID(),randomUUID()];
 const jwt=new JwtService({secret:process.env.JWT_SECRET});const token=role=>jwt.sign({sub:userId,email:'qa@example.invalid',role,purpose:'access'},{expiresIn:'5m'});
 const call=(path,data,role='administrator',method='PUT')=>fetch('http://127.0.0.1:3000/api/subjects'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token(role)},body:JSON.stringify(data)});
 let checks=0;const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
 const create=async(code,ids=[],extra={})=>{const r=await call('',{code:tag+code,name:'Prerequisite QA',credits:4,career,year:1,semester:1,prerequisiteSubjectIds:ids,...extra},'administrator','POST');check(r.status,201);return(await r.json()).data;};
 const get=async id=>{const r=await fetch('http://127.0.0.1:3000/api/subjects/'+id,{headers:{Authorization:'Bearer '+token('administrator')}});check(r.status,200);return(await r.json()).data;};
 const idsOf=s=>s.prerequisites.map(p=>p.prerequisiteSubjectId).sort();
 try{
  await db.query('INSERT INTO users(id,email,password_hash,role,first_name,last_name) VALUES($1,$2,$3,$4,$5,$6)',[userId,userId+'@example.invalid','synthetic-not-a-password','administrator','PrereqQA','Fixture']);
  for(let i=0;i<2;i++)await db.query('INSERT INTO careers(id,code,name) VALUES($1,$2,$3)',[careerIds[i],tag+'C'+i,[career,otherCareer][i]]);
  const a=await create('A');const b=await create('B');const c=await create('C',[a.id,b.id]);const foreign=await create('F',[],{career:otherCareer});
  check(idsOf(c),[a.id,b.id].sort());
  check((await call('/'+c.id,{name:'Updated QA'})).status,200);check(idsOf(await get(c.id)),[a.id,b.id].sort());
  for(const ids of [[a.id,a.id],[c.id],[randomUUID()],[foreign.id]])check((await call('/'+c.id,{prerequisiteSubjectIds:ids})).status,400);
  check((await call('/'+a.id,{prerequisiteSubjectIds:[c.id]})).status,400);
  check((await call('/'+c.id,{prerequisiteSubjectIds:[]})).status,200);check(idsOf(await get(c.id)),[]);
  check((await call('/'+c.id,{prerequisiteSubjectId:a.id})).status,200);check(idsOf(await get(c.id)),[a.id]);
  check((await call('/'+c.id,{prerequisiteSubjectIds:[a.id],prerequisiteSubjectId:b.id})).status,400);
  check((await call('/'+c.id,{prerequisiteSubjectIds:null})).status,400);
  check((await call('/'+c.id,{prerequisiteSubjectIds:[123]})).status,400);
  check((await call('/'+c.id,{unexpected:'mass-assignment'})).status,400);
  await db.query('UPDATE subjects SET is_active=false WHERE id=$1',[b.id]);
  check((await call('/'+c.id,{prerequisiteSubjectIds:[a.id,b.id]})).status,400);
  await db.query('UPDATE subjects SET is_active=true WHERE id=$1',[b.id]);
  check((await call('/'+c.id,{prerequisiteSubjectIds:[a.id,b.id]})).status,200);
  await db.query('UPDATE subjects SET is_active=false WHERE id=$1',[b.id]);
  check((await call('/'+c.id,{name:'Keep existing inactive',prerequisiteSubjectIds:[a.id,b.id]})).status,200);
  await db.query('UPDATE subjects SET is_active=true WHERE id=$1',[b.id]);
  check((await call('/'+c.id,{code:a.code,prerequisiteSubjectIds:[]})).status,409);check(idsOf(await get(c.id)),[a.id,b.id].sort());
  check((await call('/'+a.id,{career:otherCareer})).status,400);
  for(const role of ['student','teacher','collector'])check((await call('/'+c.id,{prerequisiteSubjectIds:[]},role)).status,403);
  const concurrent=await Promise.all([call('/'+a.id,{prerequisiteSubjectIds:[b.id]}),call('/'+b.id,{prerequisiteSubjectIds:[a.id]})]);
  check(concurrent.map(r=>r.status).sort(),[200,400]);
  check(idsOf(await get(c.id)),[a.id,b.id].sort());
  console.log(JSON.stringify({checks,result:'passed',syntheticOnly:true}));
 }finally{
  await db.query('DELETE FROM prerequisites WHERE subject_id IN (SELECT id FROM subjects WHERE career=ANY($1::text[])) OR prerequisite_subject_id IN (SELECT id FROM subjects WHERE career=ANY($1::text[]))',[[career,otherCareer]]);
  await db.query('DELETE FROM subjects WHERE career=ANY($1::text[])',[[career,otherCareer]]);
  await db.query('DELETE FROM careers WHERE id=ANY($1::uuid[])',[careerIds]);await db.query('DELETE FROM users WHERE id=$1',[userId]);await db.end();
 }
})().catch(()=>{console.error('Prerequisite checks failed; fixture values and query parameters withheld.');process.exitCode=1;});
