import type { UseCaseDeps } from './deps';

/**
 * Deletes an item: its last version goes to the history with the deletion time, and it
 * leaves the Timeline.
 *
 * @throws ItemNotFoundError when no live item has this id.
 */
export function deleteItem({ repository, clock }: Pick<UseCaseDeps, 'repository' | 'clock'>) {
  return (id: string): Promise<void> => repository.deleteItem(id, clock.now());
}
