import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, settings, t, formatCurrency, getTodayStats } = useApp();
  const stats = getTodayStats();

  const recentTransactions = transactions.slice(0, 8);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const thisWeekCredit = transactions
    .filter(tx => tx.type === 'credit' && new Date(tx.date) >= new Date(Date.now() - 7 * 86400000))
    .reduce((s, tx) => s + tx.amount, 0);
  const thisWeekPayment = transactions
    .filter(tx => tx.type === 'debit' && new Date(tx.date) >= new Date(Date.now() - 7 * 86400000))
    .reduce((s, tx) => s + tx.amount, 0);
  const settledCustomers = customers.filter(c => c.balance <= 0).length;
  const pendingCustomers = customers.filter(c => c.balance > 0).length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Gradient Header */}
        <LinearGradient
          colors={['#0A6B3F', '#0D7C4A', '#065F37', '#043D25']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.shopName}>{settings.shopName}</Text>
              <Text style={styles.ownerName}>{settings.ownerName}</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={({ pressed }) => [styles.planBadge, pressed && { opacity: 0.8 }]} onPress={() => router.push('/plans')}>
                <MaterialIcons name="workspace-premium" size={14} color="#FFD700" />
                <Text style={styles.planBadgeText}>FREE</Text>
              </Pressable>
              <Pressable style={styles.notifButton}>
                <MaterialIcons name="notifications-none" size={22} color="rgba(255,255,255,0.9)" />
                <View style={styles.notifDot} />
              </Pressable>
            </View>
          </View>

          {/* Big Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatMain}>
              <Text style={styles.heroStatLabel}>Total Outstanding Balance</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(stats.outstanding)}</Text>
              <View style={styles.heroSubRow}>
                <View style={styles.heroSubItem}>
                  <View style={[styles.heroSubDot, { backgroundColor: '#4ADE80' }]} />
                  <Text style={styles.heroSubText}>{stats.totalCustomers} Customers</Text>
                </View>
                <View style={styles.heroSubItem}>
                  <View style={[styles.heroSubDot, { backgroundColor: '#FCD34D' }]} />
                  <Text style={styles.heroSubText}>{pendingCustomers} Pending</Text>
                </View>
                <View style={styles.heroSubItem}>
                  <View style={[styles.heroSubDot, { backgroundColor: '#86EFAC' }]} />
                  <Text style={styles.heroSubText}>{settledCustomers} Clear</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Inline Mini Stats */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>This Week Credit</Text>
              <Text style={styles.miniStatValue}>{formatCurrency(thisWeekCredit)}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>This Week Collection</Text>
              <Text style={styles.miniStatValue}>{formatCurrency(thisWeekPayment)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Today Cards */}
        <View style={styles.floatingCards}>
          <View style={styles.floatingCard}>
            <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.floatingCardIcon}>
              <MaterialIcons name="north-east" size={20} color={theme.credit} />
            </LinearGradient>
            <View>
              <Text style={styles.floatingCardLabel}>{t.todayCredit}</Text>
              <Text style={[styles.floatingCardValue, { color: theme.credit }]}>
                {formatCurrency(stats.todayCredit)}
              </Text>
            </View>
          </View>
          <View style={styles.floatingCardDivider} />
          <View style={styles.floatingCard}>
            <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.floatingCardIcon}>
              <MaterialIcons name="south-west" size={20} color={theme.payment} />
            </LinearGradient>
            <View>
              <Text style={styles.floatingCardLabel}>{t.todayCollection}</Text>
              <Text style={[styles.floatingCardValue, { color: theme.payment }]}>
                {formatCurrency(stats.todayCollection)}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Banner */}
        <Pressable style={({ pressed }) => [styles.upgradeBanner, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]} onPress={() => router.push('/plans')}>
          <LinearGradient
            colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeBannerGradient}
          >
            <View style={styles.upgradeLeft}>
              <View style={styles.upgradeIconWrap}>
                <MaterialIcons name="workspace-premium" size={28} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDesc}>Unlock AI features, unlimited customers, PDF exports & more</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#92400E" />
          </LinearGradient>
        </Pressable>

        {/* Quick Actions - Bigger Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <View style={styles.quickGrid}>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/add-credit')}>
              <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.quickActionIcon}>
                <MaterialIcons name="add-circle-outline" size={26} color={theme.credit} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>{t.addCredit}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/add-payment')}>
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.quickActionIcon}>
                <MaterialIcons name="payments" size={26} color={theme.payment} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>{t.addPayment}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/add-customer')}>
              <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.quickActionIcon}>
                <MaterialIcons name="person-add" size={26} color="#2563EB" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>New Customer</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/voice-entry')}>
              <LinearGradient colors={['#F3E8FF', '#E9D5FF']} style={styles.quickActionIcon}>
                <MaterialIcons name="mic" size={26} color="#7C3AED" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Voice Entry</Text>
            </Pressable>
          </View>
          <View style={[styles.quickGrid, { marginTop: 18 }]}>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/qr-scanner')}>
              <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.quickActionIcon}>
                <MaterialIcons name="qr-code-scanner" size={26} color="#2563EB" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>QR Scan</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/chat-assistant')}>
              <LinearGradient colors={['#E8F5ED', '#D1FAE5']} style={styles.quickActionIcon}>
                <MaterialIcons name="smart-toy" size={26} color={theme.primary} />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>AI Chat</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/invoice')}>
              <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.quickActionIcon}>
                <MaterialIcons name="receipt-long" size={26} color="#D97706" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Invoice</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/insights')}>
              <LinearGradient colors={['#FCE7F3', '#FBCFE8']} style={styles.quickActionIcon}>
                <MaterialIcons name="auto-awesome" size={26} color="#BE185D" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Insights</Text>
            </Pressable>
          </View>
          <View style={[styles.quickGrid, { marginTop: 18 }]}>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/reminders')}>
              <LinearGradient colors={['#FEE2E2', '#FED7AA']} style={styles.quickActionIcon}>
                <MaterialIcons name="notifications-active" size={26} color="#DC2626" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Reminders</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/expense-tracker')}>
              <LinearGradient colors={['#E0E7FF', '#C7D2FE']} style={styles.quickActionIcon}>
                <MaterialIcons name="account-balance-wallet" size={26} color="#4338CA" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Expenses</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/stock')}>
              <LinearGradient colors={['#CCFBF1', '#99F6E4']} style={styles.quickActionIcon}>
                <MaterialIcons name="inventory" size={26} color="#0D9488" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Stock</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={() => router.push('/more-features')}>
              <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.quickActionIcon}>
                <MaterialIcons name="grid-view" size={26} color="#64748B" />
              </LinearGradient>
              <Text style={styles.quickActionLabel}>More</Text>
            </Pressable>
          </View>
        </View>

        {/* Business Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#E8F5ED', '#D1FAE5']} style={styles.overviewIconBg}>
                <MaterialIcons name="people" size={22} color={theme.primary} />
              </LinearGradient>
              <Text style={styles.overviewValue}>{customers.length}</Text>
              <Text style={styles.overviewLabel}>Total Customers</Text>
            </View>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.overviewIconBg}>
                <MaterialIcons name="receipt" size={22} color="#2563EB" />
              </LinearGradient>
              <Text style={styles.overviewValue}>{transactions.length}</Text>
              <Text style={styles.overviewLabel}>Transactions</Text>
            </View>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.overviewIconBg}>
                <MaterialIcons name="trending-up" size={22} color="#D97706" />
              </LinearGradient>
              <Text style={styles.overviewValue}>{formatCurrency(thisWeekCredit)}</Text>
              <Text style={styles.overviewLabel}>Week Credit</Text>
            </View>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.overviewIconBg}>
                <MaterialIcons name="trending-down" size={22} color={theme.payment} />
              </LinearGradient>
              <Text style={styles.overviewValue}>{formatCurrency(thisWeekPayment)}</Text>
              <Text style={styles.overviewLabel}>Week Collection</Text>
            </View>
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
              .slice(0, 6)
              .map((customer, index) => (
                <Pressable
                  key={customer.id}
                  style={({ pressed }) => [styles.customerRow, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
                  onPress={() => router.push(`/ledger/${customer.id}`)}
                >
                  <View style={[styles.avatar, { backgroundColor: ['#E8F5ED', '#FEF3C7', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#FEE2E2'][index % 6] }]}>
                    <Text style={[styles.avatarText, { color: [theme.primary, '#D97706', '#2563EB', '#7C3AED', '#BE185D', '#DC2626'][index % 6] }]}>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
            <Pressable onPress={() => router.push('/(tabs)/udhaar')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>View All</Text>
              <MaterialIcons name="chevron-right" size={16} color={theme.primary} />
            </Pressable>
          </View>
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

        {/* Footer CTA */}
        <View style={styles.footerCta}>
          <Pressable style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.9 }]} onPress={() => router.push('/plans')}>
            <MaterialIcons name="diamond" size={20} color={theme.primary} />
            <Text style={styles.footerBtnText}>View Plans & Pricing</Text>
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
  // Header
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  shopName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  ownerName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 10,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#065F37',
  },
  heroStats: {
    marginTop: 28,
  },
  heroStatMain: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  heroStatValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  heroSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroSubDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  miniStatsRow: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Floating Cards
  floatingCards: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 10 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 20 },
    }),
  },
  floatingCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCardLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500',
  },
  floatingCardValue: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  floatingCardDivider: {
    width: 1,
    backgroundColor: theme.borderLight,
    marginHorizontal: 4,
  },

  // Upgrade Banner
  upgradeBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
  },
  upgradeBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  upgradeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(180,83,9,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
  },
  upgradeDesc: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 17,
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
    fontSize: 18,
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
    transform: [{ scale: 0.93 }],
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
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

  // Business Overview
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  overviewIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
    marginTop: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginTop: 4,
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
    width: 46,
    height: 46,
    borderRadius: 15,
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
    width: 38,
    height: 38,
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

  // Footer
  footerCta: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.primary + '30',
  },
  footerBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },
});
