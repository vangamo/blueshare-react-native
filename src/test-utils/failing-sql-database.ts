import type { SqlDatabase, SqlExecutor, SqlValue } from '@/items/infrastructure/sql-database';

/**
 * Wraps a real database and throws on every statement that `shouldFail` matches,
 * inside or outside transactions. Used to test all-or-nothing saves and error states.
 */
export class FailingSqlDatabase implements SqlDatabase {
  constructor(
    private readonly inner: SqlDatabase,
    private readonly shouldFail: (sql: string) => boolean,
  ) {}

  private check(sql: string) {
    if (this.shouldFail(sql)) throw new Error(`Injected failure: ${sql.trim().split('\n')[0]}`);
  }

  private wrap(executor: SqlExecutor): SqlExecutor {
    return {
      exec: async (sql) => {
        this.check(sql);
        return executor.exec(sql);
      },
      run: async (sql, params?: SqlValue[]) => {
        this.check(sql);
        return executor.run(sql, params);
      },
      getAll: async <T>(sql: string, params?: SqlValue[]) => {
        this.check(sql);
        return executor.getAll<T>(sql, params);
      },
      getFirst: async <T>(sql: string, params?: SqlValue[]) => {
        this.check(sql);
        return executor.getFirst<T>(sql, params);
      },
    };
  }

  exec = (sql: string) => this.wrap(this.inner).exec(sql);
  run = (sql: string, params?: SqlValue[]) => this.wrap(this.inner).run(sql, params);
  getAll = <T>(sql: string, params?: SqlValue[]) => this.wrap(this.inner).getAll<T>(sql, params);
  getFirst = <T>(sql: string, params?: SqlValue[]) =>
    this.wrap(this.inner).getFirst<T>(sql, params);

  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return this.inner.transaction((tx) => work(this.wrap(tx)));
  }
}
