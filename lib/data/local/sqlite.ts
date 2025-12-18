import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('mydb.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

let initialized = false;
export function initializeDatabase() {
  if (initialized) return;
  initialized = true;
  
  // Migrate existing records that might have NULL timestamps
  try {
    const now = Date.now();
    db.execSync(`
      UPDATE tasks 
      SET created_at = ${now}, updated_at = ${now} 
      WHERE created_at IS NULL OR updated_at IS NULL
    `);
  } catch (error) {
    // Migration might fail if columns don't exist yet, which is fine
    console.warn('Migration warning:', error);
  }
}