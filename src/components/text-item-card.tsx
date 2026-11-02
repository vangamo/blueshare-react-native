import { Text } from 'react-native';

import { CardActions, ItemCardFrame } from '@/components/item-card-frame';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';
import type { TextItem } from '@/items/domain/text-item';

/**
 * A text item in the Timeline: the full text, then the Editar and Compartir actions.
 * Editar calls `onEdit` (the feed opens the edit dialog).
 */
export function TextItemCard({ item, onEdit }: { item: TextItem; onEdit: () => void }) {
  const theme = useTheme();
  const { sizes } = useShellLayout();

  return (
    <ItemCardFrame testID="text-item-card">
      <Text
        testID="text-item-body"
        style={[
          { fontSize: sizes.cardText, lineHeight: sizes.cardLineHeight, color: theme.textSecondary },
        ]}>
        {item.body}
      </Text>
      <CardActions onEdit={onEdit} />
    </ItemCardFrame>
  );
}
