import { use, useSyncExternalStore } from 'react';

import { ItemsContext } from '@/components/items-provider';
import type { TimelineSnapshot } from '@/items/application/timeline-store';
import type { TextItem } from '@/items/domain/text-item';

export type { ItemType } from '@/items/domain/item';
export type { TimelineItem } from '@/items/domain/timeline-item';
export type { TimelineStatus } from '@/items/application/timeline-store';

export type Timeline = TimelineSnapshot & {
  /** Saves a text item and puts it first. Rejects when it can't be saved. */
  createText: (rawText: string) => Promise<TextItem>;
  /** Saves a new text for an item, keeping its place. Rejects when it can't be saved. */
  updateText: (id: string, rawText: string) => Promise<TextItem>;
  /** Deletes an item and removes it from the list. Rejects when it can't be deleted. */
  deleteItem: (id: string) => Promise<void>;
};

/** The timeline items and their load status. Must be used inside `ItemsProvider`. */
export function useTimeline(): Timeline {
  const module = use(ItemsContext);
  if (!module) throw new Error('useTimeline must be used inside ItemsProvider');
  const { store } = module;
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return {
    status: snapshot.status,
    items: snapshot.items,
    createText: store.createText,
    updateText: store.updateText,
    deleteItem: store.deleteItem,
  };
}
