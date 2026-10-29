// Local maintenance: rotate Compose secrets and DB passwords, preserving data.
const { randomBytes } = require('node:crypto');
const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');
if (process.argv.includes('--init-env') && existsSync(envPath)) {
  console.error('.env ya existe; se conserva sin cambios.'); process.exit(1);
}
const previous = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const names = ['POSTGRES_PASSWORD', 'DATABASE_PASSWORD', 'JWT_SECRET'];
const values = Object.fromEntries(names.map(name => [name, randomBytes(48).toString('hex')]));
const kept = previous.split(/\r?\n/).filter(line => !names.some(name => line.startsWith(name + '=')));
const saveEnv = () => writeFileSync(envPath,
  kept.concat(names.map(name => `${name}=${values[name]}`)).join('\n') + '\n', { mode: 0o600 });
if (process.argv.includes('--init-env')) {
  saveEnv(); console.log('.env creado con secretos aleatorios independientes.'); process.exit(0);
}
const roleSql = readFileSync(resolve(root, 'database/security-role.sql'), 'utf8');
const sql = `BEGIN;\n\\set app_password '${values.DATABASE_PASSWORD}'\n${roleSql}\nALTER ROLE postgres WITH PASSWORD '${values.POSTGRES_PASSWORD}';\nCOMMIT;\n`;
const result = spawnSync('docker', ['exec', '-i', 'upam_db', 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'upam_academico'],
  { input: sql, encoding: 'utf8', cwd: root });
if (result.status !== 0) {
  console.error('No se pudo actualizar la DB; .env no fue modificado. No se muestran secretos.');
  process.exit(1);
}
saveEnv();
console.log('Secretos locales rotados y rol de aplicación configurado. Datos y volúmenes conservados. Recrear servicios Compose.');
