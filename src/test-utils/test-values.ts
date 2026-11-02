import type { useColorScheme } from 'react-native';

type Scheme = ReturnType<typeof useColorScheme>;

/** Safe-area insets every test sees (see jest-setup.ts). */
export const TEST_INSETS = { top: 24, bottom: 20, left: 0, right: 0 } as const;

/** The window sizes measured on the emulators (design Context): Medium Phone and Galaxy Tab A9+. */
export const TEST_WINDOWS = {
  phonePortrait: { width: 411, height: 866 },
  phoneLandscape: { width: 914, height: 363 },
  tabletPortrait: { width: 800, height: 1224 },
  tabletLandscape: { width: 1280, height: 744 },
} as const;

type WindowSize = { width: number; height: number };

let mockWindow: WindowSize = TEST_WINDOWS.phonePortrait;
const windowListeners = new Set<() => void>();

/** Window size returned by the mocked `useWindowSize` hook. */
export function getMockWindow(): WindowSize {
  return mockWindow;
}

/** Subscribes to window changes (for the mocked hook's `useSyncExternalStore`). */
export function subscribeMockWindow(listener: () => void): () => void {
  windowListeners.add(listener);
  return () => windowListeners.delete(listener);
}

/**
 * Resize the window, like a rotation. Wrap it in `act()` while components are mounted.
 * Reset to phone portrait after each test.
 */
export function setMockWindow(size: WindowSize) {
  mockWindow = size;
  windowListeners.forEach((listener) => listener());
}

/** Back to phone portrait without notifying: components are unmounted after each test. */
export function resetMockWindow() {
  mockWindow = TEST_WINDOWS.phonePortrait;
}

let mockScheme: Scheme = 'light';

/** Color scheme returned by the mocked `useColorScheme` hook. */
export function getMockColorScheme(): Scheme {
  return mockScheme;
}

/** Force the color scheme for the next renders. Reset to 'light' after each test. */
export function setMockColorScheme(scheme: Scheme) {
  mockScheme = scheme;
}
