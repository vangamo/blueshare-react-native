import { normalizeTextBody, type TextItem } from '@/items/domain/text-item';

import type { UseCaseDeps } from './deps';

/**
 * Creates and stores a text item from what the user typed.
 *
 * @throws InvalidTextError for blank or too-long text, before anything is stored.
 */
export function createTextItem({ repository, clock, ids }: UseCaseDeps) {
  return async (rawText: string): Promise<TextItem> => {
    const body = normalizeTextBody(rawText);
    const now = clock.now();
    const item: TextItem = {
      id: ids.newId(),
      type: 'text',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      body,
    };
    await repository.saveText(item);
    return item;
  };
}
