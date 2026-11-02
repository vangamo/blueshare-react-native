import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontWeight, Layout } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

/**
 * Tab navigation drawn in place of the default JS tab bar (Timeline, Circles, Events).
 * At the bottom in portrait, and in landscape drawn at the top of the navigator: it stays
 * in the navigator's bottom slot either way (see the root layout).
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { landscape, frame, sizes } = useShellLayout();
  const stretch = frame.tabWidth === 'stretch';
  const bottomInset = landscape ? 0 : insets.bottom;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        landscape ? styles.barTop : null,
        {
          height: frame.tabBarHeight + bottomInset,
          paddingBottom: bottomInset,
          paddingLeft: Layout.tabBarPaddingHorizontal + insets.left,
          paddingRight: Layout.tabBarPaddingHorizontal + insets.right,
          backgroundColor: theme.cardBg,
          ...(landscape
            ? { borderBottomWidth: Layout.borderWidth, borderBottomColor: theme.borderColor }
            : { borderTopWidth: Layout.borderWidth, borderTopColor: theme.borderColor }),
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
              stretch ? styles.tabStretch : { width: frame.tabWidth },
              { height: sizes.tabHeight },
              focused
                ? {
                    backgroundColor: theme.primaryBlueHover,
                    borderColor: theme.primaryBlueDeep,
                    boxShadow: `0 3px 8px ${theme.primaryShadow}`,
                  }
                : { backgroundColor: theme.surfaceMuted, borderColor: theme.borderDark },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, { fontSize: sizes.tabLabel, color: focused ? theme.onPrimary : theme.textSecondary }]}>
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
    justifyContent: 'center',
  },
  barTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  tabStretch: {
    flex: 1,
  },
  tab: {
    // A fixed width is a preferred width: the tabs shrink rather than leave the screen.
    flexShrink: 1,
    marginHorizontal: Layout.tabMarginHorizontal,
    borderRadius: Layout.controlRadius,
    borderWidth: Layout.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: FontWeight.bold,
  },
  pressed: {
    opacity: 0.7,
  },
});
