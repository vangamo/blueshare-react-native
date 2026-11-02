import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { NodePhotoStore, writeFixturePhoto } from '@/test-utils/node-photo-store';

describe('NodePhotoStore', () => {
  test('import copies the bytes under the given name and creates the folder', async () => {
    const store = new NodePhotoStore();
    const source = writeFixturePhoto();
    expect(existsSync(store.folder)).toBe(false);

    await store.importPhoto(source, 'abc.png');

    expect(existsSync(store.folder)).toBe(true);
    expect(readFileSync(store.uriFor('abc.png'))).toEqual(readFileSync(source));
    expect(existsSync(source)).toBe(true);
  });

  test('removePhoto deletes the file and ignores a missing one', async () => {
    const store = new NodePhotoStore();
    await store.importPhoto(writeFixturePhoto(), 'abc.png');

    await store.removePhoto('abc.png');
    expect(store.has('abc.png')).toBe(false);
    await expect(store.removePhoto('abc.png')).resolves.toBeUndefined();
    await expect(store.removePhoto('never.png')).resolves.toBeUndefined();
  });

  test('uriFor points inside the folder', () => {
    const store = new NodePhotoStore();
    expect(dirname(store.uriFor('abc.png'))).toBe(store.folder);
  });

  test('each instance has its own folder', () => {
    expect(new NodePhotoStore().folder).not.toBe(new NodePhotoStore().folder);
  });

  test('the Jest app adapters include a photo store', async () => {
    const { photos } = createAppAdapters();
    await photos.importPhoto(writeFixturePhoto(), 'x.png');
    expect(existsSync(photos.uriFor('x.png'))).toBe(true);
  });
});
