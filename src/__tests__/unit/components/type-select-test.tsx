import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { TYPE_SELECT_PLACEHOLDER, TypeSelect } from '@/components/type-select';
import { Colors, Frames, Layout, Sizes } from '@/constants/theme';
import type { ItemType } from '@/hooks/use-timeline';
import { TEST_INSETS, TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';

function Harness({ initial = null }: { initial?: ItemType | null }) {
  const [value, setValue] = useState<ItemType | null>(initial);
  return <TypeSelect value={value} onChange={setValue} />;
}

function field() {
  return screen.getByRole('button', { name: 'Crear nuevo elemento' });
}

describe('TypeSelect', () => {
  test('shows the placeholder value until a type is chosen', async () => {
    await render(<Harness />);
    expect(field()).toHaveAccessibilityValue({ text: TYPE_SELECT_PLACEHOLDER });
    expect(screen.getByText('Selecciona una opción')).toBeOnTheScreen();
    expect(screen.getByText('▾')).toBeOnTheScreen();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  test('is a 44-point field with a strong border on the card background', async () => {
    await render(<Harness />);
    expect(field()).toHaveStyle({
      minHeight: Layout.touchTarget,
      borderWidth: Layout.borderWidth,
      borderRadius: Layout.controlRadius,
      borderColor: Colors.light.primaryDark,
      backgroundColor: Colors.light.cardBg,
    });
    expect(screen.getByText(TYPE_SELECT_PLACEHOLDER)).toHaveStyle({
      fontSize: 16,
      fontWeight: '600',
      color: Colors.light.textMain,
    });
  });

  test('the list has exactly Evento, Texto and Imagen, in order, without the placeholder', async () => {
    await render(<Harness />);
    await fireEvent.press(field());
    const options = screen.getAllByRole('radio');
    expect(options.map((option) => option.props.accessibilityLabel)).toEqual([
      '📅 Evento',
      '📝 Texto',
      '📷 Imagen',
    ]);
    for (const option of options) {
      expect(option).toHaveStyle({ minHeight: Sizes.phone.optionRow });
    }
  });

  test('picking an option closes the list and updates the value', async () => {
    await render(<Harness />);
    await fireEvent.press(field());
    await fireEvent.press(screen.getByRole('radio', { name: '📷 Imagen' }));
    expect(screen.queryByRole('radio')).toBeNull();
    expect(field()).toHaveAccessibilityValue({ text: '📷 Imagen' });
  });

  test('options show their checked state', async () => {
    await render(<Harness initial="text" />);
    await fireEvent.press(field());
    expect(screen.getByRole('radio', { name: '📝 Texto' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '📅 Evento' })).not.toBeChecked();
    expect(screen.getByText('✓')).toBeOnTheScreen();
  });

  test('tapping the backdrop closes only the list and keeps the value', async () => {
    await render(<Harness initial="text" />);
    await fireEvent.press(field());
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar lista' }));
    expect(screen.queryByRole('radio')).toBeNull();
    expect(field()).toHaveAccessibilityValue({ text: '📝 Texto' });
  });

  test("the Modal's onRequestClose (Android back) closes only the list", async () => {
    await render(<Harness initial="text" />);
    await fireEvent.press(field());
    await fireEvent(screen.getByTestId('type-select-list'), 'requestClose');
    expect(screen.queryByRole('radio')).toBeNull();
    expect(field()).toHaveAccessibilityValue({ text: '📝 Texto' });
  });
});

describe('TypeSelect, other layouts', () => {
  test('tablet: taller field and 60-point rows', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await render(<Harness />);
    expect(field()).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    await fireEvent.press(field());
    for (const option of screen.getAllByRole('radio')) {
      expect(option).toHaveStyle({ minHeight: Sizes.tablet.optionRow });
    }
  });

  test('phone landscape: the list is the content column wide, centered, clear of the insets', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await render(<Harness />);
    await fireEvent.press(field());
    const sheet = screen.getAllByRole('radio')[0].parent!;
    expect(sheet).toHaveStyle({ width: Frames['phone-landscape'].column, alignSelf: 'center' });
    expect(sheet.parent).toHaveStyle({
      paddingTop: TEST_INSETS.top + 24,
      paddingBottom: TEST_INSETS.bottom + 24,
    });
  });
});
