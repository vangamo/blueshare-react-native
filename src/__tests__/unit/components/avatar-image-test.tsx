import { configure, fireEvent, render, screen } from '@testing-library/react-native';

import { AVATAR_EMOJI, AvatarImage } from '@/components/avatar-image';
import { Colors, Layout, Sizes } from '@/constants/theme';
import { setMockColorScheme } from '@/test-utils/test-values';

const URI = 'file:///photos/a.jpg';

describe('AvatarImage', () => {
  // The unlabelled circle is hidden from screen readers on purpose, so queries must see it.
  beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
  afterAll(() => configure({ defaultIncludeHiddenElements: false }));

  test('shows the emoji when there is no photo', async () => {
    await render(<AvatarImage uri={null} size={42} emojiSize={20} />);
    expect(screen.getByTestId('avatar-image-emoji')).toHaveTextContent(AVATAR_EMOJI);
    expect(screen.getByTestId('avatar-image-emoji')).toHaveStyle({ fontSize: 20 });
    expect(screen.queryByTestId('avatar-image-photo')).toBeNull();
  });

  test('shows the photo cropped to fill the circle', async () => {
    await render(<AvatarImage uri={URI} size={42} emojiSize={20} />);
    expect(screen.getByTestId('avatar-image-photo')).toHaveProp('contentFit', 'cover');
    expect(screen.getByTestId('avatar-image-photo')).toHaveProp('source', [{ uri: URI }]);
    expect(screen.queryByTestId('avatar-image-emoji')).toBeNull();
  });

  test('falls back to the emoji after an error, and tries a different photo again', async () => {
    const { rerender } = await render(<AvatarImage uri={URI} size={42} emojiSize={20} />);
    await fireEvent(screen.getByTestId('avatar-image-photo'), 'error', { nativeEvent: { error: 'x' } });
    expect(screen.getByTestId('avatar-image-emoji')).toBeOnTheScreen();

    await rerender(<AvatarImage uri="file:///photos/b.jpg" size={42} emojiSize={20} />);
    expect(screen.getByTestId('avatar-image-photo')).toBeOnTheScreen();
  });

  test('with a label it is an image with that name; without one it is hidden', async () => {
    const { rerender } = await render(
      <AvatarImage uri={URI} size={42} emojiSize={20} label="Foto de perfil" />,
    );
    expect(screen.getByRole('image', { name: 'Foto de perfil' })).toBeOnTheScreen();

    await rerender(<AvatarImage uri={URI} size={42} emojiSize={20} />);
    expect(screen.getByTestId('avatar-image')).toHaveProp(
      'importantForAccessibility',
      'no-hide-descendants',
    );
  });

  test.each(['light', 'dark'] as const)('size and colors come from the props and the theme (%s)', async (scheme) => {
    setMockColorScheme(scheme);
    const size = Sizes.phone.profileAvatar;
    await render(<AvatarImage uri={null} size={size} emojiSize={Sizes.phone.profileAvatarEmoji} />);
    expect(screen.getByTestId('avatar-image')).toHaveStyle({
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: Layout.borderWidth,
      backgroundColor: Colors[scheme].avatarBg,
      borderColor: Colors[scheme].primaryDark,
    });
  });
});
