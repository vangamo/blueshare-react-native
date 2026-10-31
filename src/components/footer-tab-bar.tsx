import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Footer navigation drawn in place of the default JS tab bar (Timeline, Circles, Events). */
export function FooterTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          height: Layout.footerHeight + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: theme.cardBg,
          borderTopColor: theme.borderColor,
        },
      ]}>
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const label = descriptors[route.key].options.title ?? route.name;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tab,
              focused
                ? {
                    backgroundColor: theme.primaryBlueHover,
                    borderColor: theme.primaryBlueDeep,
                    boxShadow: `0 3px 8px ${theme.primaryShadow}`,
                  }
                : { backgroundColor: theme.surfaceMuted, borderColor: theme.borderDark },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, { color: focused ? theme.onPrimary : theme.textSecondary }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.footerPaddingHorizontal,
    borderTopWidth: Layout.borderWidth,
  },
  tab: {
    flex: 1,
    height: Layout.touchTarget,
    marginHorizontal: Layout.tabMarginHorizontal,
    borderRadius: Layout.controlRadius,
    borderWidth: Layout.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.7,
  },
});
