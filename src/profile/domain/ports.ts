import type { Profile } from './profile';

/** Where the own profile is kept. Implemented over SQLite in `infrastructure/`. */
export interface ProfileRepository {
  /** The own profile, or `null` when it was never created. */
  findMe(): Promise<Profile | null>;
  /** Stores the own profile. Fails if one already exists (the unique index). */
  createMe(profile: Profile): Promise<void>;
  /**
   * Archives the stored version, then stores `profile`'s name, avatar and update time, in
   * one transaction.
   * @throws ProfileNotFoundError when there is no own profile.
   */
  updateMe(profile: Profile): Promise<void>;
}
