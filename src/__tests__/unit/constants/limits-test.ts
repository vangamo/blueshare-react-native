import {
  ALT_TEXT_MAX_LENGTH,
  CAPTION_MAX_LENGTH,
  EVENT_CATEGORY_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_MAX_PHOTOS,
  EVENT_TITLE_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '@/constants/limits';

describe('limits', () => {
  test('a text item holds at most 8192 characters by default', () => {
    expect(TEXT_MAX_LENGTH).toBe(8192);
  });

  test('alternative text holds at most 1000 characters and a caption 500', () => {
    expect(ALT_TEXT_MAX_LENGTH).toBe(1000);
    expect(CAPTION_MAX_LENGTH).toBe(500);
  });

  test('an event title holds 120 characters, a category 24 and a description 2000', () => {
    expect(EVENT_TITLE_MAX_LENGTH).toBe(120);
    expect(EVENT_CATEGORY_MAX_LENGTH).toBe(24);
    expect(EVENT_DESCRIPTION_MAX_LENGTH).toBe(2000);
  });

  test('an event holds at most 10 photos', () => {
    expect(EVENT_MAX_PHOTOS).toBe(10);
  });
});
