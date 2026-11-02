import { ALT_TEXT_MAX_LENGTH, CAPTION_MAX_LENGTH } from '@/constants/limits';

import { InvalidImageTextError } from './errors';
import type { ItemMeta } from './item';

/** The copy of a photo kept in app storage. `file` is relative to the photos folder. */
export type StoredPhoto = {
  file: string;
  /** Displayed (upright) size in pixels. */
  width: number;
  height: number;
};

/** A photo shared on the timeline, with optional alternative text and caption. */
export type ImageItem = ItemMeta & {
  type: 'image';
  photo: StoredPhoto;
  /** Trimmed, at most `ALT_TEXT_MAX_LENGTH` characters. `null` means none. */
  altText: string | null;
  /** Trimmed, at most `CAPTION_MAX_LENGTH` characters. `null` means none. */
  caption: string | null;
};

/** A photo chosen in the picker, not yet copied into app storage. */
export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
  mimeType: string | null;
};

export type ImageTexts = { altText: string | null; caption: string | null };

function normalizeText(
  raw: string | null,
  field: 'altText' | 'caption',
  maxLength: number,
): string | null {
  const text = (raw ?? '').trim();
  if (text.length === 0) return null;
  if (text.length > maxLength) throw new InvalidImageTextError(field, 'too_long', maxLength);
  return text;
}

/**
 * Trims both texts and turns an empty one into `null`. Length counts UTF-16 code units.
 *
 * @throws InvalidImageTextError naming the field that is over its limit.
 */
export function normalizeImageTexts(raw: {
  altText: string | null;
  caption: string | null;
}): ImageTexts {
  return {
    altText: normalizeText(raw.altText, 'altText', ALT_TEXT_MAX_LENGTH),
    caption: normalizeText(raw.caption, 'caption', CAPTION_MAX_LENGTH),
  };
}

/**
 * The item with the new photo (when `changes.photo` is set) and texts and `now` as its
 * update time, or `null` when nothing changes: no new photo and trimmed-equal texts.
 * Id, type and creation time stay the same.
 *
 * @throws InvalidImageTextError when a text is over its limit.
 */
export function withImageChanges(
  item: ImageItem,
  changes: { photo: StoredPhoto | null; altText: string | null; caption: string | null },
  now: number,
): ImageItem | null {
  const { altText, caption } = normalizeImageTexts(changes);
  if (!changes.photo && altText === item.altText && caption === item.caption) return null;
  return { ...item, photo: changes.photo ?? item.photo, altText, caption, updatedAt: now };
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/** The file extension for a picked photo: from its MIME type, else its URI, else `jpg`. */
export function photoExtension(photo: Pick<PickedPhoto, 'uri' | 'mimeType'>): string {
  const fromMime = photo.mimeType ? EXTENSION_BY_MIME[photo.mimeType.toLowerCase()] : undefined;
  if (fromMime) return fromMime;
  const fromUri = /\.([a-z0-9]{2,5})$/i.exec(photo.uri.split(/[?#]/)[0])?.[1];
  return fromUri ? fromUri.toLowerCase() : 'jpg';
}
