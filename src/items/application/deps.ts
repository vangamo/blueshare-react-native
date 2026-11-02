import type { Clock, IdGenerator, ItemRepository, PhotoStore } from '@/items/domain/ports';

/** What the use cases need, injected so tests can fix the clock and the IDs. */
export type UseCaseDeps = {
  repository: ItemRepository;
  clock: Clock;
  ids: IdGenerator;
};

/** What the image use cases need on top: the photo files. */
export type ImageUseCaseDeps = UseCaseDeps & { photos: PhotoStore };
