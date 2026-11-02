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

/** No live (not deleted) item has this id. */
export class ItemNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Item ${id} was not found.`);
    this.name = 'ItemNotFoundError';
  }
}

/** The alternative text or the caption of an image item is longer than its limit. */
export class InvalidImageTextError extends Error {
  constructor(
    readonly field: 'altText' | 'caption',
    readonly reason: 'too_long',
    readonly maxLength: number,
  ) {
    super(`${field === 'altText' ? 'Alternative text' : 'Caption'} is longer than ${maxLength} characters.`);
    this.name = 'InvalidImageTextError';
  }
}
