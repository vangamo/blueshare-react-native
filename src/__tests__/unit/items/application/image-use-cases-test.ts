import { ALT_TEXT_MAX_LENGTH } from '@/constants/limits';
import { createImageItem } from '@/items/application/create-image-item';
import { updateImageItem } from '@/items/application/update-image-item';
import { InvalidImageTextError, ItemNotFoundError } from '@/items/domain/errors';
import { photoExtension, type PickedPhoto } from '@/items/domain/image-item';
import { migrate } from '@/items/infrastructure/migrations';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodePhotoStore, writeFixturePhoto } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';

const NOW = 1_700_000_000_000;

function picked(overrides: Partial<PickedPhoto> = {}): PickedPhoto {
  return { uri: writeFixturePhoto(), width: 400, height: 300, mimeType: 'image/png', ...overrides };
}

async function setup(wrap: (db: SqlDatabase) => SqlDatabase = (db) => db) {
  const db = new NodeSqlDatabase();
  await migrate(db);
  const photos = new NodePhotoStore();
  const deps = {
    repository: new SqliteItemRepository(wrap(db)),
    clock: fixedClock(NOW, 1),
    ids: sequentialIds(),
    photos,
  };
  const reader = new SqliteItemRepository(db);
  return { db, photos, reader, create: createImageItem(deps), update: updateImageItem(deps) };
}

describe('createImageItem', () => {
  test('copies the photo under <id>.<ext> and stores a row that points to it', async () => {
    const { photos, reader, create } = await setup();
    const item = await create({ photo: picked(), altText: ' Una playa ', caption: '' });

    expect(item).toEqual({
      id: 'id-1',
      type: 'image',
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
      photo: { file: 'id-2.png', width: 400, height: 300 },
      altText: 'Una playa',
      caption: null,
    });
    expect(photos.has('id-2.png')).toBe(true);
    expect(await reader.findImage('id-1')).toEqual(item);
  });

  test('validates the texts before copying any file', async () => {
    const { photos, db, create } = await setup();
    await expect(
      create({ photo: picked(), altText: 'a'.repeat(ALT_TEXT_MAX_LENGTH + 1), caption: null }),
    ).rejects.toBeInstanceOf(InvalidImageTextError);

    expect(photos.has('id-2.png')).toBe(false);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('a failing insert removes the copied file and rethrows the error', async () => {
    const { photos, create } = await setup(
      (db) => new FailingSqlDatabase(db, (sql) => sql.includes('INSERT INTO image_items')),
    );

    await expect(create({ photo: picked(), altText: null, caption: null })).rejects.toThrow(
      /Injected failure/,
    );

    expect(photos.has('id-2.png')).toBe(false);
  });
});

describe('updateImageItem', () => {
  test('the same photo and trimmed-equal texts write and copy nothing', async () => {
    const { photos, reader, create, update } = await setup();
    const item = await create({ photo: picked(), altText: 'Una playa', caption: 'Verano' });

    const result = await update(item.id, { newPhoto: null, altText: ' Una playa ', caption: 'Verano ' });

    expect(result).toEqual(item);
    expect(await reader.findImage(item.id)).toEqual(item);
    expect(photos.has('id-3.png')).toBe(false);
  });

  test('a new photo is copied under a new name and the old file stays', async () => {
    const { photos, reader, create, update } = await setup();
    const item = await create({ photo: picked(), altText: null, caption: null });

    const result = await update(item.id, {
      newPhoto: picked({ width: 10, height: 20, mimeType: 'image/jpeg' }),
      altText: null,
      caption: null,
    });

    expect(result.photo).toEqual({ file: 'id-3.jpg', width: 10, height: 20 });
    expect(photos.has('id-3.jpg')).toBe(true);
    expect(photos.has('id-2.png')).toBe(true);
    expect(await reader.findImage(item.id)).toEqual(result);
  });

  test('a failing write removes only the new copy', async () => {
    const { db, photos, create } = await setup();
    const item = await create({ photo: picked(), altText: null, caption: null });
    const failing = updateImageItem({
      repository: new SqliteItemRepository(
        new FailingSqlDatabase(db, (sql) => sql.includes('UPDATE image_items')),
      ),
      clock: fixedClock(NOW + 100, 1),
      ids: sequentialIds('next-'),
      photos,
    });

    await expect(failing(item.id, { newPhoto: picked(), altText: 'x', caption: null })).rejects.toThrow(
      /Injected failure/,
    );

    expect(photos.has('next-1.png')).toBe(false);
    expect(photos.has('id-2.png')).toBe(true);
  });

  test('an unknown id throws ItemNotFoundError', async () => {
    const { update } = await setup();
    await expect(update('zzz', { newPhoto: null, altText: null, caption: null })).rejects.toBeInstanceOf(
      ItemNotFoundError,
    );
  });

  test('over-long texts are rejected before copying', async () => {
    const { photos, create, update } = await setup();
    const item = await create({ photo: picked(), altText: null, caption: null });

    await expect(
      update(item.id, { newPhoto: picked(), altText: 'a'.repeat(ALT_TEXT_MAX_LENGTH + 1), caption: null }),
    ).rejects.toBeInstanceOf(InvalidImageTextError);
    expect(photos.has('id-3.png')).toBe(false);
  });
});

describe('photoExtension', () => {
  test.each([
    [{ uri: 'file:///a/b.bin', mimeType: 'image/png' }, 'png'],
    [{ uri: 'file:///a/b.bin', mimeType: 'image/JPEG' }, 'jpg'],
    [{ uri: 'file:///a/photo.HEIC?x=1', mimeType: null }, 'heic'],
    [{ uri: 'content://media/external/images/42', mimeType: null }, 'jpg'],
    [{ uri: 'file:///a/b.xyz', mimeType: 'application/unknown' }, 'xyz'],
  ])('%j gives %s', (photo, extension) => {
    expect(photoExtension(photo)).toBe(extension);
  });
});
