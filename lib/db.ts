import Database from 'better-sqlite3';
import path from 'path';

declare global {
  var __sqliteDb: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), 'database.sqlite');

function createDbConnection(): Database.Database {
  const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? undefined : undefined,
  });

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

const db: Database.Database = global.__sqliteDb || createDbConnection();

if (process.env.NODE_ENV !== 'production') {
  global.__sqliteDb = db;
}

export default db;
export { db };
