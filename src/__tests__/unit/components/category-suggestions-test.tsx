import { fireEvent, render, screen } from '@testing-library/react-native';

import { CATEGORY_SUGGESTIONS, CategorySuggestions } from '@/components/category-suggestions';
import { Colors, Layout, Sizes } from '@/constants/theme';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

describe('CategorySuggestions', () => {
  test('shows four buttons in order, named by their text', async () => {
    await render(<CategorySuggestions onSelect={jest.fn()} />);
    expect(CATEGORY_SUGGESTIONS).toEqual(['Familia', 'Amigos', 'Trabajo', 'Encuentro']);
    expect(screen.getAllByRole('button').map((node) => node.props.accessibilityLabel)).toEqual([
      'Familia',
      'Amigos',
      'Trabajo',
      'Encuentro',
    ]);
  });

  test('a press calls onSelect with the word', async () => {
    const onSelect = jest.fn();
    await render(<CategorySuggestions onSelect={onSelect} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Trabajo' }));
    expect(onSelect).toHaveBeenCalledWith('Trabajo');
  });

  test.each(['light', 'dark'] as const)('buttons are at least 44 points tall, in %s colors', async (scheme) => {
    setMockColorScheme(scheme);
    await render(<CategorySuggestions onSelect={jest.fn()} />);
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveStyle({
        minHeight: Layout.touchTarget,
        backgroundColor: Colors[scheme].surfaceMuted,
        borderColor: Colors[scheme].primaryDark,
        borderWidth: Layout.borderWidth,
      });
    }
    expect(screen.getByText('Familia')).toHaveStyle({ color: Colors[scheme].textMain });
  });

  test('the row wraps, and tablets use the tablet control height', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await render(<CategorySuggestions onSelect={jest.fn()} />);
    expect(screen.getAllByRole('button')[0].parent).toHaveStyle({ flexWrap: 'wrap' });
    expect(screen.getByRole('button', { name: 'Familia' })).toHaveStyle({
      minHeight: Sizes.tablet.controlHeight,
    });
  });
});
