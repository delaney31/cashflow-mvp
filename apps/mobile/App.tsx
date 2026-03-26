import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import type { HealthStatus } from '@cashflow/shared';
import { AppText } from '@cashflow/ui';

const demoHealth: HealthStatus = {
  ok: true,
  service: 'mobile',
  timestamp: new Date().toISOString(),
};

export default function App() {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Cashflow MVP</AppText>
      <AppText style={styles.subtitle}>
        Shared types wired: {demoHealth.service} ({demoHealth.ok ? 'ok' : 'down'})
      </AppText>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
