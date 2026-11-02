import { render, screen } from '@testing-library/react-native';

import { FieldLabel } from '@/components/field-label';
import { Colors, Sizes } from '@/constants/theme';
import { setMockColorScheme } from '@/test-utils/test-values';

describe('FieldLabel', () => {
  test.each(['light', 'dark'] as const)('shows the label and the hint in %s colors', async (scheme) => {
    setMockColorScheme(scheme);
    await render(<FieldLabel label="Texto alternativo" hint="Describe la foto." />);

    expect(screen.getByText('Texto alternativo')).toHaveStyle({
      color: Colors[scheme].textMain,
      fontSize: Sizes.phone.fieldLabel,
      fontWeight: '700',
    });
    expect(screen.getByText('Describe la foto.', { includeHiddenElements: true })).toHaveStyle({
      color: Colors[scheme].textMuted,
      fontSize: Sizes.phone.fieldHint,
    });
  });

  test('the hint is left to the field, so screen readers do not read it twice', async () => {
    await render(<FieldLabel label="Texto alternativo" hint="Describe la foto." />);
    expect(screen.queryByText('Describe la foto.')).toBeNull();
    expect(screen.getByText('Describe la foto.', { includeHiddenElements: true })).toBeTruthy();
  });

  test('without a hint only the label shows', async () => {
    await render(<FieldLabel label="Pie de foto" />);
    expect(screen.getByText('Pie de foto')).toBeOnTheScreen();
  });
});
