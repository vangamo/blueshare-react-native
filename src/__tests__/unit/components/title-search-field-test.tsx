import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard, TextInput } from 'react-native';

import { TitleSearchField } from '@/components/title-search-field';
import { Colors, Layout } from '@/constants/theme';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';

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

  describe('keyboard hide', () => {
    type Handlers = Record<string, () => void>;

    /** Captures the Keyboard listeners so the test can fire them. */
    function captureKeyboard(): Handlers {
      const handlers: Handlers = {};
      jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: () => void) => {
        handlers[event] = handler;
        return { remove: jest.fn() };
      }) as unknown as typeof Keyboard.addListener);
      return handlers;
    }

    // Jest's TextInput mock puts `blur` (a jest.fn) on its prototype.
    const blur = (TextInput as unknown as { prototype: { blur: jest.Mock } }).prototype.blur;

    beforeEach(() => {
      jest.useFakeTimers();
      blur.mockClear();
    });
    afterEach(() => jest.useRealTimers());

    async function focusedField() {
      const handlers = captureKeyboard();
      await setup();
      await fireEvent(field(), 'focus');
      return handlers;
    }

    test('a hide alone blurs after the grace period and restores "BlueShare"', async () => {
      const handlers = await focusedField();
      await act(async () => handlers.keyboardDidHide());
      expect(blur).not.toHaveBeenCalled();
      await act(async () => jest.advanceTimersByTime(Layout.keyboardHideGraceMs));
      expect(blur).toHaveBeenCalledTimes(1);
      // The real blur event then restores the rest state.
      await fireEvent(field(), 'blur');
      expect(field()).toHaveDisplayValue('BlueShare');
    });

    test('a hide then show within the grace period keeps focus', async () => {
      const handlers = await focusedField();
      await act(async () => handlers.keyboardDidHide());
      await act(async () => handlers.keyboardDidShow());
      await act(async () => jest.advanceTimersByTime(Layout.keyboardHideGraceMs * 2));
      expect(blur).not.toHaveBeenCalled();
    });

    test('a hide followed by a window change does not blur', async () => {
      const handlers = await focusedField();
      await act(async () => handlers.keyboardDidHide());
      await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));
      await act(async () => jest.advanceTimersByTime(Layout.keyboardHideGraceMs * 2));
      expect(blur).not.toHaveBeenCalled();
    });

    test('unmounting during the grace period does not throw', async () => {
      const handlers = await focusedField();
      await act(async () => handlers.keyboardDidHide());
      await screen.unmount();
      expect(() => jest.advanceTimersByTime(Layout.keyboardHideGraceMs * 2)).not.toThrow();
      expect(blur).not.toHaveBeenCalled();
    });
  });
});
