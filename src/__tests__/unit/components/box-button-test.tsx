import { fireEvent, render, screen } from '@testing-library/react-native';

import { BoxButton } from '@/components/box-button';
import { Colors, Layout } from '@/constants/theme';
import { setMockColorScheme } from '@/test-utils/test-values';

describe('BoxButton', () => {
  test('is at least a touch target tall and labeled by its text', async () => {
    await render(<BoxButton label="Guardar" variant="primary" onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveStyle({ minHeight: Layout.touchTarget, borderRadius: Layout.controlRadius });
    expect(screen.getByText('Guardar')).toBeOnTheScreen();
  });

  describe.each(['light', 'dark'] as const)('%s palette', (scheme) => {
    beforeEach(() => setMockColorScheme(scheme));

    test('primary uses the active-tab blue and the on-primary label', async () => {
      const colors = Colors[scheme];
      await render(<BoxButton label="Crear" variant="primary" onPress={() => {}} />);
      expect(screen.getByRole('button', { name: 'Crear' })).toHaveStyle({
        backgroundColor: colors.primaryBlueHover,
      });
      expect(screen.getByText('Crear')).toHaveStyle({ color: colors.onPrimary, fontWeight: '700' });
    });

    test('secondary uses the muted surface, a dark border and the main text', async () => {
      const colors = Colors[scheme];
      await render(<BoxButton label="Cancelar" variant="secondary" onPress={() => {}} />);
      expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveStyle({
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderDark,
        borderWidth: Layout.borderWidth,
      });
      expect(screen.getByText('Cancelar')).toHaveStyle({ color: colors.textMain });
    });

    test('danger is solid danger with the on-danger label', async () => {
      const colors = Colors[scheme];
      await render(<BoxButton label="Sí, borrar" variant="danger" onPress={() => {}} />);
      const button = screen.getByRole('button', { name: 'Sí, borrar' });
      expect(button).toHaveStyle({
        backgroundColor: colors.danger,
        minHeight: Layout.touchTarget,
      });
      expect(screen.getByText('Sí, borrar')).toHaveStyle({ color: colors.onDanger });
    });

    test('dangerOutline is the muted surface with a danger border and label', async () => {
      const colors = Colors[scheme];
      await render(<BoxButton label="Borrar este texto" variant="dangerOutline" onPress={() => {}} />);
      const button = screen.getByRole('button', { name: 'Borrar este texto' });
      expect(button).toHaveStyle({
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.danger,
        borderWidth: Layout.borderWidth,
        minHeight: Layout.touchTarget,
      });
      expect(screen.getByText('Borrar este texto')).toHaveStyle({ color: colors.danger });
    });
  });

  test('disabled is faded, announced as disabled and ignores presses', async () => {
    const onPress = jest.fn();
    await render(<BoxButton label="Guardar" variant="primary" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveStyle({ opacity: Layout.disabledOpacity });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  test('enabled calls onPress', async () => {
    const onPress = jest.fn();
    await render(<BoxButton label="Guardar" variant="primary" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toBeEnabled();
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
