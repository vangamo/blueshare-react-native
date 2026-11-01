/// <reference types="node" />
/**
 * `SqlDatabase` over Node's built-in `node:sqlite` (Node ≥ 22.13), so Jest runs the
 * same SQL and migrations as the app. Only tests and jest-setup.ts import it, so
 * Metro never bundles it.
 */
import { DatabaseSync } from 'node:sqlite';

import type { SqlDatabase, SqlExecutor, SqlValue } from '@/items/infrastructure/sql-database';

export class NodeSqlDatabase implements SqlDatabase {
  private readonly db: DatabaseSync;
  /** Transactions run one at a time, like expo-sqlite's exclusive transactions. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async run(sql: string, params: SqlValue[] = []): Promise<void> {
    this.db.prepare(sql).run(...params);
  }

  async getAll<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async getFirst<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...params) as T | undefined) ?? null;
  }

  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      this.db.exec('BEGIN');
      try {
        const value = await work(this);
        this.db.exec('COMMIT');
        return value;
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    });
    // Keep the queue going whether this transaction succeeds or fails.
    this.queue = result.catch(() => undefined);
    return result;
  }

  close() {
    this.db.close();
  }
}
