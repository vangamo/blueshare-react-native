import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import type { TimelineItem } from '@/hooks/use-timeline';
import { useTheme } from '@/hooks/use-theme';

type CardActionProps = {
  label: string;
  onPress: () => void;
};

function CardAction({ label, onPress }: CardActionProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.borderDark },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.actionLabel, { color: theme.textMain }]}>{label}</Text>
    </Pressable>
  );
}

/** A text item in the Timeline: the full text, then the Editar and Compartir actions. */
export function TextItemCard({ item }: { item: TimelineItem }) {
  const theme = useTheme();

  return (
    <View
      testID="text-item-card"
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          boxShadow: `0 2px 6px ${theme.cardShadow}`,
        },
      ]}>
      <Text testID="text-item-body" style={[styles.body, { color: theme.textSecondary }]}>
        {item.body}
      </Text>
      <View style={[styles.actions, { borderTopColor: theme.divider }]}>
        {/* Editing items comes in a later change. */}
        <CardAction label="Editar" onPress={() => {}} />
        {/* Sharing with contacts over Bluetooth comes in a later change. */}
        <CardAction label="Compartir" onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: Layout.borderWidth,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  body: {
    fontSize: FontSize.body,
    lineHeight: Layout.cardTextLineHeight,
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
    minHeight: Layout.touchTarget,
    paddingHorizontal: Spacing.md,
    borderWidth: Layout.hairlineWidth,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
});
