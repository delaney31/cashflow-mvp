import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { useAppTheme } from '../theme/ThemeContext';
import type { TransactionsStackParamList } from './types';

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsStack() {
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
      <Stack.Screen name="TransactionsList" component={TransactionsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{ title: 'Transaction', headerBackTitle: 'List' }}
      />
    </Stack.Navigator>
  );
}
