// Optional first administrator for a NEW database. Never changes existing users.
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function bootstrapAdmin(env = process.env) {
  const email = env.INITIAL_ADMIN_EMAIL || '';
  const password = env.INITIAL_ADMIN_PASSWORD || '';
  if (!email && !password) return 'disabled';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || password.length < 16 || Buffer.byteLength(password) > 72) {
    throw new Error('Configura INITIAL_ADMIN_EMAIL válido y INITIAL_ADMIN_PASSWORD de al menos 16 caracteres y hasta 72 bytes.');
  }
  const db = new Client({ host: env.DATABASE_HOST, port: Number(env.DATABASE_PORT || 5432),
    database: env.DATABASE_NAME, user: env.DATABASE_USER, password: env.DATABASE_PASSWORD });
  try {
    await db.connect();
    await db.query('BEGIN');
    await db.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
    const { rows } = await db.query('SELECT EXISTS(SELECT 1 FROM users) AS populated');
    if (rows[0].populated) {
      await db.query('COMMIT');
      return 'existing-users-preserved';
    }
    const hash = await bcrypt.hash(password, 12);
    await db.query(`INSERT INTO users(email,password_hash,role,first_name,last_name)
      VALUES($1,$2,'administrator','Administrador','Inicial')`, [email, hash]);
    await db.query('COMMIT');
    return 'created';
  } catch {
    await db.query('ROLLBACK').catch(() => {});
    throw new Error('No se pudo preparar el administrador inicial; revisa la configuración y la conexión a la base.');
  } finally { await db.end(); }
}

module.exports = { bootstrapAdmin };
if (require.main === module) bootstrapAdmin().then(result => {
  console.log('Administrador inicial: ' + result);
}).catch(error => { console.error(error.message); process.exitCode = 1; });
