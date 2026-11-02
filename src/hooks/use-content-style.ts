import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useShellLayout } from '@/hooks/use-shell-layout';

/**
 * Content container style shared by the sections (design D5, D6). Phone portrait is a
 * plain `padding`. Other layouts add the side insets, the bottom inset (no bar below in
 * landscape) and a centered column of `columnWidth` plus the padding.
 */
export function useContentStyle() {
  const insets = useSafeAreaInsets();
  const { landscape, frame, sizes, columnWidth } = useShellLayout();

  return {
    padding: sizes.contentPadding,
    ...(insets.left > 0 ? { paddingLeft: sizes.contentPadding + insets.left } : null),
    ...(insets.right > 0 ? { paddingRight: sizes.contentPadding + insets.right } : null),
    ...(landscape ? { paddingBottom: sizes.contentPadding + insets.bottom } : null),
    ...(frame.column === null
      ? null
      : {
          // The side insets are padding too, so they count in the width: the content is
          // exactly `columnWidth` wide, which the photo boxes are sized from.
          width: columnWidth + 2 * sizes.contentPadding + insets.left + insets.right,
          alignSelf: 'center' as const,
        }),
  };
}
