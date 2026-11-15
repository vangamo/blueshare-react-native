import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
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

/** The divider and the Editar and Compartir buttons at the bottom of every item card. */
export function CardActions({ onEdit }: { onEdit: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.actions, { borderTopColor: theme.divider }]}>
      <CardAction label="Editar" onPress={onEdit} />
      {/* Sharing with contacts over Bluetooth comes in a later change. */}
      <CardAction label="Compartir" onPress={() => {}} />
    </View>
  );
}

type ItemCardFrameProps = {
  testID: string;
  /**
   * The event card's look: a strong-ink border and a deep-blue bar along the left edge
   * (`Layout.accentBarWidth`), drawn as a wider left border inside the rounded corners.
   */
  accent?: boolean;
  children: ReactNode;
};

/** The card every item type shares: background, border, radius, padding, shadow and spacing. */
export function ItemCardFrame({ testID, accent = false, children }: ItemCardFrameProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <View
      testID={testID}
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
        accent && {
          borderColor: theme.primaryDark,
          borderLeftWidth: Layout.accentBarWidth,
          borderLeftColor: theme.primaryBlueDeep,
        },
      ]}>
      {children}
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
