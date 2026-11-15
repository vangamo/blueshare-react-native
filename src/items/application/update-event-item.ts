import { ItemNotFoundError } from '@/items/domain/errors';
import { withEventChanges, type EventItem } from '@/items/domain/event-item';
import { photoExtension, type PickedPhoto, type StoredPhoto } from '@/items/domain/image-item';

import type { ImageUseCaseDeps } from './deps';
import { importPhotos, removePhotos, type PhotoCopy } from './import-photos';

/** One photo of the edited list: one the event already holds, or one picked in the dialog. */
export type EventPhotoInput =
  | { kind: 'stored'; photo: StoredPhoto }
  | { kind: 'picked'; photo: PickedPhoto };

export type UpdateEventInput = {
  /** The new photo list, in order. */
  photos: EventPhotoInput[];
  title: string;
  category: string;
  description: string | null;
};

/**
 * Applies the edits to a stored event item. Only the picked photos are copied, each under
 * a new name; removed photos keep their files, because history points to them. Returns
 * the stored item: the updated one, or the current one (nothing written, nothing copied)
 * when nothing changed. If a copy or the save fails, only the new copies are removed.
 *
 * @throws InvalidEventError for a blank or over-long text or a photo count outside 1 to
 * the limit, before any file is copied.
 * @throws ItemNotFoundError when no live event has this id.
 */
export function updateEventItem({ repository, clock, ids, photos: store }: ImageUseCaseDeps) {
  return async (id: string, { photos, title, category, description }: UpdateEventInput): Promise<EventItem> => {
    const current = await repository.findEvent(id);
    if (!current) throw new ItemNotFoundError(id);
    const copies: PhotoCopy[] = [];
    const list: StoredPhoto[] = photos.map((entry) => {
      if (entry.kind === 'stored') return entry.photo;
      const file = `${ids.newId()}.${photoExtension(entry.photo)}`;
      copies.push({ sourceUri: entry.photo.uri, file });
      return { file, width: entry.photo.width, height: entry.photo.height };
    });
    // A new file name never matches a stored one, so any picked photo counts as a change.
    const updated = withEventChanges(current, { photos: list, title, category, description }, clock.now());
    if (!updated) return current;
    await importPhotos(store, copies);
    try {
      await repository.updateEvent(updated);
    } catch (error) {
      await removePhotos(
        store,
        copies.map((copy) => copy.file),
      );
      throw error;
    }
    return updated;
  };
}
