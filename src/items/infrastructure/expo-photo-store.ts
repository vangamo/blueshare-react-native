import { Directory, File, Paths } from 'expo-file-system';

import type { PhotoStore } from '@/items/domain/ports';

/**
 * `PhotoStore` over `expo-file-system`: photos live in `<documents>/images/`, a folder
 * the system never clears (unlike the cache, where the picker leaves its files).
 */
export function createExpoPhotoStore(): PhotoStore {
  const folder = new Directory(Paths.document, 'images');
  return {
    async importPhoto(sourceUri, fileName) {
      folder.create({ intermediates: true, idempotent: true });
      await new File(sourceUri).copy(new File(folder, fileName));
    },
    async removePhoto(fileName) {
      const file = new File(folder, fileName);
      if (file.exists) file.delete();
    },
    uriFor: (fileName) => new File(folder, fileName).uri,
  };
}
