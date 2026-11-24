// Only for a NEW disposable stack created from docker-compose.portainer.yml.
const assert = require('node:assert/strict');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { bootstrapAdmin } = require('./scripts/bootstrap-admin.cjs');
(async () => {
  const db = new Client({ host:process.env.DATABASE_HOST,port:Number(process.env.DATABASE_PORT),database:process.env.DATABASE_NAME,
    user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD });
  await db.connect(); let checks=0;
  const check=(a,b)=>{assert.deepEqual(a,b); checks++;};
  try {
    const users=(await db.query('SELECT email,password_hash,role FROM users')).rows;
    check(users.length,1); check(users[0].role,'administrator');
    check(await bcrypt.compare(process.env.INITIAL_ADMIN_PASSWORD,users[0].password_hash),true);
    check(await bootstrapAdmin(),'existing-users-preserved');
    check(await bootstrapAdmin({...process.env,INITIAL_ADMIN_PASSWORD:'short'}).then(()=>false,()=>true),true);
    check((await db.query('SELECT count(*)::int AS n FROM users')).rows[0].n,1);
    check((await db.query('SELECT count(*)::int AS n FROM subjects')).rows[0].n,0);
    check((await db.query('SELECT count(*)::int AS n FROM students')).rows[0].n,0);
    check((await db.query('SELECT count(*)::int AS n FROM system_settings')).rows[0].n,1);
    const flags=(await db.query('SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user')).rows[0];
    check(Object.values(flags),[false,false,false]);
    const login=await fetch('http://127.0.0.1:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:process.env.INITIAL_ADMIN_EMAIL,password:process.env.INITIAL_ADMIN_PASSWORD})});
    check(login.status,201); const data=(await login.json()).data; check(data.user.role,'administrator');
    const settings=await fetch('http://127.0.0.1:3000/api/settings',{headers:{Authorization:'Bearer '+data.token}});
    check(settings.status,200);
    check((await fetch('http://127.0.0.1:3000/api/docs')).status,200);
    check((await fetch('http://127.0.0.1:3000/api/legacy-subjects/template',{headers:{Authorization:'Bearer '+data.token}})).status,200);
    console.log(JSON.stringify({result:'passed',checks,credentialsPrinted:false}));
  } finally {await db.end();}
})().catch(()=>{console.error('Distribution validation failed; credentials and query parameters withheld.');process.exitCode=1;});
