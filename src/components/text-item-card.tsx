import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import type { TimelineItem } from '@/hooks/use-timeline';
import { useTheme } from '@/hooks/use-theme';

type CardActionProps = {
  label: string;
  onPress: () => void;
};

function CardAction({ label, onPress }: CardActionProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { minHeight: sizes.actionHeight, backgroundColor: theme.surfaceMuted, borderColor: theme.borderDark },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.actionLabel, { fontSize: sizes.actionLabel, color: theme.textMain }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * A text item in the Timeline: the full text, then the Editar and Compartir actions.
 * Editar calls `onEdit` (the feed opens the edit dialog).
 */
export function TextItemCard({ item, onEdit }: { item: TimelineItem; onEdit: () => void }) {
  const theme = useTheme();
  const { sizes } = useShellLayout();

  return (
    <View
      testID="text-item-card"
      style={[
        styles.card,
        {
          borderRadius: sizes.cardRadius,
          padding: sizes.cardPadding,
          marginBottom: sizes.itemGap,
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          boxShadow: `0 2px 6px ${theme.cardShadow}`,
        },
      ]}>
      <Text
        testID="text-item-body"
        style={[
          { fontSize: sizes.cardText, lineHeight: sizes.cardLineHeight, color: theme.textSecondary },
        ]}>
        {item.body}
      </Text>
      <View style={[styles.actions, { borderTopColor: theme.divider }]}>
        <CardAction label="Editar" onPress={onEdit} />
        {/* Sharing with contacts over Bluetooth comes in a later change. */}
        <CardAction label="Compartir" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: Layout.borderWidth,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.creationGap,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: Layout.hairlineWidth,
  },
  action: {
    paddingHorizontal: Spacing.md,
    borderWidth: Layout.hairlineWidth,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
});
