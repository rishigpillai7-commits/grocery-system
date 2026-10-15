// Creates the MySQL database named in .env (DB_NAME) if it does not exist yet.
require('dotenv').config();
const mysql = require('mysql2/promise');

const name = process.env.DB_NAME || 'freelance_escrow';

(async () => {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('DB_NAME may only contain letters, numbers and underscores');
  }
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
  console.log(`✔ Database "${name}" is ready`);
})().catch((err) => {
  console.error('✘ Could not create the database:', err.message);
  console.error('  Is MySQL running? Are DB_USER / DB_PASS in backend/.env correct?');
  process.exit(1);
});
