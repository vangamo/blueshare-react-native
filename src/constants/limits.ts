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

/** Maximum event title, in UTF-16 code units. */
export const EVENT_TITLE_MAX_LENGTH = 120;

/** Maximum event category, in UTF-16 code units. Short enough for the badge beside the title. */
export const EVENT_CATEGORY_MAX_LENGTH = 24;

/** Maximum event description, in UTF-16 code units. */
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;

/** Most photos one event can hold (at least one is required). */
export const EVENT_MAX_PHOTOS = 10;
