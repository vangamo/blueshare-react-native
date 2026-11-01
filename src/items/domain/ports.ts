import type { TextItem } from './text-item';
import type { TimelineItem } from './timeline-item';

/** Where items are kept. Implemented over SQLite in `infrastructure/`. */
export interface ItemRepository {
  /** Stores the common record and the text together, or nothing at all. */
  saveText(item: TextItem): Promise<void>;
  /** Items that are not deleted, newest first. */
  listTimeline(): Promise<TimelineItem[]>;
}

/** Current time in UTC milliseconds. Injected so tests are deterministic. */
export interface Clock {
  now(): number;
}

/** New unique item IDs (UUID v4 in the app). Injected so tests are deterministic. */
export interface IdGenerator {
  newId(): string;
}
