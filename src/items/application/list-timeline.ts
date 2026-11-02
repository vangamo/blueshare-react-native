import type { TimelineItem } from '@/items/domain/timeline-item';

import type { UseCaseDeps } from './deps';

/** Items that are not deleted, newest first. */
export function listTimeline({ repository }: Pick<UseCaseDeps, 'repository'>) {
  return (): Promise<TimelineItem[]> => repository.listTimeline();
}
