import { ALT_TEXT_MAX_LENGTH, CAPTION_MAX_LENGTH } from '@/constants/limits';
import {
  normalizeImageTexts,
  withImageChanges,
  type ImageItem,
} from '@/items/domain/image-item';

const item: ImageItem = {
  id: 'id-1',
  type: 'image',
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  photo: { file: 'a.jpg', width: 400, height: 300 },
  altText: 'Una playa',
  caption: 'Verano',
};

describe('normalizeImageTexts', () => {
  test('trims both texts', () => {
    expect(normalizeImageTexts({ altText: '  Una playa \n', caption: ' Verano ' })).toEqual({
      altText: 'Una playa',
      caption: 'Verano',
    });
  });

  test.each(['', '   ', '\n\t '])('turns %j into null', (blank) => {
    expect(normalizeImageTexts({ altText: blank, caption: blank })).toEqual({
      altText: null,
      caption: null,
    });
  });

  test('accepts exactly the limits', () => {
    const altText = 'a'.repeat(ALT_TEXT_MAX_LENGTH);
    const caption = 'b'.repeat(CAPTION_MAX_LENGTH);
    expect(normalizeImageTexts({ altText, caption })).toEqual({ altText, caption });
  });

  test('rejects one character over the alternative text limit, naming the field', () => {
    expect(() =>
      normalizeImageTexts({ altText: 'a'.repeat(ALT_TEXT_MAX_LENGTH + 1), caption: null }),
    ).toThrow(
      expect.objectContaining({
        name: 'InvalidImageTextError',
        field: 'altText',
        reason: 'too_long',
        maxLength: ALT_TEXT_MAX_LENGTH,
      }),
    );
  });

  test('rejects one character over the caption limit, naming the field', () => {
    expect(() =>
      normalizeImageTexts({ altText: null, caption: 'b'.repeat(CAPTION_MAX_LENGTH + 1) }),
    ).toThrow(expect.objectContaining({ field: 'caption', maxLength: CAPTION_MAX_LENGTH }));
  });
});

describe('withImageChanges', () => {
  test('returns null for the same photo and trimmed-equal texts', () => {
    expect(
      withImageChanges(item, { photo: null, altText: ' Una playa ', caption: 'Verano  ' }, 2000),
    ).toBeNull();
  });

  test('returns the changed item with the new update time, keeping id, type and creation', () => {
    const changed = withImageChanges(item, { photo: null, altText: 'Una cala', caption: 'Verano' }, 2000);
    expect(changed).toEqual({ ...item, altText: 'Una cala', updatedAt: 2000 });
  });

  test('a new photo is a change even with the same texts', () => {
    const photo = { file: 'b.jpg', width: 100, height: 200 };
    const changed = withImageChanges(item, { photo, altText: 'Una playa', caption: 'Verano' }, 2000);
    expect(changed).toMatchObject({ photo, updatedAt: 2000, createdAt: 1000, id: 'id-1', type: 'image' });
  });

  test('clearing a text counts as a change', () => {
    const changed = withImageChanges(item, { photo: null, altText: '  ', caption: 'Verano' }, 2000);
    expect(changed).toMatchObject({ altText: null, caption: 'Verano' });
  });

  test('adding only whitespace to an empty text is not a change', () => {
    const bare = { ...item, altText: null, caption: null };
    expect(withImageChanges(bare, { photo: null, altText: '   ', caption: '' }, 2000)).toBeNull();
  });

  test('rejects an over-long text', () => {
    expect(() =>
      withImageChanges(item, { photo: null, altText: 'a'.repeat(ALT_TEXT_MAX_LENGTH + 1), caption: null }, 2000),
    ).toThrow(expect.objectContaining({ name: 'InvalidImageTextError' }));
  });
});
