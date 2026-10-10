/**
 * Postgres lokal untuk development tanpa instalasi Postgres/Docker.
 * Memakai binary resmi PostgreSQL dari paket `embedded-postgres`;
 * data disimpan di ./.local-pg dan bertahan antar restart.
 *
 *   npm run db:local     (biarkan berjalan di terminal terpisah)
 *
 * URL koneksi: postgresql://postgres:postgres@127.0.0.1:5433/heaven_inv
 */
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
const databaseDir = path.resolve(process.cwd(), ".local-pg");
const database = "heaven_inv";

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error("[postgres]", String(message).trim()),
});

async function main() {
  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
    console.log("Menyiapkan cluster Postgres baru di .local-pg ...");
    await pg.initialise();
  }
  await pg.start();

  const client = pg.getPgClient();
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE ${database}`);
  await client.end();

  console.log(`Postgres lokal siap: postgresql://postgres:postgres@127.0.0.1:${port}/${database}`);
  console.log("Tekan Ctrl+C untuk berhenti.");
}

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  console.log("Menghentikan Postgres ...");
  await pg.stop().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(async (error) => {
  console.error(error);
  await pg.stop().catch(() => {});
  process.exit(1);
});

// Jaga proses tetap hidup selama server berjalan.
setInterval(() => {}, 1 << 30);
