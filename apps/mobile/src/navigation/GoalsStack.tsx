import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalsScreen } from '../screens/GoalsScreen';
import { GoalFormScreen } from '../screens/GoalFormScreen';
import { useAppTheme } from '../theme/ThemeContext';
import type { GoalsStackParamList } from './types';

const Stack = createNativeStackNavigator<GoalsStackParamList>();

export function GoalsStack() {
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
      <Stack.Screen name="GoalsList" component={GoalsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="GoalForm"
        component={GoalFormScreen}
        options={({ route }) => ({
          title: route.params?.goalId ? 'Edit goal' : 'New goal',
          headerBackTitle: 'Goals',
        })}
      />
    </Stack.Navigator>
  );
}
