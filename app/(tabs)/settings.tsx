import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, language, t, updateSettings, setLanguage } = useApp();

  const settingsGroups = [
    {
      title: 'SHOP DETAILS',
      items: [
        { icon: 'store' as const, label: t.shopName, value: settings.shopName, onPress: () => {} },
        { icon: 'person' as const, label: t.ownerName, value: settings.ownerName, onPress: () => {} },
        { icon: 'phone' as const, label: 'Phone', value: settings.phone, onPress: () => {} },
      ],
    },
    {
      title: 'APP SETTINGS',
      items: [
        {
          icon: 'language' as const,
          label: t.language,
          value: language === 'en' ? 'English' : 'اردو',
          onPress: () => setLanguage(language === 'en' ? 'ur' : 'en'),
        },
        {
          icon: 'sms' as const,
          label: t.sendSMS,
          toggle: true,
          toggleValue: settings.smsReminders,
          onToggle: (val: boolean) => updateSettings({ smsReminders: val }),
        },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        { icon: 'lock' as const, label: 'App Lock', value: 'PIN + Biometric', onPress: () => router.push('/app-lock') },
        { icon: 'fingerprint' as const, label: 'Biometric', value: 'Face ID / Fingerprint', onPress: () => router.push('/app-lock') },
      ],
    },
    {
      title: 'TOOLS',
      items: [
        { icon: 'mic' as const, label: 'Voice Entry', value: '', onPress: () => router.push('/voice-entry') },
        { icon: 'smart-toy' as const, label: 'AI Chat', value: '', onPress: () => router.push('/chat-assistant') },
        { icon: 'receipt-long' as const, label: 'Invoice', value: '', onPress: () => router.push('/invoice') },
        { icon: 'notifications' as const, label: 'Reminders', value: '', onPress: () => router.push('/reminders') },
        { icon: 'repeat' as const, label: 'Recurring', value: '', onPress: () => router.push('/recurring') },
        { icon: 'inventory' as const, label: 'Stock', value: '', onPress: () => router.push('/stock') },
        { icon: 'local-shipping' as const, label: 'Suppliers', value: '', onPress: () => router.push('/suppliers') },
      ],
    },
    {
      title: 'REPORTS & DATA',
      items: [
        { icon: 'assessment' as const, label: 'Sales Report', value: '', onPress: () => router.push('/sales-report') },
        { icon: 'account-balance-wallet' as const, label: 'Expenses', value: '', onPress: () => router.push('/expense-tracker') },
        { icon: 'description' as const, label: 'Statement', value: '', onPress: () => router.push('/customer-statement') },
        { icon: 'auto-awesome' as const, label: 'AI Insights', value: '', onPress: () => router.push('/insights') },
        { icon: 'send' as const, label: 'Bulk SMS', value: '', onPress: () => router.push('/bulk-sms') },
        { icon: 'account-balance-wallet' as const, label: 'Payment Methods', value: '', onPress: () => router.push('/payment-methods') },
      ],
    },
    {
      title: 'DATA',
      items: [
        { icon: 'backup' as const, label: t.backup, value: '', onPress: () => router.push('/more-features') },
        { icon: 'file-download' as const, label: t.export, value: '', onPress: () => router.push('/more-features') },
        { icon: 'business' as const, label: 'Multi-Business', value: '', onPress: () => router.push('/more-features') },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        { icon: 'info' as const, label: t.about, value: 'v2.0.0', onPress: () => {} },
        { icon: 'share' as const, label: 'Share App', value: '', onPress: () => router.push('/more-features') },
        { icon: 'star' as const, label: 'Rate App', value: '', onPress: () => router.push('/more-features') },
        { icon: 'campaign' as const, label: 'Announcements', value: '', onPress: () => router.push('/more-features') },
      ],
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings}</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="store" size={32} color="#FFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{settings.shopName}</Text>
            <Text style={styles.profileOwner}>{settings.ownerName}</Text>
            <Text style={styles.profilePhone}>{settings.phone}</Text>
          </View>
          <Pressable style={styles.editButton}>
            <MaterialIcons name="edit" size={18} color={theme.primary} />
          </Pressable>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.settingRow,
                    index < group.items.length - 1 && styles.settingRowBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <MaterialIcons name={item.icon} size={20} color={theme.primary} />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {'toggle' in item && item.toggle ? (
                    <Switch
                      value={item.toggleValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: theme.border, true: theme.primaryLight }}
                      thumbColor={item.toggleValue ? theme.primary : '#f4f3f4'}
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      {item.value ? <Text style={styles.settingValue}>{item.value}</Text> : null}
                      <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Language Toggle Banner */}
        <View style={styles.langBanner}>
          <MaterialIcons name="translate" size={24} color={theme.primary} />
          <View style={styles.langInfo}>
            <Text style={styles.langTitle}>Switch Language</Text>
            <Text style={styles.langSubtitle}>
              Current: {language === 'en' ? 'English' : 'اردو (Urdu)'}
            </Text>
          </View>
          <Pressable
            style={styles.langToggle}
            onPress={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          >
            <Text style={styles.langToggleText}>
              {language === 'en' ? 'اردو' : 'EN'}
            </Text>
          </Pressable>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    ...theme.cardShadow,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
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
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.cardShadow,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    minHeight: 52,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: theme.textDark,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    color: theme.textMuted,
  },
  langBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  langInfo: {
    flex: 1,
    marginLeft: 12,
  },
  langTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  langSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  langToggle: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
  },
  langToggleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
