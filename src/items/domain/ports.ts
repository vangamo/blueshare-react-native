import type { TextItem } from './text-item';
import type { TimelineItem } from './timeline-item';

/** Where items are kept. Implemented over SQLite in `infrastructure/`. */
export interface ItemRepository {
  /** Stores the common record and the text together, or nothing at all. */
  saveText(item: TextItem): Promise<void>;
  /** Items that are not deleted, newest first. */
  listTimeline(): Promise<TimelineItem[]>;
  /** A live text item by id, or `null` when it doesn't exist or was deleted. */
  findText(id: string): Promise<TextItem | null>;
  /**
   * Archives the stored version, then stores `item`'s text and update time, in one
   * transaction.
   * @throws ItemNotFoundError when no live item has `item.id`.
   */
  updateText(item: TextItem): Promise<void>;
  /**
   * Archives the stored version with `deletedAt`, then removes the live rows, in one
   * transaction.
   * @throws ItemNotFoundError when no live item has this id.
   */
  deleteItem(id: string, deletedAt: number): Promise<void>;
}

/** Current time in UTC milliseconds. Injected so tests are deterministic. */
export interface Clock {
  now(): number;
}

/** New unique item IDs (UUID v4 in the app). Injected so tests are deterministic. */
export interface IdGenerator {
  newId(): string;
}
