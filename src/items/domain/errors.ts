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

/** A field of an event item breaks its rule: a blank or over-long text, or a photo count outside 1 to the limit. */
export class InvalidEventError extends Error {
  constructor(
    readonly field: 'title' | 'category' | 'description' | 'photos',
    readonly reason: 'blank' | 'too_long' | 'too_few' | 'too_many',
    readonly limit: number,
  ) {
    super(InvalidEventError.describe(field, reason, limit));
    this.name = 'InvalidEventError';
  }

  private static describe(field: string, reason: string, limit: number): string {
    if (reason === 'blank') return `Event ${field} is blank.`;
    if (reason === 'too_long') return `Event ${field} is longer than ${limit} characters.`;
    if (reason === 'too_few') return `An event needs at least ${limit} photo.`;
    return `An event holds at most ${limit} photos.`;
  }
}
