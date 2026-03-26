import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsStack } from './TransactionsStack';
import { GoalsStack } from './GoalsStack';
import { AlertsStack } from './AlertsStack';
import { AiCoachScreen } from '../screens/AiCoachScreen';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const iconForRoute: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  Transactions: 'list-outline',
  Goals: 'flag-outline',
  Alerts: 'notifications-outline',
  AiCoach: 'chatbubble-ellipses-outline',
};

export function RootTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconForRoute[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsStack} options={{ title: 'Transactions' }} />
      <Tab.Screen name="Goals" component={GoalsStack} />
      <Tab.Screen name="Alerts" component={AlertsStack} />
      <Tab.Screen name="AiCoach" component={AiCoachScreen} options={{ title: 'AI Coach' }} />
    </Tab.Navigator>
  );
}
