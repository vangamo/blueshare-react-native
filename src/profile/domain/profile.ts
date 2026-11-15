import { PROFILE_NAME_MAX_LENGTH } from '@/constants/limits';
import type { PickedPhoto, StoredPhoto } from '@/items/domain/image-item';

import { InvalidProfileError } from './errors';

/** The user's own profile. Times are UTC milliseconds. */
export type Profile = {
  /** Random version 4 UUID created on the first launch. Never changes. */
  id: string;
  /** Trimmed, 1 to `PROFILE_NAME_MAX_LENGTH` characters. `null` until the user saves one. */
  name: string | null;
  avatar: StoredPhoto | null;
  createdAt: number;
  updatedAt: number;
};

/** What the user did with the avatar in the dialog. */
export type AvatarInput =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'picked'; photo: PickedPhoto };

/**
 * Trims the name. Length counts UTF-16 code units.
 *
 * @throws InvalidProfileError when the name is empty or over the limit.
 */
export function normalizeProfileName(raw: string): string {
  const name = raw.trim();
  if (name.length === 0) throw new InvalidProfileError('name', 'empty');
  if (name.length > PROFILE_NAME_MAX_LENGTH) {
    throw new InvalidProfileError('name', 'too_long', PROFILE_NAME_MAX_LENGTH);
  }
  return name;
}

/**
 * @throws InvalidProfileError when the picked photo has no positive, finite size.
 */
export function checkAvatar(photo: Pick<PickedPhoto, 'width' | 'height'>): void {
  const valid = (n: number) => Number.isFinite(n) && n > 0;
  if (!valid(photo.width) || !valid(photo.height)) {
    throw new InvalidProfileError('avatar', 'invalid');
  }
}

/**
 * The profile with the new name and avatar and `now` as its update time, or `current`
 * itself when nothing changes: a trimmed-equal name and the same photo. A picked photo
 * always counts as a change. `avatar` is the stored copy of a picked photo, `undefined`
 * to keep, or `null` to remove.
 */
export function withProfileChanges(
  current: Profile,
  changes: { name: string; avatar: StoredPhoto | null | undefined },
  now: number,
): Profile {
  const avatar = changes.avatar === undefined ? current.avatar : changes.avatar;
  if (changes.name === current.name && avatar?.file === current.avatar?.file) return current;
  return { ...current, name: changes.name, avatar, updatedAt: now };
}
