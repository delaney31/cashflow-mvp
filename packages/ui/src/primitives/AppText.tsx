import { Text, type TextProps } from 'react-native';

export type AppTextProps = TextProps;

/** Shared typography primitive; theme tokens can be layered here later */
export function AppText(props: AppTextProps) {
  return <Text {...props} />;
}
