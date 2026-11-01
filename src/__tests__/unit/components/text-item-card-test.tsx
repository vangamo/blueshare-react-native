import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextItemCard } from '@/components/text-item-card';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import type { TimelineItem } from '@/hooks/use-timeline';
import { setMockColorScheme } from '@/test-utils/test-values';

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
    await render(<TextItemCard item={ITEM} />);
    expect(screen.getByText('Hoy hemos jugado al parchís.\nMañana hay bingo.')).toBeOnTheScreen();
    expect(screen.getByTestId('text-item-body')).not.toHaveProp('numberOfLines');
  });

  describe.each(['light', 'dark'] as const)('%s palette', (scheme) => {
    beforeEach(() => setMockColorScheme(scheme));

    test('card and text colors', async () => {
      const colors = Colors[scheme];
      await render(<TextItemCard item={ITEM} />);
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
        lineHeight: Layout.cardTextLineHeight,
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
    await render(<TextItemCard item={ITEM} />);
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

  test.each(['Editar', 'Compartir'])('pressing %s changes nothing', async (name) => {
    await render(<TextItemCard item={ITEM} />);
    await fireEvent.press(screen.getByRole('button', { name }));
    expect(screen.getByText(ITEM.body)).toBeOnTheScreen();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
