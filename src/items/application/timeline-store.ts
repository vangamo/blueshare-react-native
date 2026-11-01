import type { TextItem } from '@/items/domain/text-item';
import type { TimelineItem } from '@/items/domain/timeline-item';

export type TimelineStatus = 'loading' | 'ready' | 'error';

export type TimelineSnapshot = {
  readonly status: TimelineStatus;
  readonly items: readonly TimelineItem[];
};

/** External store the UI reads with `useSyncExternalStore` (design D5). */
export type TimelineStore = {
  subscribe(listener: () => void): () => void;
  /** Same object until something changes, as `useSyncExternalStore` requires. */
  getSnapshot(): TimelineSnapshot;
  /** Waits for the first load, saves, then puts the new item first. Rejects on failure. */
  createText(rawText: string): Promise<TextItem>;
  /**
   * Waits for the first load, saves the new text and replaces the item in place, so
   * its position doesn't change. An unchanged text leaves the snapshot as it is.
   * Rejects on failure.
   */
  updateText(id: string, rawText: string): Promise<TextItem>;
  /** Waits for the first load, deletes the item and removes it from the list. Rejects on failure. */
  deleteItem(id: string): Promise<void>;
};

type TimelineStoreDeps = {
  /** Gets storage ready (runs the migrations). */
  prepare: () => Promise<void>;
  listTimeline: () => Promise<TimelineItem[]>;
  createText: (rawText: string) => Promise<TextItem>;
  updateText: (id: string, rawText: string) => Promise<TextItem>;
  deleteItem: (id: string) => Promise<void>;
};

export function createTimelineStore(deps: TimelineStoreDeps): TimelineStore {
  let snapshot: TimelineSnapshot = { status: 'loading', items: [] };
  let loading: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function update(next: TimelineSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function load(): Promise<void> {
    loading ??= (async () => {
      try {
        await deps.prepare();
        update({ status: 'ready', items: await deps.listTimeline() });
      } catch {
        update({ status: 'error', items: [] });
      }
    })();
    return loading;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      void load();
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: () => snapshot,

    async createText(rawText) {
      await load();
      const item = await deps.createText(rawText);
      update({ status: snapshot.status, items: [item, ...snapshot.items] });
      return item;
    },

    async updateText(id, rawText) {
      await load();
      const item = await deps.updateText(id, rawText);
      const shown = snapshot.items.find((existing) => existing.id === id);
      // An unchanged text comes back with the same body and update time: nothing to re-render.
      if (shown && (shown.body !== item.body || shown.updatedAt !== item.updatedAt)) {
        const items = snapshot.items.map((existing) => (existing.id === id ? item : existing));
        update({ status: snapshot.status, items });
      }
      return item;
    },

    async deleteItem(id) {
      await load();
      await deps.deleteItem(id);
      update({ status: snapshot.status, items: snapshot.items.filter((item) => item.id !== id) });
    },
  };
}
