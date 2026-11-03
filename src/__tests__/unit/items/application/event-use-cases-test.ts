import { EVENT_MAX_PHOTOS, EVENT_TITLE_MAX_LENGTH } from '@/constants/limits';
import { createEventItem } from '@/items/application/create-event-item';
import { updateEventItem, type EventPhotoInput } from '@/items/application/update-event-item';
import { InvalidEventError, ItemNotFoundError } from '@/items/domain/errors';
import type { EventItem } from '@/items/domain/event-item';
import type { PickedPhoto } from '@/items/domain/image-item';
import type { PhotoStore } from '@/items/domain/ports';
import { migrate } from '@/items/infrastructure/migrations';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodePhotoStore, writeFixturePhoto } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

const NOW = 1_700_000_000_000;

function picked(overrides: Partial<PickedPhoto> = {}): PickedPhoto {
  return { uri: writeFixturePhoto(), width: 400, height: 300, mimeType: 'image/png', ...overrides };
}

const texts = { title: 'Viaje', category: 'Familia', description: null };

/** A photo store whose `failOn`-th import throws (1-based). */
class FailingPhotoStore extends NodePhotoStore {
  private imports = 0;
  constructor(private readonly failOn: number) {
    super();
  }

  override async importPhoto(sourceUri: string, fileName: string): Promise<void> {
    if (++this.imports === this.failOn) throw new Error('Injected copy failure');
    return super.importPhoto(sourceUri, fileName);
  }
}

async function setup({
  wrap = (db: SqlDatabase) => db,
  photos = new NodePhotoStore(),
}: { wrap?: (db: SqlDatabase) => SqlDatabase; photos?: NodePhotoStore } = {}) {
  const db = new NodeSqlDatabase();
  await migrate(db);
  const deps = {
    repository: new SqliteItemRepository(wrap(db)),
    clock: fixedClock(NOW, 1),
    ids: sequentialIds(),
    photos,
  };
  const reader = new SqliteItemRepository(db);
  return { db, photos, reader, create: createEventItem(deps), update: updateEventItem(deps) };
}

const stored = (item: EventItem): EventPhotoInput[] =>
  item.photos.map((photo) => ({ kind: 'stored', photo }));

