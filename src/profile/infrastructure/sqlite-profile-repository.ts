import type { SqlDatabase, SqlValue } from '@/items/infrastructure/sql-database';
import { ProfileNotFoundError } from '@/profile/domain/errors';
import type { ProfileRepository } from '@/profile/domain/ports';
import type { Profile } from '@/profile/domain/profile';

type PersonRow = {
  id: string;
  display_name: string | null;
  avatar_file: string | null;
  avatar_width: number | null;
  avatar_height: number | null;
  created_at: number;
  updated_at: number;
};

const COLUMNS =
  'id, display_name, avatar_file, avatar_width, avatar_height, created_at, updated_at';

function toProfile(row: PersonRow): Profile {
  const hasAvatar =
    row.avatar_file !== null && row.avatar_width !== null && row.avatar_height !== null;
  return {
    id: row.id,
    name: row.display_name,
    avatar: hasAvatar
      ? { file: row.avatar_file!, width: row.avatar_width!, height: row.avatar_height! }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function avatarParams(profile: Profile): SqlValue[] {
  const { avatar } = profile;
  return [avatar?.file ?? null, avatar?.width ?? null, avatar?.height ?? null];
}

/** `ProfileRepository` over the shared SQLite database (`people` and `people_history`). */
export class SqliteProfileRepository implements ProfileRepository {
  constructor(private readonly db: SqlDatabase) {}

  async findMe(): Promise<Profile | null> {
    const row = await this.db.getFirst<PersonRow>(
      `SELECT ${COLUMNS} FROM people WHERE is_me = 1`,
    );
    return row ? toProfile(row) : null;
  }

  async createMe(profile: Profile): Promise<void> {
    await this.db.run(
      `INSERT INTO people (id, is_me, display_name, avatar_file, avatar_width, avatar_height, created_at, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?)`,
      [profile.id, profile.name, ...avatarParams(profile), profile.createdAt, profile.updatedAt],
    );
  }

  async updateMe(profile: Profile): Promise<void> {
    await this.db.transaction(async (tx) => {
      const current = await tx.getFirst<{ id: string }>(
        'SELECT id FROM people WHERE id = ? AND is_me = 1',
        [profile.id],
      );
      if (!current) throw new ProfileNotFoundError();
      const next = await tx.getFirst<{ next: number }>(
        'SELECT COALESCE(MAX(counter), 0) + 1 AS next FROM people_history WHERE person_id = ?',
        [profile.id],
      );
      await tx.run(
        `INSERT INTO people_history (person_id, counter, display_name, avatar_file, avatar_width, avatar_height, created_at, updated_at)
         SELECT id, ?, display_name, avatar_file, avatar_width, avatar_height, created_at, updated_at
         FROM people WHERE id = ?`,
        [next?.next ?? 1, profile.id],
      );
      await tx.run(
        `UPDATE people SET display_name = ?, avatar_file = ?, avatar_width = ?, avatar_height = ?, updated_at = ?
         WHERE id = ?`,
        [profile.name, ...avatarParams(profile), profile.updatedAt, profile.id],
      );
    });
  }
}
