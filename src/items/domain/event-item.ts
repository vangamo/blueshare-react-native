import {
  EVENT_CATEGORY_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_MAX_PHOTOS,
  EVENT_TITLE_MAX_LENGTH,
} from '@/constants/limits';

import { InvalidEventError } from './errors';
import type { StoredPhoto } from './image-item';
import type { ItemMeta } from './item';

/** A memory with a title, a category, 1 to `EVENT_MAX_PHOTOS` photos and an optional description. */
export type EventItem = ItemMeta & {
  type: 'event';
  /** Trimmed, 1 to `EVENT_TITLE_MAX_LENGTH` characters. */
  title: string;
  /** Trimmed, 1 to `EVENT_CATEGORY_MAX_LENGTH` characters. */
  category: string;
  /** Trimmed, at most `EVENT_DESCRIPTION_MAX_LENGTH` characters. `null` means none. */
  description: string | null;
  /** In the order they are shown. */
  photos: StoredPhoto[];
};

export type EventTexts = { title: string; category: string; description: string | null };

function required(raw: string, field: 'title' | 'category', maxLength: number): string {
  const text = raw.trim();
  if (text.length === 0) throw new InvalidEventError(field, 'blank', maxLength);
  if (text.length > maxLength) throw new InvalidEventError(field, 'too_long', maxLength);
  return text;
}

/**
 * Trims the three texts and turns an empty description into `null`, whatever their
 * source. Length counts UTF-16 code units.
 *
 * @throws InvalidEventError naming the field that is blank or over its limit.
 */
export function normalizeEventTexts(raw: {
  title: string;
  category: string;
  description: string | null;
}): EventTexts {
  const description = (raw.description ?? '').trim();
  if (description.length > EVENT_DESCRIPTION_MAX_LENGTH) {
    throw new InvalidEventError('description', 'too_long', EVENT_DESCRIPTION_MAX_LENGTH);
  }
  return {
    title: required(raw.title, 'title', EVENT_TITLE_MAX_LENGTH),
    category: required(raw.category, 'category', EVENT_CATEGORY_MAX_LENGTH),
    description: description.length === 0 ? null : description,
  };
}

/**
 * Checks that an event holds between 1 and `EVENT_MAX_PHOTOS` photos.
 *
 * @throws InvalidEventError for the `photos` field, with the limit that was broken.
 */
export function checkPhotoCount(count: number): void {
  if (count < 1) throw new InvalidEventError('photos', 'too_few', 1);
  if (count > EVENT_MAX_PHOTOS) throw new InvalidEventError('photos', 'too_many', EVENT_MAX_PHOTOS);
}

function sameFiles(a: readonly StoredPhoto[], b: readonly StoredPhoto[]): boolean {
  return a.length === b.length && a.every((photo, index) => photo.file === b[index].file);
}

/**
 * The item with the new photos and texts and `now` as its update time, or `null` when
 * nothing changes: the same photo files in the same order and trimmed-equal texts.
 * Id, type and creation time stay the same.
 *
 * @throws InvalidEventError when a text or the photo count breaks its rule.
 */
export function withEventChanges(
  item: EventItem,
  changes: { title: string; category: string; description: string | null; photos: StoredPhoto[] },
  now: number,
): EventItem | null {
  const texts = normalizeEventTexts(changes);
  checkPhotoCount(changes.photos.length);
  if (
    sameFiles(item.photos, changes.photos) &&
    texts.title === item.title &&
    texts.category === item.category &&
    texts.description === item.description
  ) {
    return null;
  }
  return { ...item, ...texts, photos: [...changes.photos], updatedAt: now };
}
