import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlertsScreen } from '../screens/AlertsScreen';
import { AlertDetailScreen } from '../screens/AlertDetailScreen';
import { useAppTheme } from '../theme/ThemeContext';
import type { AlertsStackParamList } from './types';

const Stack = createNativeStackNavigator<AlertsStackParamList>();

export function AlertsStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.tabBar },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="AlertsList" component={AlertsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{ title: 'Alert', headerBackTitle: 'Alerts' }}
      />
    </Stack.Navigator>
  );
}
