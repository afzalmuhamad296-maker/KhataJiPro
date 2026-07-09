import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getItemEmoji = (item: { name: string; category?: string }): string => {
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  if (name.includes('atta') || cat.includes('flour')) return '🌾';
  if (name.includes('cheeni') || cat.includes('sugar')) return '🍯';
  if (name.includes('rice')) return '🍚';
  if (name.includes('ghee') || name.includes('oil')) return '🛒';
  if (name.includes('daal')) return '🫘';
  if (name.includes('chai')) return '☕';
  if (name.includes('doodh') || cat.includes('dairy')) return '🥛';
  if (cat.includes('spices') || name.includes('mirch') || name.includes('haldi')) return '🌶';
  if (name.includes('namak')) return '🧂';
  if (cat.includes('household') || name.includes('sabun') || name.includes('vim')) return '🧼';
  return '📦';
};

const calcRateChange = (current: number, previous?: number): { pct: number; up: boolean; same: boolean } => {
  if (!previous || previous === 0) return { pct: 0, up: false, same: true };
  const diff = current - previous;
  if (diff === 0) return { pct: 0, up: false, same: true };
  const change = (diff / previous) * 100;
  return { pct: Math.abs(change), up: change > 0, same: false };
};

const getDaysAgoText = (dateStr: string | undefined, lang: string): string => {
  if (!dateStr) return lang === 'ur' ? 'حال ہی میں' : 'Recently';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return lang === 'ur' ? 'آج اپ ڈیٹ' : 'Updated today';
  if (days === 1) return lang === 'ur' ? 'کل اپ ڈیٹ' : 'Updated 1d ago';
  if (lang === 'ur') return `${days} دن پہلے`;
  return `Updated ${days}d ago`;
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, settings, itemRates, t, formatCurrency, getTodayStats, language, isRTL, formatDate } = useApp();
  const stats = getTodayStats();

  const recentTransactions = transactions.slice(0, 8);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.morning;
    if (hour < 17) return t.afternoon;
    return t.evening;
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
          <View style={[styles.headerTop, isRTL && styles.rtlRow]}>
            <View style={isRTL && { alignItems: 'flex-end' }}>
              <Text style={[styles.greeting, isRTL && styles.rtlText]}>{getGreeting()} 👋</Text>
              <Text style={[styles.shopName, isRTL && styles.rtlText]}>{settings.shopName}</Text>
              <Text style={[styles.ownerName, isRTL && styles.rtlText]}>{settings.ownerName}</Text>
            </View>
            <View style={[styles.headerRight, isRTL && { alignItems: 'flex-start' }]}>
              <Pressable
                style={({ pressed }) => [styles.planBadge, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/plans')}
              >
                <MaterialIcons name="workspace-premium" size={14} color="#FFD700" />
                <Text style={styles.planBadgeText}>{t.free.toUpperCase()}</Text>
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
              <Text style={styles.heroStatLabel}>{t.totalOutstanding}</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(stats.outstanding)}</Text>
              <View style={styles.heroSubRow}>
                <View style={styles.heroSubItem}>
                  <View style={[styles.heroSubDot, { backgroundColor: '#4ADE80' }]} />
                  <Text style={styles.heroSubText}>{stats.totalCustomers} {t.customers}</Text>
                </View>
                <View style={styles.heroSubItem}>
                  <View style={[styles.heroSubDot, { backgroundColor: '#FCD34D' }]} />
                  <Text style={styles.heroSubText}>{pendingCustomers} {t.pending}</Text>
                </View>
                <View style={styles.heroSubItem}>
                  <View style={[styles.heroSubDot, { backgroundColor: '#86EFAC' }]} />
                  <Text style={styles.heroSubText}>{settledCustomers} {t.clear}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Inline Mini Stats */}
          <View style={[styles.miniStatsRow, isRTL && styles.rtlRow]}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>{t.weekCredit}</Text>
              <Text style={styles.miniStatValue}>{formatCurrency(thisWeekCredit)}</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatLabel}>{t.weekCollection}</Text>
              <Text style={styles.miniStatValue}>{formatCurrency(thisWeekPayment)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Today Cards */}
        <View style={[styles.floatingCards, isRTL && styles.rtlRow]}>
          <View style={[styles.floatingCard, isRTL && styles.rtlRow]}>
            <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.floatingCardIcon}>
              <MaterialIcons name="north-east" size={20} color={theme.credit} />
            </LinearGradient>
            <View style={isRTL && { alignItems: 'flex-end' }}>
              <Text style={[styles.floatingCardLabel, isRTL && styles.rtlText]}>{t.todayCredit}</Text>
              <Text style={[styles.floatingCardValue, { color: theme.credit }]}>
                {formatCurrency(stats.todayCredit)}
              </Text>
            </View>
          </View>
          <View style={styles.floatingCardDivider} />
          <View style={[styles.floatingCard, isRTL && styles.rtlRow]}>
            <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.floatingCardIcon}>
              <MaterialIcons name="south-west" size={20} color={theme.payment} />
            </LinearGradient>
            <View style={isRTL && { alignItems: 'flex-end' }}>
              <Text style={[styles.floatingCardLabel, isRTL && styles.rtlText]}>{t.todayCollection}</Text>
              <Text style={[styles.floatingCardValue, { color: theme.payment }]}>
                {formatCurrency(stats.todayCollection)}
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Banner */}
        <Pressable
          style={({ pressed }) => [styles.upgradeBanner, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={() => router.push('/plans')}
        >
          <LinearGradient
            colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.upgradeBannerGradient, isRTL && styles.rtlRow]}
          >
            <View style={[styles.upgradeLeft, isRTL && styles.rtlRow]}>
              <View style={styles.upgradeIconWrap}>
                <MaterialIcons name="workspace-premium" size={28} color="#B45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeTitle, isRTL && styles.rtlText]}>{t.upgrade} → {t.pro}</Text>
                <Text style={[styles.upgradeDesc, isRTL && styles.rtlText]}>{t.upgradeProDesc}</Text>
              </View>
            </View>
            <MaterialIcons name={isRTL ? 'arrow-back-ios' : 'arrow-forward-ios'} size={16} color="#92400E" />
          </LinearGradient>
        </Pressable>

        {/* Rate Book Quick View */}
        <View style={styles.rateBookSection}>
          <View style={[styles.rateBookHeader, isRTL && styles.rtlRow]}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }, isRTL && styles.rtlText]}>
              📊 {language === 'ur' ? 'آج کے ریٹ' : "Today's Rates"}
            </Text>
            <Pressable
              onPress={() => router.push('/stock')}
              style={[styles.seeAllBtn, { marginBottom: 0 }, isRTL && styles.rtlRow]}
            >
              <Text style={styles.seeAllText}>📋 {language === 'ur' ? 'سب دیکھیں' : 'View All'}</Text>
              <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={theme.primary} />
            </Pressable>
          </View>

          {itemRates.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rateScrollContent}
            >
              {itemRates.slice(0, 5).map((item) => {
                const emoji = getItemEmoji(item);
                const change = calcRateChange(item.rate, item.previousRate);
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.rateCard,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                    ]}
                    onPress={() => router.push('/stock')}
                  >
                    <View style={styles.rateEmojiCircle}>
                      <Text style={styles.rateEmojiText}>{emoji}</Text>
                    </View>
                    <Text style={styles.rateName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.ratePrice} numberOfLines={1}>
                      {formatCurrency(item.rate)}/{item.unit}
                    </Text>
                    {!change.same ? (
                      <View
                        style={[
                          styles.rateChangeRow,
                          { backgroundColor: change.up ? '#FEE2E2' : '#DCFCE7' },
                        ]}
                      >
                        <MaterialIcons
                          name={change.up ? 'arrow-upward' : 'arrow-downward'}
                          size={11}
                          color={change.up ? '#DC2626' : '#16A34A'}
                        />
                        <Text
                          style={[
                            styles.rateChangeText,
                            { color: change.up ? '#DC2626' : '#16A34A' },
                          ]}
                        >
                          {change.pct.toFixed(1)}%
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.rateChangeRowPlaceholder} />
                    )}
                    <Text style={styles.rateUpdated} numberOfLines={1}>
                      {getDaysAgoText(item.lastUpdated, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <View style={styles.rateEmpty}>
                <Text style={styles.rateEmptyEmoji}>🏷️</Text>
                <Text style={[styles.rateEmptyText, isRTL && styles.rtlText]}>
                  {language === 'ur'
                    ? 'کوئی ریٹ موجود نہیں۔ خودکار حساب کے لیے اشیاء شامل کریں۔'
                    : 'No rates set. Add items for auto-calculation.'}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.rateAddBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push('/stock')}
                >
                  <MaterialIcons name="add" size={16} color="#FFF" />
                  <Text style={styles.rateAddBtnText}>
                    {language === 'ur' ? 'ریٹ شامل کریں' : 'Add Rates'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.quickActions}</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'add-circle-outline', label: t.addCredit, color1: '#FEE2E2', color2: '#FECACA', iconColor: theme.credit, route: '/add-credit' },
              { icon: 'payments', label: t.addPayment, color1: '#DCFCE7', color2: '#BBF7D0', iconColor: theme.payment, route: '/add-payment' },
              { icon: 'person-add', label: t.newCustomer, color1: '#DBEAFE', color2: '#BFDBFE', iconColor: '#2563EB', route: '/add-customer' },
              { icon: 'record-voice-over', label: language === 'ur' ? 'وائس کنٹرول' : 'Voice Control', color1: '#EEF2FF', color2: '#E0E7FF', iconColor: '#6366F1', route: '/voice-control' },
            ].map(item => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                onPress={() => router.push(item.route as any)}
              >
                <LinearGradient colors={[item.color1, item.color2]} style={styles.quickActionIcon}>
                  <MaterialIcons name={item.icon as any} size={26} color={item.iconColor} />
                </LinearGradient>
                <Text style={styles.quickActionLabel} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.quickGrid, { marginTop: 18 }]}>
            {[
              { icon: 'qr-code-scanner', label: 'QR', color1: '#DBEAFE', color2: '#BFDBFE', iconColor: '#2563EB', route: '/qr-scanner' },
              { icon: 'smart-toy', label: t.chatAssistant, color1: '#E8F5ED', color2: '#D1FAE5', iconColor: theme.primary, route: '/chat-assistant' },
              { icon: 'receipt-long', label: language === 'ur' ? 'انوائس' : 'Invoice', color1: '#FEF3C7', color2: '#FDE68A', iconColor: '#D97706', route: '/invoice' },
              { icon: 'auto-awesome', label: t.insights, color1: '#FCE7F3', color2: '#FBCFE8', iconColor: '#BE185D', route: '/insights' },
            ].map(item => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                onPress={() => router.push(item.route as any)}
              >
                <LinearGradient colors={[item.color1, item.color2]} style={styles.quickActionIcon}>
                  <MaterialIcons name={item.icon as any} size={26} color={item.iconColor} />
                </LinearGradient>
                <Text style={styles.quickActionLabel} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.quickGrid, { marginTop: 18 }]}>
            {[
              { icon: 'notifications-active', label: language === 'ur' ? 'یاد دہانی' : 'Reminders', color1: '#FEE2E2', color2: '#FED7AA', iconColor: '#DC2626', route: '/reminders' },
              { icon: 'account-balance-wallet', label: language === 'ur' ? 'اخراجات' : 'Expenses', color1: '#E0E7FF', color2: '#C7D2FE', iconColor: '#4338CA', route: '/expense-tracker' },
              { icon: 'inventory', label: language === 'ur' ? 'سٹاک' : 'Stock', color1: '#CCFBF1', color2: '#99F6E4', iconColor: '#0D9488', route: '/stock' },
              { icon: 'grid-view', label: language === 'ur' ? 'مزید' : 'More', color1: '#F1F5F9', color2: '#E2E8F0', iconColor: '#64748B', route: '/more-features' },
            ].map(item => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
                onPress={() => router.push(item.route as any)}
              >
                <LinearGradient colors={[item.color1, item.color2]} style={styles.quickActionIcon}>
                  <MaterialIcons name={item.icon as any} size={26} color={item.iconColor} />
                </LinearGradient>
                <Text style={styles.quickActionLabel} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Business Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.businessOverview}</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#E8F5ED', '#D1FAE5']} style={styles.overviewIconBg}>
                <MaterialIcons name="people" size={22} color={theme.primary} />
              </LinearGradient>
              <Text style={styles.overviewValue}>{customers.length}</Text>
              <Text style={[styles.overviewLabel, isRTL && styles.rtlText]}>{t.totalCustomers}</Text>
            </View>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.overviewIconBg}>
                <MaterialIcons name="receipt" size={22} color="#2563EB" />
              </LinearGradient>
              <Text style={styles.overviewValue}>{transactions.length}</Text>
              <Text style={[styles.overviewLabel, isRTL && styles.rtlText]}>
                {language === 'ur' ? 'لین دین' : 'Transactions'}
              </Text>
            </View>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.overviewIconBg}>
                <MaterialIcons name="trending-up" size={22} color="#D97706" />
              </LinearGradient>
              <Text style={styles.overviewValue}>{formatCurrency(thisWeekCredit)}</Text>
              <Text style={[styles.overviewLabel, isRTL && styles.rtlText]}>{t.weekCredit}</Text>
            </View>
            <View style={styles.overviewCard}>
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.overviewIconBg}>
                <MaterialIcons name="trending-down" size={22} color={theme.payment} />
              </LinearGradient>
              <Text style={styles.overviewValue}>{formatCurrency(thisWeekPayment)}</Text>
              <Text style={[styles.overviewLabel, isRTL && styles.rtlText]}>{t.weekCollection}</Text>
            </View>
          </View>
        </View>

        {/* Top Outstanding */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.topOutstanding}</Text>
            <Pressable onPress={() => router.push('/(tabs)/customers')} style={[styles.seeAllBtn, isRTL && styles.rtlRow]}>
              <Text style={styles.seeAllText}>{t.seeAll}</Text>
              <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={theme.primary} />
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
                  style={({ pressed }) => [styles.customerRow, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }, isRTL && styles.rtlRow]}
                  onPress={() => router.push(`/ledger/${customer.id}`)}
                >
                  <View style={[styles.avatar, { backgroundColor: ['#E8F5ED', '#FEF3C7', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#FEE2E2'][index % 6] }]}>
                    <Text style={[styles.avatarText, { color: [theme.primary, '#D97706', '#2563EB', '#7C3AED', '#BE185D', '#DC2626'][index % 6] }]}>
                      {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={[styles.customerName, isRTL && styles.rtlText]}>{customer.name}</Text>
                    <Text style={[styles.customerPhone, isRTL && styles.rtlText]}>{customer.phone}</Text>
                  </View>
                  <View style={styles.balanceCol}>
                    <Text style={styles.customerBalance}>{formatCurrency(customer.balance)}</Text>
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>{t.due}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t.recentActivity}</Text>
            <Pressable onPress={() => router.push('/(tabs)/udhaar')} style={[styles.seeAllBtn, isRTL && styles.rtlRow]}>
              <Text style={styles.seeAllText}>{t.viewAll}</Text>
              <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={theme.primary} />
            </Pressable>
          </View>
          <View style={styles.activityCard}>
            {recentTransactions.map((txn, index) => (
              <View key={txn.id} style={[styles.transactionRow, index < recentTransactions.length - 1 && styles.transactionRowBorder, isRTL && styles.rtlRow]}>
                <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? theme.creditLight : theme.paymentLight }]}>
                  <MaterialIcons
                    name={txn.type === 'credit' ? 'north-east' : 'south-west'}
                    size={16}
                    color={txn.type === 'credit' ? theme.credit : theme.payment}
                  />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={[styles.txnName, isRTL && styles.rtlText]}>{txn.customerName}</Text>
                  <Text style={[styles.txnNote, isRTL && styles.rtlText]} numberOfLines={1}>
                    {txn.note || (txn.type === 'credit' ? t.credit : t.debit)}
                  </Text>
                </View>
                <View style={styles.txnAmountCol}>
                  <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.credit : theme.payment }]}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                  <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer CTA */}
        <View style={styles.footerCta}>
          <Pressable style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.9 }]} onPress={() => router.push('/plans')}>
            <MaterialIcons name="diamond" size={20} color={theme.primary} />
            <Text style={styles.footerBtnText}>
              {language === 'ur' ? 'پلانز اور قیمتیں دیکھیں' : 'View Plans & Pricing'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },

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
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  shopName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 4, letterSpacing: -0.3 },
  ownerName: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 10 },
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
  planBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFD700' },
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
  heroStats: { marginTop: 28 },
  heroStatMain: { alignItems: 'center' },
  heroStatLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  heroStatValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', marginTop: 6, letterSpacing: -0.5 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  heroSubItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroSubDot: { width: 7, height: 7, borderRadius: 4 },
  heroSubText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  miniStatsRow: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  miniStatValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },
  miniStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

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
  floatingCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  floatingCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCardLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
  floatingCardValue: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  floatingCardDivider: { width: 1, backgroundColor: theme.borderLight, marginHorizontal: 4 },

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
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  upgradeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(180,83,9,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: { fontSize: 15, fontWeight: '700', color: '#78350F' },
  upgradeDesc: { fontSize: 12, color: '#92400E', marginTop: 2, lineHeight: 17 },

  // Sections
  section: { marginTop: 28, paddingHorizontal: 20 },
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
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  seeAllText: { fontSize: 14, color: theme.primary, fontWeight: '600' },

  quickGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', width: '23%' },
  quickActionPressed: { opacity: 0.7, transform: [{ scale: 0.93 }] },
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

  // Overview
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
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
  overviewValue: { fontSize: 18, fontWeight: '700', color: theme.textDark, marginTop: 12 },
  overviewLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '500', marginTop: 4 },

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
  avatarText: { fontSize: 15, fontWeight: '700' },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  customerPhone: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  balanceCol: { alignItems: 'flex-end' },
  customerBalance: { fontSize: 15, fontWeight: '700', color: theme.credit },
  dueBadge: {
    backgroundColor: theme.creditLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  dueBadgeText: { fontSize: 10, fontWeight: '700', color: theme.credit },

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
  txnInfo: { flex: 1, marginLeft: 12 },
  txnName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  txnNote: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  txnAmountCol: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  txnDate: { fontSize: 11, color: theme.textLight, marginTop: 2 },

  // Footer
  footerCta: { marginTop: 24, paddingHorizontal: 20 },
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
  footerBtnText: { fontSize: 15, fontWeight: '600', color: theme.primary },

  // Rate Book Section
  rateBookSection: { marginTop: 28 },
  rateBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  rateScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  rateCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  rateEmojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  rateEmojiText: { fontSize: 22 },
  rateName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textDark,
    textAlign: 'center',
    minHeight: 32,
    lineHeight: 16,
  },
  ratePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.payment,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  rateChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rateChangeRowPlaceholder: {
    height: 18,
    marginTop: 6,
  },
  rateChangeText: { fontSize: 11, fontWeight: '700' },
  rateUpdated: {
    fontSize: 9,
    color: theme.textMuted,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  rateEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.borderLight,
    borderStyle: 'dashed',
  },
  rateEmptyEmoji: { fontSize: 36, marginBottom: 10 },
  rateEmptyText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  rateAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },
  rateAddBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
