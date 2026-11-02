import type { Clock, IdGenerator, ItemRepository } from '@/items/domain/ports';

/** What the use cases need, injected so tests can fix the clock and the IDs. */
export type UseCaseDeps = {
  repository: ItemRepository;
  clock: Clock;
  ids: IdGenerator;
};
