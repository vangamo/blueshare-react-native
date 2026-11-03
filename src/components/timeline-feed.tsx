import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';

import { CreationBox } from '@/components/creation-box';
import { EditEventDialog } from '@/components/edit-event-dialog';
import { EditImageDialog } from '@/components/edit-image-dialog';
import { EventItemCard } from '@/components/event-item-card';
import { EditTextDialog } from '@/components/edit-text-dialog';
import { ImageItemCard } from '@/components/image-item-card';
import { TextItemCard } from '@/components/text-item-card';
import { FontSize } from '@/constants/theme';
import { useCreationBox } from '@/hooks/use-creation-box';
import { useContentStyle } from '@/hooks/use-content-style';
import { useTheme } from '@/hooks/use-theme';
import { useTimeline, type TimelineItem } from '@/hooks/use-timeline';

export const EMPTY_TIMELINE_MESSAGE = 'Sin publicaciones todavía. Pulsa en el botón + para crear una.';
export const LOAD_ERROR_MESSAGE = '⚠️ No se pudieron cargar las publicaciones.';

/**
 * The Timeline section: the creation box (while open) above the items, newest
 * first. Shows an empty message, nothing while loading, or a load error.
 */
export function TimelineFeed() {
  const theme = useTheme();
  const contentStyle = useContentStyle();
  const { status, items } = useTimeline();
  const { box, openCount, dispatch } = useCreationBox();
  const focused = useIsFocused();
  const listRef = useRef<FlatList<TimelineItem>>(null);
  const boxOpen = box.step !== 'closed';
  // Only the id is kept: the item is derived, so a deleted item closes the dialog by itself.
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = items.find((item) => item.id === editingId);

  // Each open scrolls to the top so the box is visible. Imperative, no state change.
  useEffect(() => {
    if (openCount > 0) listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [openCount]);

  // While the box is on screen, Android back acts like Cancelar. Listeners run newest
  // first, so this one runs before React Navigation's. On other tabs nothing is
  // registered and back returns to Timeline as usual.
  useEffect(() => {
    if (!focused || !boxOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss();
      dispatch({ type: 'close' });
      return true;
    });
    return () => subscription.remove();
  }, [focused, boxOpen, dispatch]);

  useEffect(() => {
    if (status === 'error' && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(LOAD_ERROR_MESSAGE);
    }
  }, [status]);

  const messageStyle = [styles.message, { color: theme.textSecondary }];
  let empty = null;
  if (status === 'error') {
    empty = (
      <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={messageStyle}>
        {LOAD_ERROR_MESSAGE}
      </Text>
    );
  } else if (status === 'ready' && !boxOpen) {
    empty = <Text style={messageStyle}>{EMPTY_TIMELINE_MESSAGE}</Text>;
  }

  return (
    <>
      <FlatList
        ref={listRef}
        testID="timeline-feed"
        data={status === 'error' ? [] : items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const onEdit = () => setEditingId(item.id);
          if (item.type === 'text') return <TextItemCard item={item} onEdit={onEdit} />;
          if (item.type === 'image') return <ImageItemCard item={item} onEdit={onEdit} />;
          return <EventItemCard item={item} onEdit={onEdit} />;
        }}
        // Always the same component type, so the text area never remounts (and loses
        // focus) while typing. It renders nothing while the box is closed.
        ListHeaderComponent={<CreationBox />}
        ListEmptyComponent={empty ?? undefined}
        keyboardShouldPersistTaps="handled"
        style={[styles.list, { backgroundColor: theme.backgroundMain }]}
        contentContainerStyle={contentStyle}
      />
      {editing?.type === 'text' ? (
        <EditTextDialog key={editing.id} item={editing} onClose={() => setEditingId(null)} />
      ) : null}
      {editing?.type === 'image' ? (
        <EditImageDialog key={editing.id} item={editing} onClose={() => setEditingId(null)} />
      ) : null}
      {editing?.type === 'event' ? (
        <EditEventDialog key={editing.id} item={editing} onClose={() => setEditingId(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  message: {
    fontSize: FontSize.body,
  },
});
