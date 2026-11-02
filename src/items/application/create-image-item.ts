import {
  normalizeImageTexts,
  photoExtension,
  type ImageItem,
  type PickedPhoto,
} from '@/items/domain/image-item';

import type { ImageUseCaseDeps } from './deps';

export type CreateImageInput = {
  photo: PickedPhoto;
  altText: string | null;
  caption: string | null;
};

/**
 * Creates an image item: copies the picked photo into app storage, then stores the item.
 * If storing fails, the copy is removed (best effort) and the error is rethrown.
 *
 * @throws InvalidImageTextError for an over-long text, before any file is copied.
 */
export function createImageItem({ repository, clock, ids, photos }: ImageUseCaseDeps) {
  return async ({ photo, altText, caption }: CreateImageInput): Promise<ImageItem> => {
    const texts = normalizeImageTexts({ altText, caption });
    const now = clock.now();
    const id = ids.newId();
    const file = `${ids.newId()}.${photoExtension(photo)}`;
    const item: ImageItem = {
      id,
      type: 'image',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      photo: { file, width: photo.width, height: photo.height },
      ...texts,
    };
    await photos.importPhoto(photo.uri, file);
    try {
      await repository.saveImage(item);
    } catch (error) {
      await photos.removePhoto(file).catch(() => undefined);
      throw error;
    }
    return item;
  };
}
