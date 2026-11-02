import { ALT_TEXT_MAX_LENGTH, CAPTION_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/limits';

describe('limits', () => {
  test('a text item holds at most 8192 characters by default', () => {
    expect(TEXT_MAX_LENGTH).toBe(8192);
  });

  test('alternative text holds at most 1000 characters and a caption 500', () => {
    expect(ALT_TEXT_MAX_LENGTH).toBe(1000);
    expect(CAPTION_MAX_LENGTH).toBe(500);
  });
});
