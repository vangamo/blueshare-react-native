/**
 * Composition root of the profile module: wires the SQLite repository into the use cases
 * and the store. It shares the items module's adapters (one database, one photo store).
 */
import type { Clock, IdGenerator, PhotoStore } from '@/items/domain/ports';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { SqliteProfileRepository } from '@/profile/infrastructure/sqlite-profile-repository';

import { loadProfile } from './load-profile';
import { createProfileStore, type ProfileStore } from './profile-store';
import { updateProfile } from './update-profile';

export type ProfileAdapters = {
  db: SqlDatabase;
  ids: IdGenerator;
  clock: Clock;
  photos: PhotoStore;
  /** Gets storage ready. Shared with the items module so the migrations run once. */
  prepare: () => Promise<void>;
};

export type ProfileModule = {
  store: ProfileStore;
  /** Gives the UI the URI of a stored photo. */
  photos: PhotoStore;
};

export function createProfileModule({ db, ids, clock, photos, prepare }: ProfileAdapters): ProfileModule {
  const deps = { repository: new SqliteProfileRepository(db), clock, ids, photos };
  const store = createProfileStore({
    prepare,
    loadProfile: loadProfile(deps),
    updateProfile: updateProfile(deps),
  });
  return { store, photos };
}
