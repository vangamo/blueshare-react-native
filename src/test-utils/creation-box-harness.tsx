import { Pressable, Text } from 'react-native';

import { CreationBox } from '@/components/creation-box';
import { CreationBoxProvider } from '@/components/creation-box-provider';
import { ItemsProvider } from '@/components/items-provider';
import { useCreationBox } from '@/hooks/use-creation-box';
import { useTimeline } from '@/hooks/use-timeline';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';

/** Test-only controls: "Abrir" opens the box; the timeline bodies are listed by testID. */
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
          {item.body}
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
