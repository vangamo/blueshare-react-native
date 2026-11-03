import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { EventPhotoTile } from '@/components/event-photo-tile';
import { CardActions, ItemCardFrame } from '@/components/item-card-frame';
import { FontWeight, Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';
import type { EventItem } from '@/items/domain/event-item';

/**
 * An event item in the Timeline (sketches/mobile-portrait-event-item.png): a strong
 * border with a blue bar on the left, the bold title with the category badge at its
 * right, a sideways-scrolling row of square photo tiles sized so the next one peeks out,
 * the description in full when there is one, then the Editar and Compartir actions.
 */
export function EventItemCard({ item, onEdit }: { item: EventItem; onEdit: () => void }) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const count = item.photos.length;

  return (
    <ItemCardFrame testID="event-item-card" accent>
      <View style={styles.header}>
        <Text
          testID="event-item-title"
          accessibilityRole="header"
          style={[styles.title, { fontSize: sizes.eventTitle, color: theme.textMain }]}>
          {item.title}
        </Text>
        <CategoryBadge category={item.category} />
      </View>
      {/* At most 10 tiles, so no virtualization; the scroll view locks the axis inside the feed. */}
      <ScrollView
        testID="event-photo-row"
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}>
        {item.photos.map((photo, index) => (
          <EventPhotoTile
            key={`${index}-${photo.file}`}
            file={photo.file}
            label={`Foto ${index + 1} de ${count} de ${item.title}`}
          />
        ))}
      </ScrollView>
      {item.description ? (
        <Text
          testID="event-item-description"
          style={[
            styles.description,
            { fontSize: sizes.cardText, lineHeight: sizes.cardLineHeight, color: theme.textSecondary },
          ]}>
          {item.description}
        </Text>
      ) : null}
      <CardActions onEdit={onEdit} />
    </ItemCardFrame>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontWeight: FontWeight.bold,
  },
  row: {
    marginTop: Spacing.md,
  },
  rowContent: {
    gap: Layout.eventTileGap,
  },
  description: {
    marginTop: Layout.photoGap,
  },
});
