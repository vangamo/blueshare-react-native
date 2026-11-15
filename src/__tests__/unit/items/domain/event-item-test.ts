import {
  EVENT_CATEGORY_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_MAX_PHOTOS,
  EVENT_TITLE_MAX_LENGTH,
} from '@/constants/limits';
import {
  checkPhotoCount,
  normalizeEventTexts,
  withEventChanges,
  type EventItem,
} from '@/items/domain/event-item';
import type { StoredPhoto } from '@/items/domain/image-item';

const photo = (file: string): StoredPhoto => ({ file, width: 400, height: 300 });
const [A, B, C] = [photo('a.jpg'), photo('b.jpg'), photo('c.jpg')];

const item: EventItem = {
  id: 'id-1',
  type: 'event',
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  title: 'Viaje',
  category: 'Familia',
  description: 'Lo pasamos genial',
  photos: [A, B],
};

const same = { title: 'Viaje', category: 'Familia', description: 'Lo pasamos genial', photos: [A, B] };

describe('normalizeEventTexts', () => {
  test('trims all three texts', () => {
    expect(
      normalizeEventTexts({ title: '  Viaje  ', category: ' Familia ', description: '\n Genial \t' }),
    ).toEqual({ title: 'Viaje', category: 'Familia', description: 'Genial' });
  });

  test.each(['', '   ', '\n\t ', null])('turns the description %j into null', (blank) => {
    expect(normalizeEventTexts({ title: 'Viaje', category: 'Familia', description: blank })).toEqual({
      title: 'Viaje',
      category: 'Familia',
      description: null,
    });
  });

  test.each([
    ['title', { title: '   ', category: 'Familia', description: null }],
    ['category', { title: 'Viaje', category: ' \n ', description: null }],
  ] as const)('rejects a blank %s, naming the field', (field, raw) => {
    expect(() => normalizeEventTexts(raw)).toThrow(
      expect.objectContaining({ name: 'InvalidEventError', field, reason: 'blank' }),
    );
  });

  test('accepts exactly the limits', () => {
    const raw = {
      title: 't'.repeat(EVENT_TITLE_MAX_LENGTH),
      category: 'c'.repeat(EVENT_CATEGORY_MAX_LENGTH),
      description: 'd'.repeat(EVENT_DESCRIPTION_MAX_LENGTH),
    };
    expect(normalizeEventTexts(raw)).toEqual(raw);
    expect([EVENT_TITLE_MAX_LENGTH, EVENT_CATEGORY_MAX_LENGTH, EVENT_DESCRIPTION_MAX_LENGTH]).toEqual([
      120, 24, 2000,
    ]);
  });

  test.each([
    ['title', EVENT_TITLE_MAX_LENGTH],
    ['category', EVENT_CATEGORY_MAX_LENGTH],
    ['description', EVENT_DESCRIPTION_MAX_LENGTH],
  ] as const)('rejects one character over the %s limit, naming the field', (field, limit) => {
    const raw = { title: 'Viaje', category: 'Familia', description: null as string | null };
    raw[field] = 'x'.repeat(limit + 1);
    expect(() => normalizeEventTexts(raw)).toThrow(
      expect.objectContaining({ name: 'InvalidEventError', field, reason: 'too_long', limit }),
    );
  });
});

describe('checkPhotoCount', () => {
  test.each([1, EVENT_MAX_PHOTOS])('accepts %i photos', (count) => {
    expect(() => checkPhotoCount(count)).not.toThrow();
  });

  test('rejects no photo', () => {
    expect(() => checkPhotoCount(0)).toThrow(
      expect.objectContaining({ name: 'InvalidEventError', field: 'photos', reason: 'too_few' }),
    );
  });

  test('rejects one photo over the limit', () => {
    expect(EVENT_MAX_PHOTOS).toBe(10);
    expect(() => checkPhotoCount(EVENT_MAX_PHOTOS + 1)).toThrow(
      expect.objectContaining({ field: 'photos', reason: 'too_many', limit: EVENT_MAX_PHOTOS }),
    );
  });
});

describe('withEventChanges', () => {
  test('returns null for the same files in the same order and trimmed-equal texts', () => {
    expect(
      withEventChanges(
        item,
        { ...same, title: 'Viaje  ', category: ' Familia', photos: [{ ...A }, { ...B }] },
        2000,
      ),
    ).toBeNull();
  });

  test('adding only whitespace to an empty description is not a change', () => {
    const bare = { ...item, description: null };
    expect(withEventChanges(bare, { ...same, description: '   ' }, 2000)).toBeNull();
  });

  test.each([
    ['a reordered photo list', { photos: [B, A] }],
    ['a removed photo', { photos: [A] }],
    ['an added photo', { photos: [A, B, C] }],
    ['a replaced photo', { photos: [A, C] }],
    ['a changed title', { title: 'Viaje a Cádiz' }],
    ['a changed category', { category: 'Amigos' }],
    ['a changed description', { description: 'Otro día' }],
    ['a cleared description', { description: '  ' }],
  ])('%s gives the changed item with the new update time', (_name, change) => {
    const changes = { ...same, ...change };
    const changed = withEventChanges(item, changes, 2000);
    expect(changed).toEqual({
      ...item,
      title: changes.title.trim(),
      category: changes.category.trim(),
      description: changes.description.trim() || null,
      photos: changes.photos,
      updatedAt: 2000,
    });
    expect(changed).toMatchObject({ id: 'id-1', type: 'event', createdAt: 1000 });
  });

  test('rejects no photo and a blank title', () => {
    expect(() => withEventChanges(item, { ...same, photos: [] }, 2000)).toThrow(
      expect.objectContaining({ field: 'photos', reason: 'too_few' }),
    );
    expect(() => withEventChanges(item, { ...same, title: ' ' }, 2000)).toThrow(
      expect.objectContaining({ field: 'title', reason: 'blank' }),
    );
  });
});
