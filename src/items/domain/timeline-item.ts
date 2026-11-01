import type { TextItem } from './text-item';

/** Anything the timeline lists. Grows into a union as image and event items arrive. */
export type TimelineItem = TextItem;
