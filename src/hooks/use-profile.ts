import { use, useSyncExternalStore } from 'react';

import { ProfileContext } from '@/components/items-provider';
import type { ProfileStatus } from '@/profile/application/profile-store';
import type { UpdateProfileInput } from '@/profile/application/update-profile';
import type { Profile } from '@/profile/domain/profile';

export { InvalidProfileError } from '@/profile/domain/errors';
export type { AvatarInput, Profile } from '@/profile/domain/profile';
export type { ProfileStatus, UpdateProfileInput };

export type UseProfile = {
  status: ProfileStatus;
  /** The own profile, or `null` while loading or when it could not be read. */
  profile: Profile | null;
  /** Saves the name and avatar. Rejects when it can't be saved (see `InvalidProfileError`). */
  updateProfile: (input: UpdateProfileInput) => Promise<Profile>;
};

/** The user's own profile and its load status. Must be used inside `ItemsProvider`. */
export function useProfile(): UseProfile {
  const module = use(ProfileContext);
  if (!module) throw new Error('useProfile must be used inside ItemsProvider');
  const { store } = module;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { status: snapshot.status, profile: snapshot.profile, updateProfile: store.update };
}
