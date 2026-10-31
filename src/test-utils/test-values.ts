import type { useColorScheme } from 'react-native';

type Scheme = ReturnType<typeof useColorScheme>;

/** Safe-area insets every test sees (see jest-setup.ts). */
export const TEST_INSETS = { top: 24, bottom: 20, left: 0, right: 0 } as const;

let mockScheme: Scheme = 'light';

/** Color scheme returned by the mocked `useColorScheme` hook. */
export function getMockColorScheme(): Scheme {
  return mockScheme;
}

/** Force the color scheme for the next renders. Reset to 'light' after each test. */
export function setMockColorScheme(scheme: Scheme) {
  mockScheme = scheme;
}
