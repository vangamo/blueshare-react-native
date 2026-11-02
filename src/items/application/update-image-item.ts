import { ItemNotFoundError } from '@/items/domain/errors';
import {
  normalizeImageTexts,
  photoExtension,
  withImageChanges,
  type ImageItem,
  type PickedPhoto,
} from '@/items/domain/image-item';

import type { ImageUseCaseDeps } from './deps';

export type UpdateImageInput = {
  /** A photo chosen in the edit dialog, or `null` to keep the stored one. */
  newPhoto: PickedPhoto | null;
  altText: string | null;
  caption: string | null;
};

/**
 * Applies the edits to a stored image item. A new photo is copied under a new name; the
 * old file stays, because history points to it. Returns the stored item: the updated
 * one, or the current one (nothing written, nothing copied) when nothing changed.
 * If storing fails, only the new copy is removed.
 *
 * @throws InvalidImageTextError for an over-long text, before any file is copied.
 * @throws ItemNotFoundError when no live item has this id.
 */
export function updateImageItem({ repository, clock, ids, photos }: ImageUseCaseDeps) {
  return async (id: string, { newPhoto, altText, caption }: UpdateImageInput): Promise<ImageItem> => {
    const current = await repository.findImage(id);
    if (!current) throw new ItemNotFoundError(id);
    normalizeImageTexts({ altText, caption });
    const file = newPhoto ? `${ids.newId()}.${photoExtension(newPhoto)}` : null;
    const updated = withImageChanges(
      current,
      {
        photo: newPhoto && file ? { file, width: newPhoto.width, height: newPhoto.height } : null,
        altText,
        caption,
      },
      clock.now(),
    );
    if (!updated) return current;
    if (newPhoto && file) await photos.importPhoto(newPhoto.uri, file);
    try {
      await repository.updateImage(updated);
    } catch (error) {
      if (file) await photos.removePhoto(file).catch(() => undefined);
      throw error;
    }
    return updated;
  };
}
