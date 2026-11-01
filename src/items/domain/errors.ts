/** The text is blank after trimming, or longer than the configured limit. */
export class InvalidTextError extends Error {
  constructor(
    readonly reason: 'blank' | 'too_long',
    readonly maxLength: number,
  ) {
    super(
      reason === 'blank'
        ? 'Text is blank.'
        : `Text is longer than ${maxLength} characters.`,
    );
    this.name = 'InvalidTextError';
  }
}
