// Execute via stdin INSIDE the backend container after securing uploads.
const { Client } = require('pg');
const { mkdir, copyFile } = require('node:fs/promises');
const { join } = require('node:path');
(async () => {
  const db = new Client({ host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD });
  await db.connect();
  try {
    const settings = await db.query('SELECT id,logo_url FROM system_settings WHERE id=1');
    const url = settings.rows[0]?.logo_url;
    if (typeof url !== 'string' || !/^\/uploads\/[a-f0-9-]+\.webp$/i.test(url)) {
      console.log('Logo: no requiere migración.'); return;
    }
    // Never publish a file referenced as a payment receipt, even if configured as logo.
    const receipt = await db.query('SELECT 1 FROM payments WHERE receipt_image_url=$1 LIMIT 1', [url]);
    if (receipt.rowCount) throw new Error('El logo apunta a un comprobante privado; requiere seleccionar un logo propio.');
    const filename = url.split('/').pop();
    await mkdir('/app/uploads/logos', { recursive: true });
    await copyFile(join('/app/uploads', filename), join('/app/uploads/logos', filename));
    await db.query('UPDATE system_settings SET logo_url=$1 WHERE id=1', ['/uploads/logos/' + filename]);
    console.log('Logo anterior copiado al directorio público; original conservado.');
  } finally { await db.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
