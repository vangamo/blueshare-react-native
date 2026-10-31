import { ThemeProvider } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { CreateButton } from '@/components/create-button';
import { FooterTabBar } from '@/components/footer-tab-bar';
import { NavigationThemes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Keep the native splash until the shell has laid out (hidden in onLayout below).
SplashScreen.preventAutoHideAsync();

function hideSplash() {
  SplashScreen.hideAsync();
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useTheme();

  return (
    <ThemeProvider value={NavigationThemes[scheme]}>
      <View
        style={[styles.root, { backgroundColor: theme.backgroundMain }]}
        onLayout={hideSplash}>
        <StatusBar style="auto" />
        <AppHeader />
        <Tabs
          tabBar={(props) => <FooterTabBar {...props} />}
          screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" options={{ title: 'Timeline' }} />
          <Tabs.Screen name="circles" options={{ title: 'Circles' }} />
          <Tabs.Screen name="events" options={{ title: 'Events' }} />
        </Tabs>
        <CreateButton />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
