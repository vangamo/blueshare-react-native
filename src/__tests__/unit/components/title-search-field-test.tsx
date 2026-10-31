import { fireEvent, render, screen } from '@testing-library/react-native';

import { TitleSearchField } from '@/components/title-search-field';
import { Colors } from '@/constants/theme';

const colors = Colors.light;

function field() {
  return screen.getByLabelText('Search');
}

async function setup() {
  await render(<TitleSearchField />);
  return field();
}

describe('TitleSearchField', () => {
  test('shows "BlueShare" centered with the rest style', async () => {
    await setup();
    expect(field()).toHaveDisplayValue('BlueShare');
    expect(field()).toHaveStyle({
      textAlign: 'center',
      borderColor: colors.primaryDark,
      backgroundColor: colors.surfaceMuted,
      color: colors.textMain,
      height: 42,
      borderWidth: 2,
      borderRadius: 12,
      fontSize: 16,
      fontWeight: '700',
    });
  });

  test('focus clears "BlueShare" and shows the placeholder and focused style', async () => {
    await setup();
    await fireEvent(field(), 'focus');
    expect(field()).toHaveDisplayValue('');
    expect(field().props.placeholder).toBe('Buscar...');
    expect(field().props.placeholderTextColor).toBe(colors.textMuted);
    expect(field()).toHaveStyle({
      textAlign: 'left',
      borderColor: colors.primaryBlue,
      backgroundColor: colors.cardBg,
    });
  });

  test('blur with an empty field restores "BlueShare"', async () => {
    await setup();
    await fireEvent(field(), 'focus');
    await fireEvent(field(), 'blur');
    expect(field()).toHaveDisplayValue('BlueShare');
    expect(field()).toHaveStyle({ textAlign: 'center', borderColor: colors.primaryDark });
  });

  test('blur with only spaces restores "BlueShare"', async () => {
    await setup();
    await fireEvent(field(), 'focus');
    await fireEvent.changeText(field(), '   ');
    await fireEvent(field(), 'blur');
    expect(field()).toHaveDisplayValue('BlueShare');
    // Focusing again starts empty, not with the old spaces.
    await fireEvent(field(), 'focus');
    expect(field()).toHaveDisplayValue('');
  });

  test('blur with "abuela" keeps the text with the rest style', async () => {
    await setup();
    await fireEvent(field(), 'focus');
    await fireEvent.changeText(field(), 'abuela');
    await fireEvent(field(), 'blur');
    expect(field()).toHaveDisplayValue('abuela');
    expect(field()).toHaveStyle({
      textAlign: 'center',
      borderColor: colors.primaryDark,
      backgroundColor: colors.surfaceMuted,
    });
  });

  test('focus with other text keeps it', async () => {
    await setup();
    await fireEvent(field(), 'focus');
    await fireEvent.changeText(field(), 'abuela');
    await fireEvent(field(), 'blur');
    await fireEvent(field(), 'focus');
    expect(field()).toHaveDisplayValue('abuela');
    expect(field()).toHaveStyle({ borderColor: colors.primaryBlue });
  });

  test('submitting does nothing', async () => {
    await setup();
    await fireEvent(field(), 'focus');
    await fireEvent.changeText(field(), 'abuela');
    await fireEvent(field(), 'submitEditing');
    expect(field()).toHaveDisplayValue('abuela');
    expect(field().props.returnKeyType).toBe('search');
  });
});
