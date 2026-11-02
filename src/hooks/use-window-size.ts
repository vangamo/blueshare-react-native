import { useWindowDimensions } from 'react-native';

/**
 * Current window size in points (excludes the system bars). A hook of its own so
 * Jest can mock this one module, the same pattern as `use-color-scheme`.
 */
export function useWindowSize(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
