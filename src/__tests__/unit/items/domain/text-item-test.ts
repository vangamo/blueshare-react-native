import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { InvalidTextError } from '@/items/domain/errors';
import { normalizeTextBody, withNewText, type TextItem } from '@/items/domain/text-item';

describe('normalizeTextBody', () => {
  test('trims leading and trailing whitespace and keeps inner line breaks', () => {
    expect(normalizeTextBody('\n  Hola\nabuela  \n')).toBe('Hola\nabuela');
  });

  test.each(['', '   ', '\n\t \n'])('rejects blank text %j', (raw) => {
    expect(() => normalizeTextBody(raw)).toThrow(InvalidTextError);
  });

  test('accepts exactly TEXT_MAX_LENGTH characters', () => {
    const raw = 'a'.repeat(TEXT_MAX_LENGTH);
    expect(normalizeTextBody(raw)).toBe(raw);
  });

  test('rejects one character more than TEXT_MAX_LENGTH', () => {
    expect(() => normalizeTextBody('a'.repeat(TEXT_MAX_LENGTH + 1))).toThrow(
      expect.objectContaining({ name: 'InvalidTextError', reason: 'too_long' }),
    );
  });

  test('measures the length after trimming', () => {
    const raw = `  ${'a'.repeat(TEXT_MAX_LENGTH)}  `;
    expect(normalizeTextBody(raw)).toHaveLength(TEXT_MAX_LENGTH);
  });
});

describe('withNewText', () => {
  const item: TextItem = {
    id: 'a',
    type: 'text',
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
    body: 'Hola',
  };

  test('trims, and keeps id and creation time while setting the update time', () => {
    expect(withNewText(item, '  Hola, abuela \n', 2000)).toEqual({
      ...item,
      body: 'Hola, abuela',
      updatedAt: 2000,
    });
  });

  test('returns null when the trimmed text is unchanged', () => {
    expect(withNewText(item, '  Hola \n', 2000)).toBeNull();
  });

  test.each(['', '  \n'])('rejects blank text %j', (raw) => {
    expect(() => withNewText(item, raw, 2000)).toThrow(InvalidTextError);
  });

  test('accepts the maximum length and rejects one more', () => {
    expect(withNewText(item, 'a'.repeat(TEXT_MAX_LENGTH), 2000)?.body).toHaveLength(TEXT_MAX_LENGTH);
    expect(() => withNewText(item, 'a'.repeat(TEXT_MAX_LENGTH + 1), 2000)).toThrow(InvalidTextError);
  });
});
