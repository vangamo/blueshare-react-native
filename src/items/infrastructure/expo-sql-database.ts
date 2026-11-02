/**
 * `SqlDatabase` over expo-sqlite (included in Expo Go). The app's only database
 * driver; Jest uses `NodeSqlDatabase` instead (openspec add-text-items design D4).
 * https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/
 */
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import type { SqlDatabase, SqlExecutor, SqlValue } from './sql-database';

const DATABASE_NAME = 'blueshare.db';

function executor(db: SQLiteDatabase): SqlExecutor {
  return {
    exec: (sql) => db.execAsync(sql),
    run: async (sql, params = []) => {
      await db.runAsync(sql, params);
    },
    getAll: <T>(sql: string, params: SqlValue[] = []) => db.getAllAsync<T>(sql, params),
    getFirst: <T>(sql: string, params: SqlValue[] = []) => db.getFirstAsync<T>(sql, params),
  };
}

export function createExpoSqlDatabase(): SqlDatabase {
  const db = openDatabaseSync(DATABASE_NAME);
  // WAL lets the main connection read while a transaction writes on its own
  // connection (recommended by the expo-sqlite docs). Foreign keys are off by
  // default, per connection.
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  if (__DEV__) {
    db.getFirstAsync<{ version: string }>('SELECT sqlite_version() AS version').then(
      (row) => console.log(`[items] SQLite ${row?.version}`),
      () => undefined,
    );
  }

  return {
    ...executor(db),
    // Only queries made through `tx` run inside the transaction. expo-sqlite opens a
    // separate connection and sends BEGIN before `work` runs, so `PRAGMA foreign_keys`
    // can't be turned on there: foreign keys are not enforced inside transactions on
    // the device. Nothing relies on them yet (saves insert the parent row first).
    async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
      let result: T | undefined;
      await db.withExclusiveTransactionAsync(async (txn) => {
        result = await work(executor(txn));
      });
      return result as T;
    },
  };
}
