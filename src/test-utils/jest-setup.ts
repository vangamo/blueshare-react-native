import { resetMockWindow, setMockColorScheme } from '@/test-utils/test-values';

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

// The window size comes from this hook. Jest's own window (750×1334) would count as a
// tablet, so tests start in phone portrait and switch with setMockWindow().
jest.mock('@/hooks/use-window-size', () => {
  const { useSyncExternalStore } = jest.requireActual('react');
  return {
    useWindowSize: () => {
      const values = jest.requireActual('@/test-utils/test-values');
      return useSyncExternalStore(values.subscribeMockWindow, values.getMockWindow);
    },
  };
});

// The app's database and IDs come from expo-sqlite and expo-crypto. Jest gets a fresh
// in-memory node:sqlite database per call (so tests never share data), UUIDs from
// node:crypto and the real clock. See docs/architecture/items-module.md.
jest.mock('@/items/infrastructure/app-adapters', () => ({
  __esModule: true,
  createAppAdapters: () => {
    const { NodeSqlDatabase } = jest.requireActual('@/test-utils/node-sql-database');
    const { NodePhotoStore } = jest.requireActual('@/test-utils/node-photo-store');
    const { randomUUID } = jest.requireActual('node:crypto');
    return {
      db: new NodeSqlDatabase(),
      ids: { newId: () => randomUUID() },
      clock: { now: () => Date.now() },
      photos: new NodePhotoStore(),
    };
  },
}));

afterEach(() => {
  setMockColorScheme('light');
  resetMockWindow();
  // Undo jest.spyOn() (Keyboard, BackHandler, createAppAdapters…) so tests never stack spies.
  jest.restoreAllMocks();
});
