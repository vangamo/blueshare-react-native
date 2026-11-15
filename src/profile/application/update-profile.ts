import { importPhotos, removePhotos } from '@/items/application/import-photos';
import { photoExtension } from '@/items/domain/image-item';
import { InvalidProfileError } from '@/profile/domain/errors';
import {
  checkAvatar,
  normalizeProfileName,
  withProfileChanges,
  type AvatarInput,
  type Profile,
} from '@/profile/domain/profile';

import type { ProfileUseCaseDeps } from './deps';

export type UpdateProfileInput = { name: string; avatar: AvatarInput };

/**
 * Saves the name and the avatar. In order: normalize the name, check a picked photo,
 * return `current` when nothing changes, copy a picked photo, store. A failed store removes
 * the new copy. Replaced avatar files are kept, because history points to them.
 *
 * @throws InvalidProfileError for an empty or over-long name, a photo with no valid size
 * or a copy that fails, before anything is stored.
 */
export function updateProfile({ repository, clock, ids, photos }: ProfileUseCaseDeps) {
  return async (current: Profile, { name: rawName, avatar }: UpdateProfileInput): Promise<Profile> => {
    const name = normalizeProfileName(rawName);
    if (avatar.kind === 'picked') checkAvatar(avatar.photo);

    if (avatar.kind !== 'picked') {
      const next = withProfileChanges(
        current,
        { name, avatar: avatar.kind === 'remove' ? null : undefined },
        clock.now(),
      );
      if (next === current) return current;
      await repository.updateMe(next);
      return next;
    }

    const { photo } = avatar;
    const file = `${ids.newId()}.${photoExtension(photo)}`;
    try {
      await importPhotos(photos, [{ sourceUri: photo.uri, file }]);
    } catch {
      throw new InvalidProfileError('avatar', 'copy_failed');
    }
    const next = withProfileChanges(
      current,
      { name, avatar: { file, width: photo.width, height: photo.height } },
      clock.now(),
    );
    try {
      await repository.updateMe(next);
    } catch (error) {
      await removePhotos(photos, [file]);
      throw error;
    }
    return next;
  };
}
