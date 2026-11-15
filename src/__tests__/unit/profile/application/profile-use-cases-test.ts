import type { PickedPhoto } from '@/items/domain/image-item';
import { migrate } from '@/items/infrastructure/migrations';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { loadProfile } from '@/profile/application/load-profile';
import { updateProfile } from '@/profile/application/update-profile';
import { SqliteProfileRepository } from '@/profile/infrastructure/sqlite-profile-repository';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodePhotoStore, writeFixturePhoto } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

const NOW = 1_700_000_000_000;

function picked(overrides: Partial<PickedPhoto> = {}): PickedPhoto {
  return { uri: writeFixturePhoto(), width: 400, height: 300, mimeType: 'image/png', ...overrides };
}

async function setup(wrap: (db: SqlDatabase) => SqlDatabase = (db) => db) {
  const db = new NodeSqlDatabase();
  await migrate(db);
  const photos = new NodePhotoStore();
  const reader = new SqliteProfileRepository(db);
  const deps = {
    repository: new SqliteProfileRepository(wrap(db)),
    clock: fixedClock(NOW, 1),
    ids: sequentialIds(),
    photos,
  };
  return { db, photos, reader, load: loadProfile(deps), update: updateProfile(deps) };
}

describe('loadProfile', () => {
  test('the first load creates the own profile with the injected UUID', async () => {
    const { reader, load } = await setup();
    const profile = await load();
    expect(profile).toEqual({ id: 'id-1', name: null, avatar: null, createdAt: NOW, updatedAt: NOW });
    expect(await reader.findMe()).toEqual(profile);
  });

  test('a second load returns the stored profile and creates nothing', async () => {
    const { db, load } = await setup();
    const first = await load();
    expect(await load()).toEqual(first);
    expect(await db.getAll('SELECT id FROM people')).toHaveLength(1);
  });
});

describe('updateProfile', () => {
  test('saves the trimmed name', async () => {
    const { reader, load, update } = await setup();
    const saved = await update(await load(), { name: '  Abuela Carmen ', avatar: { kind: 'keep' } });
    expect(saved.name).toBe('Abuela Carmen');
    expect(await reader.findMe()).toEqual(saved);
  });

  test('an empty name throws before anything is copied or written', async () => {
    const { db, photos, load, update } = await setup();
    const current = await load();
    await expect(
      update(current, { name: '  ', avatar: { kind: 'picked', photo: picked() } }),
    ).rejects.toMatchObject({ field: 'name', reason: 'empty' });
    expect(photos.has('id-2.png')).toBe(false);
    expect(await db.getAll('SELECT counter FROM people_history')).toEqual([]);
  });

  test('a photo with no valid size throws before anything is copied', async () => {
    const { photos, load, update } = await setup();
    const current = await load();
    await expect(
      update(current, { name: 'Ana', avatar: { kind: 'picked', photo: picked({ width: 0 }) } }),
    ).rejects.toMatchObject({ field: 'avatar', reason: 'invalid' });
    expect(photos.has('id-2.png')).toBe(false);
  });

  test('an unchanged save writes nothing and keeps the update time', async () => {
    const { db, load, update } = await setup();
    const current = await update(await load(), { name: 'Ana', avatar: { kind: 'keep' } });
    const again = await update(current, { name: ' Ana ', avatar: { kind: 'keep' } });
    expect(again).toBe(current);
    expect(await db.getAll('SELECT counter FROM people_history')).toHaveLength(1);
  });

  test('a picked photo is copied as <id>.<ext> and referenced', async () => {
    const { photos, reader, load, update } = await setup();
    const saved = await update(await load(), {
      name: 'Ana',
      avatar: { kind: 'picked', photo: picked() },
    });
    expect(saved.avatar).toEqual({ file: 'id-2.png', width: 400, height: 300 });
    expect(photos.has('id-2.png')).toBe(true);
    expect(await reader.findMe()).toEqual(saved);
  });

  test('a failed copy throws copy_failed and stores nothing', async () => {
    const { db, load, update } = await setup();
    const current = await load();
    await expect(
      update(current, {
        name: 'Ana',
        avatar: { kind: 'picked', photo: picked({ uri: '/no/such/file.png' }) },
      }),
    ).rejects.toEqual(expect.objectContaining({ field: 'avatar', reason: 'copy_failed' }));
    expect(await db.getFirst('SELECT display_name FROM people')).toEqual({ display_name: null });
  });

  test('a failed store removes the new copy and rethrows the original error', async () => {
    const { db, photos, load } = await setup();
    const deps = {
      repository: new SqliteProfileRepository(new FailingSqlDatabase(db, (sql) => sql.includes('UPDATE people'))),
      clock: fixedClock(NOW, 1),
      ids: sequentialIds('x-'),
      photos,
    };
    const current = await load();
    await expect(
      updateProfile(deps)(current, { name: 'Ana', avatar: { kind: 'picked', photo: picked() } }),
    ).rejects.toThrow('Injected failure');
    expect(photos.has('x-1.png')).toBe(false);
    expect(await db.getFirst('SELECT display_name FROM people')).toEqual({ display_name: null });
  });

  test('removing the avatar clears it and keeps the old file', async () => {
    const { photos, reader, load, update } = await setup();
    const withPhoto = await update(await load(), {
      name: 'Ana',
      avatar: { kind: 'picked', photo: picked() },
    });
    const removed = await update(withPhoto, { name: 'Ana', avatar: { kind: 'remove' } });
    expect(removed.avatar).toBeNull();
    expect((await reader.findMe())?.avatar).toBeNull();
    expect(photos.has(withPhoto.avatar!.file)).toBe(true);
  });
});
