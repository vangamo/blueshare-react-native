import type { ImageItem } from './image-item';
import type { TextItem } from './text-item';

/** Anything the timeline lists. Grows as event items arrive. Narrow it on `item.type`. */
export type TimelineItem = TextItem | ImageItem;
