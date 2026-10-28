import Database from 'better-sqlite3';
import path from 'path';

// Singleton instance across hot-reloads in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __sqliteDb: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), 'database.sqlite');

function createDbConnection(): Database.Database {
  const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? undefined : undefined,
  });

  // Enable WAL mode and foreign key constraints for performance and data integrity
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
