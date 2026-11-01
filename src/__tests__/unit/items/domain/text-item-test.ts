import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { InvalidTextError } from '@/items/domain/errors';
import { normalizeTextBody } from '@/items/domain/text-item';

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
