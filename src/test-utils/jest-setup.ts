import { setMockColorScheme } from '@/test-utils/test-values';

// Fixed safe-area insets, so size and position checks are predictable.
jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock').default;
  const { TEST_INSETS: insets } = jest.requireActual('@/test-utils/test-values');
  return {
    ...mock,
    initialWindowMetrics: { ...mock.initialWindowMetrics, insets },
    useSafeAreaInsets: () => insets,
  };
});

// The app reads the scheme through this hook; tests force it with setMockColorScheme().
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => jest.requireActual('@/test-utils/test-values').getMockColorScheme(),
}));

afterEach(() => {
  setMockColorScheme('light');
});
