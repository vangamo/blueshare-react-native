import type { Profile } from '@/profile/domain/profile';

import type { ProfileUseCaseDeps } from './deps';

/**
 * The own profile. The first time (nothing stored) it creates it with a new UUID, no name
 * and no photo, and stores it. The UUID never changes afterwards.
 */
export function loadProfile({ repository, clock, ids }: Pick<ProfileUseCaseDeps, 'repository' | 'clock' | 'ids'>) {
  return async (): Promise<Profile> => {
    const existing = await repository.findMe();
    if (existing) return existing;
    const now = clock.now();
    const profile: Profile = { id: ids.newId(), name: null, avatar: null, createdAt: now, updatedAt: now };
    await repository.createMe(profile);
    return profile;
  };
}
