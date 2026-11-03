import { use, useSyncExternalStore } from 'react';

import { ItemsContext } from '@/components/items-provider';
import type { TimelineSnapshot } from '@/items/application/timeline-store';
import type { CreateEventInput } from '@/items/application/create-event-item';
import type { CreateImageInput } from '@/items/application/create-image-item';
import type { EventPhotoInput, UpdateEventInput } from '@/items/application/update-event-item';
import type { UpdateImageInput } from '@/items/application/update-image-item';
import type { EventItem } from '@/items/domain/event-item';
import type { ImageItem } from '@/items/domain/image-item';
import type { TextItem } from '@/items/domain/text-item';

export type { ItemType } from '@/items/domain/item';
export type { TimelineItem } from '@/items/domain/timeline-item';
export type { TimelineStatus } from '@/items/application/timeline-store';
export type { EventPhotoInput };

export type Timeline = TimelineSnapshot & {
  /** Saves a text item and puts it first. Rejects when it can't be saved. */
  createText: (rawText: string) => Promise<TextItem>;
  /** Saves a new text for an item, keeping its place. Rejects when it can't be saved. */
  updateText: (id: string, rawText: string) => Promise<TextItem>;
  /** Copies the photo, saves an image item and puts it first. Rejects when it can't be saved. */
  createImage: (input: CreateImageInput) => Promise<ImageItem>;
  /** Saves changes to an image item, keeping its place. Rejects when it can't be saved. */
  updateImage: (id: string, input: UpdateImageInput) => Promise<ImageItem>;
  /** Copies the photos, saves an event item and puts it first. Rejects when it can't be saved. */
  createEvent: (input: CreateEventInput) => Promise<EventItem>;
  /** Saves changes to an event item, keeping its place. Rejects when it can't be saved. */
  updateEvent: (id: string, input: UpdateEventInput) => Promise<EventItem>;
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
    createImage: store.createImage,
    updateImage: store.updateImage,
    createEvent: store.createEvent,
    updateEvent: store.updateEvent,
    deleteItem: store.deleteItem,
  };
}