describe('createEventItem', () => {
  test('copies each photo under its own name and stores rows that point to them in order', async () => {
    const { photos, reader, create } = await setup();
    const item = await create({
      photos: [picked(), picked({ width: 10, height: 20, mimeType: 'image/jpeg' }), picked()],
      title: '  Tarde de juegos  ',
      category: ' Encuentro ',
      description: '   ',
    });

    expect(item).toEqual({
      id: 'id-1',
      type: 'event',
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
      title: 'Tarde de juegos',
      category: 'Encuentro',
      description: null,
      photos: [
        { file: 'id-2.png', width: 400, height: 300 },
        { file: 'id-3.jpg', width: 10, height: 20 },
        { file: 'id-4.png', width: 400, height: 300 },
      ],
    });
    expect(['id-2.png', 'id-3.jpg', 'id-4.png'].every((file) => photos.has(file))).toBe(true);
    expect(await reader.findEvent('id-1')).toEqual(item);
  });

  test('the same picked photo twice gives two files', async () => {
    const { photos, create } = await setup();
    const same = picked();
    const item = await create({ ...texts, photos: [same, same] });

    expect(item.photos.map((photo) => photo.file)).toEqual(['id-2.png', 'id-3.png']);
    expect(photos.has('id-2.png') && photos.has('id-3.png')).toBe(true);
  });

  test.each([
    ['a blank title', { ...texts, title: '  ', photos: [picked()] }],
    ['an over-long title', { ...texts, title: 't'.repeat(EVENT_TITLE_MAX_LENGTH + 1), photos: [picked()] }],
    ['no photo', { ...texts, photos: [] }],
    ['11 photos', { ...texts, photos: Array.from({ length: EVENT_MAX_PHOTOS + 1 }, () => picked()) }],
  ])('%s is rejected before any file is copied', async (_name, input) => {
    const { photos, db, create } = await setup();
    const importPhoto = jest.spyOn(photos as PhotoStore, 'importPhoto');

    await expect(create(input)).rejects.toBeInstanceOf(InvalidEventError);

    expect(importPhoto).not.toHaveBeenCalled();
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('10 photos are accepted', async () => {
    const { create } = await setup();
    const item = await create({ ...texts, photos: Array.from({ length: EVENT_MAX_PHOTOS }, () => picked()) });
    expect(item.photos).toHaveLength(EVENT_MAX_PHOTOS);
  });

  test('a failing third copy removes the first two and rethrows', async () => {
    const { photos, db, create } = await setup({ photos: new FailingPhotoStore(3) });

    await expect(create({ ...texts, photos: [picked(), picked(), picked()] })).rejects.toThrow(
      /Injected copy failure/,
    );

    expect(['id-2.png', 'id-3.png', 'id-4.png'].some((file) => photos.has(file))).toBe(false);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('a failing insert removes every copy and rethrows', async () => {
    const { photos, db, create } = await setup({
      wrap: (db) => new FailingSqlDatabase(db, (sql) => sql.includes('INSERT INTO event_item_photos')),
    });

    await expect(create({ ...texts, photos: [picked(), picked()] })).rejects.toThrow(
      /Injected failure/,
    );

    expect(photos.has('id-2.png') || photos.has('id-3.png')).toBe(false);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });
});

describe('updateEventItem', () => {
  test('the same stored photos and trimmed-equal texts write and copy nothing', async () => {
    const { db, photos, reader, create, update } = await setup();
    const item = await create({ ...texts, photos: [picked(), picked()] });
    const importPhoto = jest.spyOn(photos as PhotoStore, 'importPhoto');

    const result = await update(item.id, {
      photos: stored(item),
      title: ' Viaje ',
      category: 'Familia  ',
      description: '  ',
    });

    expect(result).toEqual(item);
    expect(await reader.findEvent(item.id)).toEqual(item);
    expect(importPhoto).not.toHaveBeenCalled();
    expect(await db.getAll('SELECT item_id FROM items_history')).toEqual([]);
  });

  test('copies only the picked photos and keeps the files of removed ones', async () => {
    const { photos, reader, create, update } = await setup();
    const item = await create({ ...texts, photos: [picked(), picked(), picked()] });
    const [first, second, third] = item.photos;
    const importPhoto = jest.spyOn(photos as PhotoStore, 'importPhoto');

    const result = await update(item.id, {
      ...texts,
      photos: [
        { kind: 'stored', photo: third },
        { kind: 'picked', photo: picked({ mimeType: 'image/jpeg', width: 5, height: 6 }) },
        { kind: 'stored', photo: first },
      ],
    });

    expect(importPhoto).toHaveBeenCalledTimes(1);
    expect(result.photos).toEqual([third, { file: 'id-5.jpg', width: 5, height: 6 }, first]);
    expect(result).toMatchObject({ id: item.id, createdAt: NOW, updatedAt: NOW + 1 });
    expect(await reader.findEvent(item.id)).toEqual(result);
    expect([first, second, third].every((photo) => photos.has(photo.file))).toBe(true);
    expect(photos.has('id-5.jpg')).toBe(true);
  });

  test('a failing write removes only the new copies', async () => {
    const { db, photos, reader, create } = await setup();
    const item = await create({ ...texts, photos: [picked()] });
    const failing = updateEventItem({
      repository: new SqliteItemRepository(
        new FailingSqlDatabase(db, (sql) => sql.includes('UPDATE event_items')),
      ),
      clock: fixedClock(NOW + 100, 1),
      ids: sequentialIds('next-'),
      photos,
    });

    await expect(
      failing(item.id, {
        ...texts,
        photos: [...stored(item), { kind: 'picked', photo: picked() }, { kind: 'picked', photo: picked() }],
      }),
    ).rejects.toThrow(/Injected failure/);

    expect(photos.has('next-1.png') || photos.has('next-2.png')).toBe(false);
    expect(photos.has(item.photos[0].file)).toBe(true);
    expect(await reader.findEvent(item.id)).toEqual(item);
  });

  test('removing every photo is rejected and changes nothing', async () => {
    const { reader, create, update } = await setup();
    const item = await create({ ...texts, photos: [picked()] });

    await expect(update(item.id, { ...texts, photos: [] })).rejects.toBeInstanceOf(InvalidEventError);
    expect(await reader.findEvent(item.id)).toEqual(item);
  });

  test('an unknown id throws ItemNotFoundError', async () => {
    const { update } = await setup();
    await expect(update('zzz', { ...texts, photos: [] })).rejects.toBeInstanceOf(ItemNotFoundError);
  });
});
