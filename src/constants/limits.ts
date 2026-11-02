/**
 * Limits on user content. Changing a value needs no database migration: the domain
 * enforces it (openspec add-text-items design D9).
 */

/** Maximum text item length, in UTF-16 code units (the unit `TextInput.maxLength` counts). */
export const TEXT_MAX_LENGTH = 8192;

/** Maximum alternative text of an image item, in UTF-16 code units. */
export const ALT_TEXT_MAX_LENGTH = 1000;

/** Maximum caption of an image item, in UTF-16 code units. */
export const CAPTION_MAX_LENGTH = 500;
