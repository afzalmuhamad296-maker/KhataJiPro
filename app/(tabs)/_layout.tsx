import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { FloatingVoiceButton } from '../../components/FloatingVoiceButton';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t, currentTheme } = useApp();

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 62,
      android: insets.bottom + 62,
      default: 72,
    }),
    paddingTop: 10,
    paddingBottom: Platform.select({
      ios: insets.bottom + 8,
      android: insets.bottom + 8,
      default: 10,
    }),
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  };

  const activeColor = currentTheme.primary;
  const activeBg = currentTheme.primary + '14';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: currentTheme.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.home,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? { backgroundColor: activeBg, borderRadius: 12, padding: 6 } : { padding: 6 }}>
                <MaterialIcons name="home-filled" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="customers"
          options={{
            title: t.customers,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? { backgroundColor: activeBg, borderRadius: 12, padding: 6 } : { padding: 6 }}>
                <MaterialIcons name="people" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="udhaar"
          options={{
            title: t.udhaar,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? { backgroundColor: activeBg, borderRadius: 12, padding: 6 } : { padding: 6 }}>
                <MaterialIcons name="account-balance-wallet" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: t.reports,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? { backgroundColor: activeBg, borderRadius: 12, padding: 6 } : { padding: 6 }}>
                <MaterialIcons name="bar-chart" size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t.settings,
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? { backgroundColor: activeBg, borderRadius: 12, padding: 6 } : { padding: 6 }}>
                <MaterialIcons name="settings" size={22} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
      <FloatingVoiceButton bottom={Platform.select({ ios: insets.bottom + 78, android: insets.bottom + 78, default: 90 })} right={16} />
    </View>
  );
}
