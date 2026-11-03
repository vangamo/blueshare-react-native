import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Frames,
  Layout,
  Sizes,
  Spacing,
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
  /**
   * Tallest photo box, so a whole image card (photo, caption line and actions) fits in the
   * window below the header and tab bar. Never less than `Layout.imageMinHeight`.
   */
  imageMaxHeight: number;
  /**
   * Side of an event card's square photo tiles: two tiles and part of a third fit the
   * card's content width (`Layout.eventTilePeek`), never more than `imageMaxHeight`.
   */
  eventTileSize: number;
};

/** Height of an image card around its photo: padding and border, the gap, a caption line and the actions. */
function imageCardChrome(sizes: SizeSet): number {
  const frame = 2 * (sizes.cardPadding + Layout.borderWidth);
  const caption = Layout.photoGap + sizes.captionText * 1.5;
  const actions = 2 * Spacing.md + Layout.hairlineWidth + sizes.actionHeight;
  return frame + caption + actions;
}

/** Width inside an event card: padding on both sides, the right border and the left accent bar. */
function eventInnerWidth(columnWidth: number, sizes: SizeSet): number {
  return columnWidth - 2 * sizes.cardPadding - Layout.borderWidth - Layout.accentBarWidth;
}

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
  const columnWidth = frame.column === null ? available : Math.min(available, frame.column);
  const imageMaxHeight = Math.max(
    Layout.imageMinHeight,
    height -
      insets.top -
      insets.bottom -
      frame.headerHeight -
      frame.tabBarHeight -
      2 * sizes.contentPadding -
      imageCardChrome(sizes),
  );

  return {
    kind,
    device,
    landscape: kind.endsWith('landscape'),
    frame,
    sizes,
    imageMaxHeight,
    columnWidth,
    eventTileSize: Math.min(
      (eventInnerWidth(columnWidth, sizes) - 2 * Layout.eventTileGap) / Layout.eventTilePeek,
      imageMaxHeight,
    ),
  };
}
