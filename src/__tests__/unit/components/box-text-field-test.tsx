import { fireEvent, render, screen } from '@testing-library/react-native';

import { BoxTextField } from '@/components/box-text-field';
import { Colors, Layout, Sizes } from '@/constants/theme';
import { setMockColorScheme } from '@/test-utils/test-values';

describe('BoxTextField', () => {
  test('limits the length and names the field with its hint', async () => {
    await render(
      <BoxTextField
        value=""
        onChangeText={() => {}}
        accessibilityLabel="Pie de foto"
        accessibilityHint="Opcional"
        maxLength={500}
      />,
    );
    const field = screen.getByLabelText('Pie de foto');
    expect(field).toHaveProp('maxLength', 500);
    expect(field).toHaveProp('accessibilityHint', 'Opcional');
  });

  test('reports typed text', async () => {
    const onChangeText = jest.fn();
    await render(
      <BoxTextField value="" onChangeText={onChangeText} accessibilityLabel="Pie de foto" maxLength={5} />,
    );
    await fireEvent.changeText(screen.getByLabelText('Pie de foto'), 'Hola');
    expect(onChangeText).toHaveBeenCalledWith('Hola');
  });

  test.each(['light', 'dark'] as const)('is at least 44 points tall with %s colors', async (scheme) => {
    setMockColorScheme(scheme);
    await render(
      <BoxTextField value="x" onChangeText={() => {}} accessibilityLabel="Pie de foto" maxLength={5} />,
    );
    expect(screen.getByLabelText('Pie de foto')).toHaveStyle({
      minHeight: Sizes.phone.controlHeight,
      borderWidth: Layout.borderWidth,
      borderColor: Colors[scheme].primaryDark,
      backgroundColor: Colors[scheme].cardBg,
      color: Colors[scheme].textMain,
    });
    expect(Sizes.phone.controlHeight).toBeGreaterThanOrEqual(Layout.touchTarget);
  });
});
