import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, settings, t, formatCurrency, getTodayStats } = useApp();
  const stats = getTodayStats();

  const recentTransactions = transactions.slice(0, 6);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={['#0D7C4A', '#065F37', '#043D25']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.shopName}>{settings.shopName}</Text>
            </View>
            <Pressable style={styles.notifButton}>
              <MaterialIcons name="notifications-none" size={22} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>

          {/* Stats inside header */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatMain}>
              <Text style={styles.heroStatLabel}>Total Outstanding</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(stats.outstanding)}</Text>
              <Text style={styles.heroStatSub}>{stats.totalCustomers} active customers</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Summary Cards */}
        <View style={styles.floatingCards}>
          <View style={styles.floatingCard}>
            <View style={[styles.floatingCardDot, { backgroundColor: theme.credit }]} />
            <Text style={styles.floatingCardLabel}>{t.todayCredit}</Text>
            <Text style={[styles.floatingCardValue, { color: theme.credit }]}>
              {formatCurrency(stats.todayCredit)}
            </Text>
          </View>
          <View style={styles.floatingCardDivider} />
          <View style={styles.floatingCard}>
            <View style={[styles.floatingCardDot, { backgroundColor: theme.payment }]} />
            <Text style={styles.floatingCardLabel}>{t.todayCollection}</Text>
            <Text style={[styles.floatingCardValue, { color: theme.payment }]}>
              {formatCurrency(stats.todayCollection)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <View style={styles.quickGrid}>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/add-credit')}>
              <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.quickActionIcon}>
                <MaterialIcons name="add-circle-outline" size={24} color={theme.credit} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>{t.addCredit}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/add-payment')}>
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.quickActionIcon}>
                <MaterialIcons name="payments" size={24} color={theme.payment} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>{t.addPayment}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/voice-entry')}>
              <LinearGradient colors={['#F3E8FF', '#E9D5FF']} style={styles.quickActionIcon}>
                <MaterialIcons name="mic" size={24} color="#7C3AED" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Voice</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/qr-scanner')}>
              <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.quickActionIcon}>
                <MaterialIcons name="qr-code-scanner" size={24} color="#2563EB" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>QR Scan</Text>
            </Pressable>
          </View>
          <View style={[styles.quickGrid, { marginTop: 16 }]}>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/chat-assistant')}>
              <LinearGradient colors={['#E8F5ED', '#D1FAE5']} style={styles.quickActionIcon}>
                <MaterialIcons name="smart-toy" size={24} color={theme.primary} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>AI Chat</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/invoice')}>
              <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.quickActionIcon}>
                <MaterialIcons name="receipt-long" size={24} color="#D97706" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Invoice</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/insights')}>
              <LinearGradient colors={['#FCE7F3', '#FBCFE8']} style={styles.quickActionIcon}>
                <MaterialIcons name="auto-awesome" size={24} color="#BE185D" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Insights</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/more-features')}>
              <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.quickActionIcon}>
                <MaterialIcons name="grid-view" size={24} color="#64748B" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>More</Text>
            </Pressable>
          </View>
        </View>

        {/* Top Outstanding Customers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Outstanding</Text>
            <Pressable onPress={() => router.push('/(tabs)/customers')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
            </Pressable>
          </View>
          <View style={styles.customersList}>
            {customers
              .filter(c => c.balance > 0)
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 5)
              .map((customer, index) => (
                <Pressable
                  key={customer.id}
                  style={({ pressed }) => [styles.customerRow, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
                  onPress={() => router.push(`/ledger/${customer.id}`)}
                >
                  <View style={[styles.avatar, { backgroundColor: index % 2 === 0 ? '#E8F5ED' : '#FEF3C7' }]}>
                    <Text style={[styles.avatarText, { color: index % 2 === 0 ? theme.primary : '#D97706' }]}>
                      {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                  </View>
                  <View style={styles.balanceCol}>
                    <Text style={styles.customerBalance}>{formatCurrency(customer.balance)}</Text>
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>Due</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
          <View style={styles.activityCard}>
            {recentTransactions.map((txn, index) => (
              <View key={txn.id} style={[styles.transactionRow, index < recentTransactions.length - 1 && styles.transactionRowBorder]}>
                <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? theme.creditLight : theme.paymentLight }]}>
                  <MaterialIcons
                    name={txn.type === 'credit' ? 'north-east' : 'south-west'}
                    size={16}
                    color={txn.type === 'credit' ? theme.credit : theme.payment}
                  />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{txn.customerName}</Text>
                  <Text style={styles.txnNote}>{txn.note || (txn.type === 'credit' ? t.credit : t.debit)}</Text>
                </View>
                <View style={styles.txnAmountCol}>
                  <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.credit : theme.payment }]}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                  <Text style={styles.txnDate}>{txn.date}</Text>
                </View>
              </View>
            ))}
          </View>
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
  // Header
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  shopName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroStats: {
    marginTop: 24,
  },
  heroStatMain: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  heroStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroStatSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },

  // Floating Cards
  floatingCards: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -28,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 8 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
    }),
  },
  floatingCard: {
    flex: 1,
    alignItems: 'center',
  },
  floatingCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  floatingCardLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  floatingCardValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  floatingCardDivider: {
    width: 1,
    backgroundColor: theme.borderLight,
    marginHorizontal: 8,
  },

  // Quick Actions
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // Customers
  customersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  customerPhone: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  customerBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.credit,
  },
  dueBadge: {
    backgroundColor: theme.creditLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.credit,
  },

  // Activity
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txnName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  txnNote: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  txnAmountCol: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txnDate: {
    fontSize: 11,
    color: theme.textLight,
    marginTop: 2,
  },
});
