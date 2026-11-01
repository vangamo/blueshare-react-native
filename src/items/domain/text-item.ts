import { TEXT_MAX_LENGTH } from '@/constants/limits';

import { InvalidTextError } from './errors';
import type { ItemMeta } from './item';

/** A short text shared on the timeline. */
export type TextItem = ItemMeta & {
  type: 'text';
  /** Trimmed text, 1 to `TEXT_MAX_LENGTH` characters, inner line breaks kept. */
  body: string;
};

/**
 * Trims `raw` and checks its length, whatever its source (the creation box now,
 * items received from contacts later). Length counts UTF-16 code units, like
 * `TextInput.maxLength`, so an emoji can count as 2.
 *
 * @throws InvalidTextError when the trimmed text is empty or longer than `maxLength`.
 */
export function normalizeTextBody(raw: string, maxLength: number = TEXT_MAX_LENGTH): string {
  const body = raw.trim();
  if (body.length === 0) throw new InvalidTextError('blank', maxLength);
  if (body.length > maxLength) throw new InvalidTextError('too_long', maxLength);
  return body;
}

/**
 * The item with `rawText` as its new text and `now` as its update time, or `null` when
 * the trimmed text equals the current one (nothing to store). Id, type and creation
 * time stay the same.
 *
 * @throws InvalidTextError when the trimmed text is empty or longer than `maxLength`.
 */
export function withNewText(
  item: TextItem,
  rawText: string,
  now: number,
  maxLength: number = TEXT_MAX_LENGTH,
): TextItem | null {
  const body = normalizeTextBody(rawText, maxLength);
  if (body === item.body) return null;
  return { ...item, body, updatedAt: now };
}
