import { View, type ViewProps } from 'react-native';

import { radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme-color';

export type CardProps = ViewProps & {
  padded?: boolean;
  inset?: number;
  raised?: boolean;
};

export function Card({ style, padded = true, inset = 16, raised = false, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: raised ? theme.raised : theme.surface,
          borderColor: theme.borderSoft,
          borderWidth: 1,
          borderRadius: radii.xl,
          padding: padded ? inset : 0,
        },
        style,
      ]}
    />
  );
}
