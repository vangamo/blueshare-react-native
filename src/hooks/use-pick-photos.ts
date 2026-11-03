import { launchImageLibraryAsync } from 'expo-image-picker';

import type { PickedPhoto } from '@/items/domain/image-item';

import { toPickedPhoto } from './to-picked-photo';

/**
 * Opens the system photo picker with multiple selection (images only, no permission
 * prompt) and resolves to the chosen photos in the picker's order, or `[]` when the user
 * cancels. Errors from the picker are thrown to the caller, which shows the gallery message.
 *
 * Call it only with `max >= 1`: the picker reads a `selectionLimit` of `0` as the system
 * maximum. Some pickers ignore the limit, so callers keep only the first photos they can hold.
 */
export function usePickPhotos(): (max: number) => Promise<PickedPhoto[]> {
  return async (max) => {
    const result = await launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      selectionLimit: max,
      orderedSelection: true,
      quality: 1,
      exif: false,
    });
    if (result.canceled) return [];
    const photos: PickedPhoto[] = [];
    // One at a time: a decode fallback for ten large photos at once could use a lot of memory.
    for (const asset of result.assets) photos.push(await toPickedPhoto(asset));
    return photos;
  };
}
