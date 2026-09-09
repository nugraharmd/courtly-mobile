import { Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { theme } from '../../src/utils';

const TAB_ICONS: Record<string, string> = {
  index: '🔍',
  bookings: '📅',
  profile: '👤',
};

function TabIcon({ route, focused, color }: { route: string; focused: boolean; color: string }) {
  return (
    <Text style={[styles.icon, { opacity: focused ? 1 : 0.85, color }]}>
      {TAB_ICONS[route] ?? '•'}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: ({ focused, color }) => (
          <TabIcon route={route.name} focused={focused} color={color as string} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Explore', headerTitle: 'Courtly' }} />
      <Tabs.Screen name="bookings" options={{ title: 'My Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 21, fontWeight: '800' },
});
