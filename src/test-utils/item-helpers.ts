import type { TimelineItem } from '@/items/domain/timeline-item';

/** The text of a text item, for assertions on mixed lists. Fails for any other type. */
export function bodyOf(item: TimelineItem): string {
  if (item.type !== 'text') throw new Error(`Expected a text item, got ${item.type}.`);
  return item.body;
}
