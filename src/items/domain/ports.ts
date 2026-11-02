import type { ImageItem } from './image-item';
import type { TextItem } from './text-item';
import type { TimelineItem } from './timeline-item';

/** Where items are kept. Implemented over SQLite in `infrastructure/`. */
export interface ItemRepository {
  /** Stores the common record and the text together, or nothing at all. */
  saveText(item: TextItem): Promise<void>;
  /** Stores the common record and the photo reference and texts together, or nothing at all. */
  saveImage(item: ImageItem): Promise<void>;
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
  /** A live image item by id, or `null` when it doesn't exist or was deleted. */
  findImage(id: string): Promise<ImageItem | null>;
  /**
   * Archives the stored version, then stores `item`'s photo, texts and update time, in
   * one transaction.
   * @throws ItemNotFoundError when no live item has `item.id`.
   */
  updateImage(item: ImageItem): Promise<void>;
  /**
   * Archives the stored version with `deletedAt`, then removes the live rows, in one
   * transaction.
   * @throws ItemNotFoundError when no live item has this id.
   */
  deleteItem(id: string, deletedAt: number): Promise<void>;
}

/** Where the copies of chosen photos are kept (the app's document folder). */
export interface PhotoStore {
  /** Copies the file at `sourceUri` into the photos folder as `fileName`, creating the folder. */
  importPhoto(sourceUri: string, fileName: string): Promise<void>;
  /** Removes a stored photo. A missing file is not an error. */
  removePhoto(fileName: string): Promise<void>;
  /** The URI to show the stored photo `fileName`. Built on demand, never stored. */
  uriFor(fileName: string): string;
}

/** Current time in UTC milliseconds. Injected so tests are deterministic. */
export interface Clock {
  now(): number;
}

/** New unique item IDs (UUID v4 in the app). Injected so tests are deterministic. */
export interface IdGenerator {
  newId(): string;
}
