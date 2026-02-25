import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          tabBarLabel: 'Scanner',
          tabBarIcon: ({ color }) => <TabIcon label="⟳" color={color} />,
          headerTitle: '⛏ CKB Scanner',
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarLabel: 'Monitor',
          tabBarIcon: ({ color }) => <TabIcon label="◉" color={color} />,
          headerTitle: '◉ Node Monitor',
        }}
      />
      <Tabs.Screen
        name="stratum"
        options={{
          title: 'Stratum',
          tabBarLabel: 'Stratum',
          tabBarIcon: ({ color }) => <TabIcon label="⚡" color={color} />,
          headerTitle: '⚡ Stratum Manager',
        }}
      />
    </Tabs>
  );
}

// Minimal text icon component since we're not using vector icons
import { Text } from 'react-native';
function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{label}</Text>;
}
