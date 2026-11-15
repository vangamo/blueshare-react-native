import { PROFILE_NAME_MAX_LENGTH } from '@/constants/limits';
import { InvalidProfileError } from '@/profile/domain/errors';
import {
  checkAvatar,
  normalizeProfileName,
  withProfileChanges,
  type Profile,
} from '@/profile/domain/profile';

const profile: Profile = {
  id: 'me',
  name: 'Carmen',
  avatar: { file: 'a.jpg', width: 10, height: 20 },
  createdAt: 1,
  updatedAt: 1,
};

describe('normalizeProfileName', () => {
  test('trims the name', () => {
    expect(normalizeProfileName('  Abuela Carmen\n')).toBe('Abuela Carmen');
  });

  test.each(['', '   ', '\n\t'])('rejects the blank name %j', (raw) => {
    expect(() => normalizeProfileName(raw)).toThrow(InvalidProfileError);
    try {
      normalizeProfileName(raw);
    } catch (error) {
      expect(error).toMatchObject({ field: 'name', reason: 'empty' });
    }
  });

  test('accepts exactly the limit and rejects one more', () => {
    expect(normalizeProfileName('a'.repeat(PROFILE_NAME_MAX_LENGTH))).toHaveLength(PROFILE_NAME_MAX_LENGTH);
    expect(() => normalizeProfileName('a'.repeat(PROFILE_NAME_MAX_LENGTH + 1))).toThrow(
      expect.objectContaining({ field: 'name', reason: 'too_long', maxLength: PROFILE_NAME_MAX_LENGTH }),
    );
  });

  test('counts the length after trimming', () => {
    expect(() => normalizeProfileName(` ${'a'.repeat(PROFILE_NAME_MAX_LENGTH)} `)).not.toThrow();
  });
});

describe('checkAvatar', () => {
  test('accepts a positive size', () => {
    expect(() => checkAvatar({ width: 1, height: 1 })).not.toThrow();
  });

  test.each([
    [0, 10],
    [10, 0],
    [NaN, 10],
    [10, Infinity],
    [-1, 10],
  ])('rejects the size %p by %p', (width, height) => {
    expect(() => checkAvatar({ width, height })).toThrow(
      expect.objectContaining({ field: 'avatar', reason: 'invalid' }),
    );
  });
});

describe('withProfileChanges', () => {
  test('returns the same object for the same name and photo', () => {
    expect(withProfileChanges(profile, { name: 'Carmen', avatar: undefined }, 9)).toBe(profile);
  });

  test('a new name changes the name and the update time only', () => {
    const next = withProfileChanges(profile, { name: 'Abuela', avatar: undefined }, 9);
    expect(next).toEqual({ ...profile, name: 'Abuela', updatedAt: 9 });
    expect(next.id).toBe(profile.id);
    expect(next.createdAt).toBe(1);
  });

  test('a new photo file counts as a change', () => {
    const avatar = { file: 'b.jpg', width: 5, height: 5 };
    expect(withProfileChanges(profile, { name: 'Carmen', avatar }, 9).avatar).toBe(avatar);
  });

  test('null removes the photo', () => {
    expect(withProfileChanges(profile, { name: 'Carmen', avatar: null }, 9).avatar).toBeNull();
  });

  test('removing a photo that is not there changes nothing', () => {
    const none = { ...profile, avatar: null };
    expect(withProfileChanges(none, { name: 'Carmen', avatar: null }, 9)).toBe(none);
  });
});
