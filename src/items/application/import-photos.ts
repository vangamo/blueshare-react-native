import type { PhotoStore } from '@/items/domain/ports';

/** A picked file to copy into app storage under `file`. */
export type PhotoCopy = { sourceUri: string; file: string };

/**
 * Copies the photos one after another (simple rollback, no memory spike with large
 * originals). If a copy fails, the copies already made are removed and the error is
 * rethrown.
 */
export async function importPhotos(store: PhotoStore, copies: readonly PhotoCopy[]): Promise<void> {
  const done: string[] = [];
  try {
    for (const copy of copies) {
      await store.importPhoto(copy.sourceUri, copy.file);
      done.push(copy.file);
    }
  } catch (error) {
    await removePhotos(store, done);
    throw error;
  }
}

/** Removes copies made for a save that failed. Best effort: a failed removal is ignored. */
export async function removePhotos(store: PhotoStore, files: readonly string[]): Promise<void> {
  for (const file of files) await store.removePhoto(file).catch(() => undefined);
}
