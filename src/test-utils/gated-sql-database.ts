import type { SqlDatabase, SqlExecutor, SqlValue } from '@/items/infrastructure/sql-database';

/**
 * Wraps a real database. After `hold()`, new transactions wait until the returned
 * `release` is called, so a test can act while a save is in progress.
 */
export class GatedSqlDatabase implements SqlDatabase {
  private gate: Promise<void> = Promise.resolve();
  /** How many transactions were started. */
  transactions = 0;

  constructor(private readonly inner: SqlDatabase) {}

  hold(): () => void {
    let release = () => {};
    this.gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return release;
  }

  exec = (sql: string) => this.inner.exec(sql);
  run = (sql: string, params?: SqlValue[]) => this.inner.run(sql, params);
  getAll = <T>(sql: string, params?: SqlValue[]) => this.inner.getAll<T>(sql, params);
  getFirst = <T>(sql: string, params?: SqlValue[]) => this.inner.getFirst<T>(sql, params);

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    this.transactions += 1;
    await this.gate;
    return this.inner.transaction(work);
  }
}
