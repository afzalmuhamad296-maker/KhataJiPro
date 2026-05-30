import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, language, t, updateSettings, setLanguage } = useApp();

  const settingsGroups = [
    {
      title: 'TOOLS',
      items: [
        { icon: 'mic' as const, label: 'Voice Entry', color: '#7C3AED', onPress: () => router.push('/voice-entry') },
        { icon: 'smart-toy' as const, label: 'AI Chat', color: '#0D7C4A', onPress: () => router.push('/chat-assistant') },
        { icon: 'receipt-long' as const, label: 'Invoice', color: '#D97706', onPress: () => router.push('/invoice') },
        { icon: 'notifications' as const, label: 'Reminders', color: '#DC2626', onPress: () => router.push('/reminders') },
        { icon: 'repeat' as const, label: 'Recurring', color: '#2563EB', onPress: () => router.push('/recurring') },
        { icon: 'inventory' as const, label: 'Stock', color: '#059669', onPress: () => router.push('/stock') },
        { icon: 'local-shipping' as const, label: 'Suppliers', color: '#7C3AED', onPress: () => router.push('/suppliers') },
      ],
    },
    {
      title: 'REPORTS & DATA',
      items: [
        { icon: 'assessment' as const, label: 'Sales Report', color: '#2563EB', onPress: () => router.push('/sales-report') },
        { icon: 'account-balance-wallet' as const, label: 'Expenses', color: '#DC2626', onPress: () => router.push('/expense-tracker') },
        { icon: 'description' as const, label: 'Statement', color: '#059669', onPress: () => router.push('/customer-statement') },
        { icon: 'auto-awesome' as const, label: 'AI Insights', color: '#BE185D', onPress: () => router.push('/insights') },
        { icon: 'send' as const, label: 'Bulk SMS', color: '#0891B2', onPress: () => router.push('/bulk-sms') },
        { icon: 'link' as const, label: 'Pay Links', color: '#4F46E5', onPress: () => router.push('/pay-link') },
        { icon: 'credit-card' as const, label: 'Payment Methods', color: '#D97706', onPress: () => router.push('/payment-methods') },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { icon: 'lock' as const, label: 'App Lock', color: '#DC2626', onPress: () => router.push('/app-lock') },
      ],
    },
    {
      title: 'DATA MANAGEMENT',
      items: [
        { icon: 'backup' as const, label: 'Backup & Restore', color: '#2563EB', onPress: () => router.push('/more-features') },
        { icon: 'file-download' as const, label: 'Import/Export', color: '#059669', onPress: () => router.push('/more-features') },
        { icon: 'business' as const, label: 'Multi-Business', color: '#7C3AED', onPress: () => router.push('/more-features') },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        { icon: 'share' as const, label: 'Share App', color: '#0891B2', onPress: () => router.push('/more-features') },
        { icon: 'star' as const, label: 'Rate App', color: '#D97706', onPress: () => router.push('/more-features') },
        { icon: 'campaign' as const, label: 'Announcements', color: '#BE185D', onPress: () => router.push('/more-features') },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings}</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#0D7C4A', '#065F37']}
            style={styles.profileAvatar}
          >
            <MaterialIcons name="store" size={28} color="#FFF" />
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{settings.shopName}</Text>
            <Text style={styles.profileOwner}>{settings.ownerName}</Text>
            <Text style={styles.profilePhone}>{settings.phone}</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}>
            <MaterialIcons name="edit" size={16} color={theme.primary} />
          </Pressable>
        </View>

        {/* Language Switcher */}
        <Pressable
          style={({ pressed }) => [styles.langCard, pressed && { opacity: 0.9 }]}
          onPress={() => setLanguage(language === 'en' ? 'ur' : 'en')}
        >
          <View style={styles.langLeft}>
            <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.langIcon}>
              <MaterialIcons name="translate" size={20} color="#2563EB" />
            </LinearGradient>
            <View>
              <Text style={styles.langTitle}>Language</Text>
              <Text style={styles.langCurrent}>{language === 'en' ? 'English' : 'اردو (Urdu)'}</Text>
            </View>
          </View>
          <View style={styles.langToggle}>
            <Text style={styles.langToggleText}>{language === 'en' ? 'اردو' : 'EN'}</Text>
          </View>
        </Pressable>

        {/* SMS Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.langIcon}>
              <MaterialIcons name="sms" size={20} color="#059669" />
            </LinearGradient>
            <View>
              <Text style={styles.langTitle}>{t.sendSMS}</Text>
              <Text style={styles.langCurrent}>Automatic reminders</Text>
            </View>
          </View>
          <Switch
            value={settings.smsReminders}
            onValueChange={(val) => updateSettings({ smsReminders: val })}
            trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
            thumbColor={settings.smsReminders ? '#16A34A' : '#94A3B8'}
          />
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.settingRow,
                    index < group.items.length - 1 && styles.settingRowBorder,
                    pressed && { backgroundColor: theme.borderLight },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIconWrap, { backgroundColor: item.color + '14' }]}>
                      <MaterialIcons name={item.icon} size={18} color={item.color} />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textLight} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Version */}
        <Text style={styles.version}>KhataJi Pro v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.textDark,
    letterSpacing: -0.3,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textDark,
  },
  profileOwner: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  langCurrent: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  langToggle: {
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  langToggleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    minHeight: 54,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: theme.textDark,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 28,
  },
});
