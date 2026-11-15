import { checkPhotoCount, normalizeEventTexts, type EventItem } from '@/items/domain/event-item';
import { photoExtension, type PickedPhoto } from '@/items/domain/image-item';

import type { ImageUseCaseDeps } from './deps';
import { importPhotos, removePhotos, type PhotoCopy } from './import-photos';

export type CreateEventInput = {
  /** In the order they are shown. */
  photos: PickedPhoto[];
  title: string;
  category: string;
  description: string | null;
};

/**
 * Creates an event item: copies each picked photo into app storage under a new name, in
 * order, then stores the item. If a copy or the save fails, every copy made is removed
 * (best effort) and the error is rethrown.
 *
 * @throws InvalidEventError for a blank or over-long text or a photo count outside 1 to
 * the limit, before any file is copied.
 */
export function createEventItem({ repository, clock, ids, photos: store }: ImageUseCaseDeps) {
  return async ({ photos, title, category, description }: CreateEventInput): Promise<EventItem> => {
    const texts = normalizeEventTexts({ title, category, description });
    checkPhotoCount(photos.length);
    const now = clock.now();
    const id = ids.newId();
    const copies: PhotoCopy[] = photos.map((photo) => ({
      sourceUri: photo.uri,
      file: `${ids.newId()}.${photoExtension(photo)}`,
    }));
    const item: EventItem = {
      id,
      type: 'event',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      ...texts,
      photos: photos.map((photo, index) => ({
        file: copies[index].file,
        width: photo.width,
        height: photo.height,
      })),
    };
    await importPhotos(store, copies);
    try {
      await repository.saveEvent(item);
    } catch (error) {
      await removePhotos(
        store,
        copies.map((copy) => copy.file),
      );
      throw error;
    }
    return item;
  };
}
