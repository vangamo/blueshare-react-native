import { migrate } from '@/items/infrastructure/migrations';
import { ProfileNotFoundError } from '@/profile/domain/errors';
import type { Profile } from '@/profile/domain/profile';
import { SqliteProfileRepository } from '@/profile/infrastructure/sqlite-profile-repository';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

const empty: Profile = { id: 'me', name: null, avatar: null, createdAt: 1, updatedAt: 1 };

async function setup() {
  const db = new NodeSqlDatabase();
  await migrate(db);
  return { db, repository: new SqliteProfileRepository(db) };
}

describe('SqliteProfileRepository', () => {
  test('findMe is null before the profile exists', async () => {
    const { repository } = await setup();
    expect(await repository.findMe()).toBeNull();
  });

  test('round trip without an avatar', async () => {
    const { repository } = await setup();
    await repository.createMe(empty);
    expect(await repository.findMe()).toEqual(empty);
  });

  test('round trip with a name and an avatar', async () => {
    const { repository } = await setup();
    await repository.createMe(empty);
    const saved: Profile = {
      ...empty,
      name: 'Carmen',
      avatar: { file: 'a.jpg', width: 1200, height: 1600 },
      updatedAt: 5,
    };
    await repository.updateMe(saved);
    expect(await repository.findMe()).toEqual(saved);
  });

  test('a second own profile is rejected', async () => {
    const { repository } = await setup();
    await repository.createMe(empty);
    await expect(repository.createMe({ ...empty, id: 'other' })).rejects.toThrow();
  });

  test('updateMe archives each earlier version with counters 1 and 2', async () => {
    const { db, repository } = await setup();
    await repository.createMe(empty);
    const first: Profile = { ...empty, name: 'Carmen', updatedAt: 2 };
    const second: Profile = {
      ...first,
      name: 'Abuela Carmen',
      avatar: { file: 'a.jpg', width: 2, height: 3 },
      updatedAt: 3,
    };
    await repository.updateMe(first);
    await repository.updateMe(second);

    const history = await db.getAll(
      'SELECT person_id, counter, display_name, avatar_file, updated_at FROM people_history ORDER BY counter',
    );
    expect(history).toEqual([
      { person_id: 'me', counter: 1, display_name: null, avatar_file: null, updated_at: 1 },
      { person_id: 'me', counter: 2, display_name: 'Carmen', avatar_file: null, updated_at: 2 },
    ]);
    expect(await repository.findMe()).toEqual(second);
  });

  test('updateMe without an own profile throws ProfileNotFoundError', async () => {
    const { repository } = await setup();
    await expect(repository.updateMe(empty)).rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  test('a failing write leaves the live row and the history unchanged', async () => {
    const { db } = await setup();
    await new SqliteProfileRepository(db).createMe(empty);
    const failing = new SqliteProfileRepository(
      new FailingSqlDatabase(db, (sql) => sql.includes('UPDATE people')),
    );

    await expect(failing.updateMe({ ...empty, name: 'Carmen', updatedAt: 2 })).rejects.toThrow();

    expect(await new SqliteProfileRepository(db).findMe()).toEqual(empty);
    expect(await db.getAll('SELECT counter FROM people_history')).toEqual([]);
  });
});
