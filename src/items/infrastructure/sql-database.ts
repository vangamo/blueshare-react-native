/**
 * The database port that migrations and the repository depend on. The app gets
 * `ExpoSqlDatabase` (expo-sqlite) and Jest gets `NodeSqlDatabase` (node:sqlite),
 * so the same SQL runs in both (openspec add-text-items design D4).
 *
 * Use positional `?` parameters only: the drivers treat named-parameter prefixes
 * differently.
 */

export type SqlValue = string | number | null;

export interface SqlExecutor {
  /** Runs several statements with no parameters. Migrations only. */
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  getAll<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /** The first row, or `null` when there is none. */
  getFirst<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
}

export interface SqlDatabase extends SqlExecutor {
  /**
   * Runs `work` in one exclusive transaction: it commits when `work` resolves and
   * rolls back when it throws. Only queries made through `tx` belong to it.
   */
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}
