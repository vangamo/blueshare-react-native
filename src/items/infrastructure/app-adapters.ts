/**
 * The real adapters the app runs with. This is the one module Jest replaces (see
 * src/test-utils/jest-setup.ts), so app code never changes for tests.
 */
import { randomUUID } from 'expo-crypto';

import type { Clock, IdGenerator, PhotoStore } from '@/items/domain/ports';

import { createExpoPhotoStore } from './expo-photo-store';
import { createExpoSqlDatabase } from './expo-sql-database';
import type { SqlDatabase } from './sql-database';

export type AppAdapters = {
  db: SqlDatabase;
  ids: IdGenerator;
  clock: Clock;
  photos: PhotoStore;
};

export function createAppAdapters(): AppAdapters {
  return {
    db: createExpoSqlDatabase(),
    ids: { newId: () => randomUUID() },
    clock: { now: () => Date.now() },
    photos: createExpoPhotoStore(),
  };
}
