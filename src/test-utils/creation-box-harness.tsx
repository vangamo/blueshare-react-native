import { Pressable, Text } from 'react-native';

import { CreationBox } from '@/components/creation-box';
import { CreationBoxProvider } from '@/components/creation-box-provider';
import { ItemsProvider } from '@/components/items-provider';
import { useCreationBox } from '@/hooks/use-creation-box';
import { useTimeline } from '@/hooks/use-timeline';
import type { TimelineItem } from '@/items/domain/timeline-item';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';

/** What the harness lists for each stored item: a text's body, an image's caption, an event's title. */
function summary(item: TimelineItem): string {
  if (item.type === 'text') return item.body;
  if (item.type === 'image') return item.caption ?? '';
  return item.title;
}

/** Test-only controls: "Abrir" opens the box; the stored items are listed by testID. */
function Controls() {
  const { dispatch } = useCreationBox();
  const { items } = useTimeline();
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'open' })}>
        <Text>Abrir</Text>
      </Pressable>
      {items.map((item) => (
        <Text key={item.id} testID="stored-item">
          {summary(item)}
        </Text>
      ))}
    </>
  );
}

/** The creation box with its providers, outside the router. */
export function CreationBoxHarness({ adapters }: { adapters?: AppAdapters }) {
  return (
    <ItemsProvider adapters={adapters}>
      <CreationBoxProvider>
        <Controls />
        <CreationBox />
      </CreationBoxProvider>
    </ItemsProvider>
  );
}
