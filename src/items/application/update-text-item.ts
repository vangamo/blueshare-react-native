import { ItemNotFoundError } from '@/items/domain/errors';
import { withNewText, type TextItem } from '@/items/domain/text-item';

import type { UseCaseDeps } from './deps';

/**
 * Replaces the text of a stored text item. Returns the stored item: the updated one,
 * or the current one (nothing is written) when the trimmed text is unchanged.
 *
 * @throws InvalidTextError for blank or too-long text, before anything is stored.
 * @throws ItemNotFoundError when no live item has this id.
 */
export function updateTextItem({ repository, clock }: Pick<UseCaseDeps, 'repository' | 'clock'>) {
  return async (id: string, rawText: string): Promise<TextItem> => {
    const current = await repository.findText(id);
    if (!current) throw new ItemNotFoundError(id);
    const updated = withNewText(current, rawText, clock.now());
    if (!updated) return current;
    await repository.updateText(updated);
    return updated;
  };
}
