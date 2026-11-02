/** The kinds of item a user can create. Events cannot be created yet. */
export type ItemType = 'text' | 'image' | 'event';

/** Fields every item records, whatever its type. Times are UTC milliseconds. */
export type ItemMeta = {
  /** Random version 4 UUID generated on the phone. */
  id: string;
  type: ItemType;
  createdAt: number;
  updatedAt: number;
  /** Set when the item is deleted (soft delete). `null` while it is not. */
  deletedAt: number | null;
};
