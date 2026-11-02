import { StyleSheet, Text } from 'react-native';

import { CardActions, ItemCardFrame } from '@/components/item-card-frame';
import { PhotoPreview } from '@/components/photo-preview';
import { Layout } from '@/constants/theme';
import { usePhotoUri } from '@/hooks/use-photo-uri';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';
import type { ImageItem } from '@/items/domain/image-item';

/**
 * An image item in the Timeline: the photo whole on its backdrop, the caption in italic
 * muted text when there is one, then the Editar and Compartir actions. Screen readers get
 * the photo as an image named by its alternative text, else its caption, else "Foto".
 */
export function ImageItemCard({ item, onEdit }: { item: ImageItem; onEdit: () => void }) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const uri = usePhotoUri(item.photo.file);

  return (
    <ItemCardFrame testID="image-item-card">
      <PhotoPreview
        uri={uri}
        width={item.photo.width}
        height={item.photo.height}
        label={item.altText ?? item.caption ?? 'Foto'}
      />
      {item.caption ? (
        <Text
          testID="image-item-caption"
          style={[
            styles.caption,
            { fontSize: sizes.captionText, lineHeight: sizes.captionText * 1.5, color: theme.textMuted },
          ]}>
          {item.caption}
        </Text>
      ) : null}
      <CardActions onEdit={onEdit} />
    </ItemCardFrame>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontStyle: 'italic',
    marginTop: Layout.photoGap,
  },
});
