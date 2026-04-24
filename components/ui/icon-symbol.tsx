// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'gearshape.fill': 'settings',
  'folder.fill': 'folder',
  'doc.text.fill': 'description',
  'arrow.clockwise': 'refresh',
  'plus': 'add',
  'xmark': 'close',
  'checkmark': 'check',
  'pencil': 'edit',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'trash': 'delete',
  'doc.on.doc': 'content-copy',
  'exclamationmark.triangle.fill': 'warning',
  'arrow.uturn.backward': 'undo',
  'arrow.uturn.forward': 'redo',
  'tag': 'label',
  'paperclip': 'attach-file',
  'keyboard.chevron.compact.down': 'keyboard-hide',
  'textformat': 'format-size',
  'list.bullet': 'format-list-bulleted',
  'link': 'link',
} as const satisfies IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
