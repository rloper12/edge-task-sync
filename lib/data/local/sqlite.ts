import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('mydb.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER NOT NULL DEFAULT 0
  );
`);

let initialized = false;
export function initializeDatabase() {
  if (initialized) return;
  initialized = true;
  
  // Dynamic import to break circular dependency
  import('./tasks').then(({ seedDatabase }) => {
    try {
      seedDatabase();
    } catch (error) {
      console.error('Failed to seed database:', error);
    }
  }).catch((error) => {
    console.error('Failed to import tasks module:', error);
  });
}