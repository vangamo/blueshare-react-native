import { ThemeProvider } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { CreateButton } from '@/components/create-button';
import { CreationBoxProvider } from '@/components/creation-box-provider';
import { TabBar } from '@/components/tab-bar';
import { ItemsProvider } from '@/components/items-provider';
import { NavigationThemes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

// Keep the native splash until the shell has laid out (hidden in onLayout below).
SplashScreen.preventAutoHideAsync();

function hideSplash() {
  SplashScreen.hideAsync();
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useTheme();
  const { landscape, frame } = useShellLayout();

  return (
    <ThemeProvider value={NavigationThemes[scheme]}>
      <ItemsProvider>
        <CreationBoxProvider>
          <View
            style={[styles.root, { backgroundColor: theme.backgroundMain }]}
            onLayout={hideSplash}>
            <StatusBar style="auto" />
            <AppHeader />
            <Tabs
              tabBar={(props) => <TabBar {...props} />}
              // The bar always renders in the navigator's bottom slot. In landscape it is drawn at the
              // top, so screens start below it. Switching `tabBarPosition` would move the
              // screens' native view and lose focus on rotation (docs/decisions/tab-bar-single-slot.md).
              screenOptions={{
                headerShown: false,
                sceneStyle: { paddingTop: landscape ? frame.tabBarHeight : 0 },
              }}>
              <Tabs.Screen name="index" options={{ title: 'Timeline' }} />
              <Tabs.Screen name="circles" options={{ title: 'Circles' }} />
              <Tabs.Screen name="events" options={{ title: 'Events' }} />
            </Tabs>
            <CreateButton />
          </View>
        </CreationBoxProvider>
      </ItemsProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
