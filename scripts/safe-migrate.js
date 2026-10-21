// Backups only; schema changes use release-migrate.cjs.
const { Client } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
async function backup() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in your shell.');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const records = {};
    // Include the heart allowance ledger and all later release tables, too.
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    for (const { tablename: table } of tables.rows) {
      const identifier = '"' + table.replace(/"/g, '""') + '"';
      records[table] = (await client.query(`SELECT * FROM public.${identifier}`)).rows;
      console.log(`${table}: ${records[table].length} rows`);
    }
    await client.query('COMMIT');
    const dir = path.resolve('docs/backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `neon-backup-${Date.now()}.json`);
    fs.writeFileSync(
      file,
      JSON.stringify({ timestamp: new Date().toISOString(), records }, null, 2),
      { flag: 'wx' },
    );
    console.log(`Backup saved: ${file}. No schema or migration history changed.`);
  } finally {
    await client.end();
  }
}
backup().catch(() => {
  console.error(
    'Backup failed. No migration was performed. Check connectivity and DATABASE_URL privately.',
  );
  process.exitCode = 1;
});
