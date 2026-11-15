/** The name or the avatar photo of the profile breaks its rule. */
export class InvalidProfileError extends Error {
  constructor(
    readonly field: 'name' | 'avatar',
    readonly reason: 'empty' | 'too_long' | 'invalid' | 'copy_failed',
    readonly maxLength?: number,
  ) {
    super(
      field === 'name'
        ? reason === 'empty'
          ? 'Name is empty.'
          : `Name is longer than ${maxLength} characters.`
        : reason === 'copy_failed'
          ? 'The avatar photo could not be copied.'
          : 'The avatar photo has no valid size.',
    );
    this.name = 'InvalidProfileError';
  }
}

/** The own profile row does not exist. */
export class ProfileNotFoundError extends Error {
  constructor() {
    super('The own profile was not found.');
    this.name = 'ProfileNotFoundError';
  }
}
