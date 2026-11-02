import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Frames,
  Sizes,
  layoutFor,
  type DeviceKind,
  type Frame,
  type LayoutKind,
  type SizeSet,
} from '@/constants/theme';
import { useWindowSize } from '@/hooks/use-window-size';

export type ShellLayout = {
  kind: LayoutKind;
  device: DeviceKind;
  landscape: boolean;
  frame: Frame;
  sizes: SizeSet;
  /** Width of the content column: the window minus side insets and padding, capped at the frame's column. */
  columnWidth: number;
};

/**
 * The layout for the current window (design D1, D2, D6), computed during render. Re-renders
 * its users when the window changes, so rotation and split screen need no listeners.
 */
export function useShellLayout(): ShellLayout {
  const { width, height } = useWindowSize();
  const insets = useSafeAreaInsets();
  const kind = layoutFor(width, height);
  const device: DeviceKind = kind.startsWith('tablet') ? 'tablet' : 'phone';
  const frame = Frames[kind];
  const sizes = Sizes[device];
  const available = width - insets.left - insets.right - 2 * sizes.contentPadding;

  return {
    kind,
    device,
    landscape: kind.endsWith('landscape'),
    frame,
    sizes,
    columnWidth: frame.column === null ? available : Math.min(available, frame.column),
  };
}
