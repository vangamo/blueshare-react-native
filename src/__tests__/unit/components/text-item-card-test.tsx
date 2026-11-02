import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextItemCard } from '@/components/text-item-card';
import { Colors, Layout, Radius, Sizes, Spacing } from '@/constants/theme';
import type { TimelineItem } from '@/hooks/use-timeline';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

const ITEM: TimelineItem = {
  id: 'id-1',
  type: 'text',
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  body: 'Hoy hemos jugado al parchís.\nMañana hay bingo.',
};

describe('TextItemCard', () => {
  test('shows the full text with its line breaks', async () => {
    await render(<TextItemCard item={ITEM} onEdit={() => {}} />);
    expect(screen.getByText('Hoy hemos jugado al parchís.\nMañana hay bingo.')).toBeOnTheScreen();
    expect(screen.getByTestId('text-item-body')).not.toHaveProp('numberOfLines');
  });

  describe.each(['light', 'dark'] as const)('%s palette', (scheme) => {
    beforeEach(() => setMockColorScheme(scheme));

    test('card and text colors', async () => {
      const colors = Colors[scheme];
      await render(<TextItemCard item={ITEM} onEdit={() => {}} />);
      expect(screen.getByTestId('text-item-card')).toHaveStyle({
        backgroundColor: colors.cardBg,
        borderColor: colors.borderColor,
        borderWidth: Layout.borderWidth,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        boxShadow: `0 2px 6px ${colors.cardShadow}`,
      });
      expect(screen.getByTestId('text-item-body')).toHaveStyle({
        color: colors.textSecondary,
        fontSize: 15,
        lineHeight: Sizes.phone.cardLineHeight,
      });
      expect(screen.getByRole('button', { name: 'Editar' }).parent).toHaveStyle({
        borderTopColor: colors.divider,
        borderTopWidth: Layout.hairlineWidth,
      });
      expect(screen.getByRole('button', { name: 'Editar' })).toHaveStyle({
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderDark,
      });
      expect(screen.getByText('Editar')).toHaveStyle({ color: colors.textMain, fontWeight: '700' });
    });
  });

  test('Editar and Compartir are at least 44 tall, in that order, on the right', async () => {
    await render(<TextItemCard item={ITEM} onEdit={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.props.accessibilityLabel)).toEqual(['Editar', 'Compartir']);
    for (const button of buttons) {
      expect(button).toHaveStyle({
        minHeight: Layout.touchTarget,
        borderWidth: Layout.hairlineWidth,
        borderRadius: Radius.sm,
      });
    }
    expect(buttons[0].parent).toHaveStyle({
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Layout.creationGap,
    });
  });

  test('Editar calls onEdit once', async () => {
    const onEdit = jest.fn();
    await render(<TextItemCard item={ITEM} onEdit={onEdit} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  test('pressing Compartir changes nothing', async () => {
    const onEdit = jest.fn();
    await render(<TextItemCard item={ITEM} onEdit={onEdit} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Compartir' }));
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText(ITEM.body)).toBeOnTheScreen();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});

describe('TextItemCard, tablet layout', () => {
  test.each(['tabletPortrait', 'tabletLandscape'] as const)('uses the tablet sizes in %s', async (window) => {
    setMockWindow(TEST_WINDOWS[window]);
    await render(<TextItemCard item={ITEM} onEdit={() => {}} />);
    const sizes = Sizes.tablet;
    expect(screen.getByTestId('text-item-card')).toHaveStyle({
      padding: sizes.cardPadding,
      borderRadius: sizes.cardRadius,
      marginBottom: sizes.itemGap,
    });
    expect(screen.getByTestId('text-item-body')).toHaveStyle({
      fontSize: sizes.cardText,
      lineHeight: sizes.cardLineHeight,
    });
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveStyle({ minHeight: sizes.actionHeight });
    expect(screen.getByText('Editar')).toHaveStyle({ fontSize: sizes.actionLabel });
  });
});
