import { TEXT_MAX_LENGTH } from '@/constants/limits';

describe('limits', () => {
  test('a text item holds at most 8192 characters by default', () => {
    expect(TEXT_MAX_LENGTH).toBe(8192);
  });
});
