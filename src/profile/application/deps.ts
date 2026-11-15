import type { Clock, IdGenerator, PhotoStore } from '@/items/domain/ports';
import type { ProfileRepository } from '@/profile/domain/ports';

/** What the profile use cases need, injected so tests can fix the clock and the ids. */
export type ProfileUseCaseDeps = {
  repository: ProfileRepository;
  clock: Clock;
  ids: IdGenerator;
  photos: PhotoStore;
};
