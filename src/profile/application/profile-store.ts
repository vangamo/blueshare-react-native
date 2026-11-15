import type { Profile } from '@/profile/domain/profile';

import type { UpdateProfileInput } from './update-profile';

export type ProfileStatus = 'loading' | 'ready' | 'error';

export type ProfileSnapshot = {
  status: ProfileStatus;
  profile: Profile | null;
};

export type ProfileStore = {
  /** The latest snapshot: a new object only when something changed (`useSyncExternalStore`). */
  getSnapshot(): ProfileSnapshot;
  /** Starts the first load and returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /**
   * Waits for the first load, saves the changes and replaces the profile. An unchanged save
   * keeps the snapshot. Rejects on failure, leaving the snapshot as it was.
   */
  update(input: UpdateProfileInput): Promise<Profile>;
};

type ProfileStoreDeps = {
  /** Gets storage ready (runs the migrations once). */
  prepare: () => Promise<void>;
  loadProfile: () => Promise<Profile>;
  updateProfile: (current: Profile, input: UpdateProfileInput) => Promise<Profile>;
};

export function createProfileStore(deps: ProfileStoreDeps): ProfileStore {
  let snapshot: ProfileSnapshot = { status: 'loading', profile: null };
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function set(next: ProfileSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function load(): Promise<void> {
    loading ??= (async () => {
      try {
        await deps.prepare();
        set({ status: 'ready', profile: await deps.loadProfile() });
      } catch {
        set({ status: 'error', profile: null });
      }
    })();
    return loading;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      void load();
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: () => snapshot,

    async update(input) {
      await load();
      if (!snapshot.profile) throw new Error('The profile could not be loaded.');
      const profile = await deps.updateProfile(snapshot.profile, input);
      if (profile !== snapshot.profile) set({ status: 'ready', profile });
      return profile;
    },
  };
}
