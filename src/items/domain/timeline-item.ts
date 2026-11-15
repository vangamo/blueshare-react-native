import type { EventItem } from './event-item';
import type { ImageItem } from './image-item';
import type { TextItem } from './text-item';

/** Anything the timeline lists. Narrow it on `item.type`. */
export type TimelineItem = TextItem | ImageItem | EventItem;
