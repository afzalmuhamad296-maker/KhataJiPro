import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../contexts/AppContext';
import { useAlert } from '@/template';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { customers, transactions, t, formatCurrency, language, isRTL, currentTheme, settings } = useApp();
  const { showAlert } = useAlert();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const filtered = useMemo(() => {
    const start = period === 'daily' ? today : period === 'weekly' ? weekAgo : monthAgo;
    return transactions.filter(txn => txn.date >= start);
  }, [transactions, period]);

  const totalCredit = filtered.filter(x => x.type === 'credit').reduce((s, x) => s + x.amount, 0);
  const totalPayments = filtered.filter(x => x.type === 'debit').reduce((s, x) => s + x.amount, 0);
  const outstanding = customers.reduce((s, c) => s + c.balance, 0);
  const creditCount = filtered.filter(x => x.type === 'credit').length;
  const paymentCount = filtered.filter(x => x.type === 'debit').length;
  const collectionRate = totalCredit > 0 ? Math.round((totalPayments / totalCredit) * 100) : 0;

  const topDebtors = useMemo(
    () => [...customers].filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5),
    [customers]
  );

  const dailyBreakdown = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const dayTxns = transactions.filter(x => x.date === date);
      const credit = dayTxns.filter(x => x.type === 'credit').reduce((s, x) => s + x.amount, 0);
      const debit = dayTxns.filter(x => x.type === 'debit').reduce((s, x) => s + x.amount, 0);
      const d = new Date(date);
      const dayNames = language === 'ur'
        ? ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return { date, credit, debit, day: dayNames[d.getDay()] };
    }).reverse();
  }, [transactions, language]);

  const maxDailyAmount = Math.max(...dailyBreakdown.map(d => Math.max(d.credit, d.debit)), 1);

  const handleExport = (type: string) => {
    showAlert(
      t.exportReport,
      language === 'ur' ? `${type} فائل تیار ہو رہی ہے...` : `${type} report is being generated...`
    );
  };

  const periodOptions = [
    { key: 'daily' as const, label: t.today, icon: 'today' },
    { key: 'weekly' as const, label: t.thisWeek, icon: 'date-range' },
    { key: 'monthly' as const, label: t.thisMonth, icon: 'calendar-month' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[s.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header - Theme aware */}
        <LinearGradient
          colors={currentTheme.primaryGradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={[s.headerTop, isRTL && s.rtlRow]}>
            <View style={isRTL && { alignItems: 'flex-end' }}>
              <Text style={s.headerTitle}>📊 {t.reports}</Text>
              <Text style={s.headerSub}>{t.reportsSubtitle}</Text>
            </View>
            <Pressable style={s.exportBtn} onPress={() => handleExport('PDF')} hitSlop={6}>
              <MaterialIcons name="ios-share" size={18} color="#FFF" />
            </Pressable>
          </View>

          {/* Period Selector inside header */}
          <View style={s.periodBar}>
            {periodOptions.map(opt => {
              const active = period === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[s.periodChip, active && s.periodChipActive]}
                  onPress={() => setPeriod(opt.key)}
                >
                  <MaterialIcons
                    name={opt.icon as any}
                    size={13}
                    color={active ? currentTheme.primary : 'rgba(255,255,255,0.7)'}
                  />
                  <Text
                    style={[
                      s.periodChipText,
                      active && { color: currentTheme.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Hero KPI */}
          <View style={s.hero}>
            <View style={s.heroLeft}>
              <Text style={s.heroLabel}>{t.totalOutstanding}</Text>
              <Text style={s.heroValue}>{formatCurrency(outstanding)}</Text>
              <View style={[s.heroPerf, isRTL && s.rtlRow]}>
                <MaterialIcons
                  name={collectionRate >= 50 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={collectionRate >= 50 ? '#86EFAC' : '#FCA5A5'}
                />
                <Text style={[s.heroPerfText, { color: collectionRate >= 50 ? '#86EFAC' : '#FCA5A5' }]}>
                  {t.collectionRate}: {collectionRate}%
                </Text>
              </View>
            </View>
            <View style={s.heroCircle}>
              <Text style={s.heroCircleText}>{collectionRate}%</Text>
              <Text style={s.heroCircleSub}>{language === 'ur' ? 'وصولی' : 'Rate'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Summary Cards */}
        <View style={[s.summaryFloat, isRTL && s.rtlRow]}>
          <View style={s.summaryCard}>
            <LinearGradient colors={['#FEE2E2', '#FECACA']} style={s.summaryIcon}>
              <MaterialIcons name="north-east" size={18} color={currentTheme.credit} />
            </LinearGradient>
            <Text style={[s.summaryLabel, isRTL && s.rtlText]}>{t.creditGiven}</Text>
            <Text style={[s.summaryValue, { color: currentTheme.credit }]}>{formatCurrency(totalCredit)}</Text>
            <View style={s.summaryFooter}>
              <View style={[s.summaryDot, { backgroundColor: currentTheme.credit }]} />
              <Text style={s.summaryCount}>{creditCount} {t.txnsShort}</Text>
            </View>
          </View>
          <View style={s.summaryCard}>
            <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={s.summaryIcon}>
              <MaterialIcons name="south-west" size={18} color={currentTheme.payment} />
            </LinearGradient>
            <Text style={[s.summaryLabel, isRTL && s.rtlText]}>{t.collected}</Text>
            <Text style={[s.summaryValue, { color: currentTheme.payment }]}>{formatCurrency(totalPayments)}</Text>
            <View style={s.summaryFooter}>
              <View style={[s.summaryDot, { backgroundColor: currentTheme.payment }]} />
              <Text style={s.summaryCount}>{paymentCount} {t.txnsShort}</Text>
            </View>
          </View>
        </View>

        {/* Chart Card */}
        <View style={s.section}>
          <View style={[s.sectionHead, isRTL && s.rtlRow]}>
            <View style={[s.sectionTitleRow, isRTL && s.rtlRow]}>
              <View style={[s.sectionIcon, { backgroundColor: currentTheme.primary + '15' }]}>
                <MaterialIcons name="show-chart" size={16} color={currentTheme.primary} />
              </View>
              <Text style={[s.sectionTitle, isRTL && s.rtlText]}>{t.weekOverview}</Text>
            </View>
          </View>
          <View style={s.chartCard}>
            <View style={s.chartInner}>
              {dailyBreakdown.map((day, index) => (
                <View key={index} style={s.chartCol}>
                  <View style={s.barsWrap}>
                    <LinearGradient
                      colors={[currentTheme.credit, '#F87171']}
                      style={[
                        s.bar,
                        { height: Math.max((day.credit / maxDailyAmount) * 96, 4) },
                      ]}
                    />
                    <LinearGradient
                      colors={[currentTheme.payment, '#4ADE80']}
                      style={[
                        s.bar,
                        { height: Math.max((day.debit / maxDailyAmount) * 96, 4) },
                      ]}
                    />
                  </View>
                  <Text style={s.chartLabel}>{day.day}</Text>
                </View>
              ))}
            </View>
            <View style={s.legendRow}>
              <View style={[s.legendItem, isRTL && s.rtlRow]}>
                <View style={[s.legendDot, { backgroundColor: currentTheme.credit }]} />
                <Text style={s.legendText}>{t.credit}</Text>
              </View>
              <View style={[s.legendItem, isRTL && s.rtlRow]}>
                <View style={[s.legendDot, { backgroundColor: currentTheme.payment }]} />
                <Text style={s.legendText}>{t.debit}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Debtors */}
        <View style={s.section}>
          <View style={[s.sectionHead, isRTL && s.rtlRow]}>
            <View style={[s.sectionTitleRow, isRTL && s.rtlRow]}>
              <View style={[s.sectionIcon, { backgroundColor: currentTheme.credit + '15' }]}>
                <MaterialIcons name="warning-amber" size={16} color={currentTheme.credit} />
              </View>
              <Text style={[s.sectionTitle, isRTL && s.rtlText]}>{t.topOutstanding}</Text>
            </View>
            <View style={[s.sectionBadge, { backgroundColor: currentTheme.credit + '15' }]}>
              <Text style={[s.sectionBadgeText, { color: currentTheme.credit }]}>
                {topDebtors.length}
              </Text>
            </View>
          </View>
          <View style={s.debtorsCard}>
            {topDebtors.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={{ fontSize: 40 }}>🎉</Text>
                <Text style={s.emptyText}>
                  {language === 'ur' ? 'کوئی بقایا نہیں!' : 'All clear!'}
                </Text>
              </View>
            ) : (
              topDebtors.map((customer, index) => {
                const pct = (customer.balance / (topDebtors[0]?.balance || 1)) * 100;
                const isTop = index === 0;
                return (
                  <View key={customer.id} style={[s.debtorRow, isRTL && s.rtlRow]}>
                    <View
                      style={[
                        s.rankBadge,
                        isTop && { backgroundColor: '#FEF3C7' },
                        index === 1 && { backgroundColor: '#F3E8FF' },
                        index === 2 && { backgroundColor: '#DBEAFE' },
                      ]}
                    >
                      <Text
                        style={[
                          s.rankText,
                          isTop && { color: '#D97706' },
                          index === 1 && { color: '#7C3AED' },
                          index === 2 && { color: '#2563EB' },
                        ]}
                      >
                        {isTop ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={[s.debtorName, isRTL && s.rtlText]}>{customer.name}</Text>
                      <View style={s.debtorBar}>
                        <LinearGradient
                          colors={[currentTheme.credit, '#F87171']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[s.debtorBarFill, { width: `${pct}%` }]}
                        />
                      </View>
                    </View>
                    <Text style={[s.debtorAmount, { color: currentTheme.credit }]}>
                      {formatCurrency(customer.balance)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={s.section}>
          <View style={[s.sectionHead, isRTL && s.rtlRow]}>
            <View style={[s.sectionTitleRow, isRTL && s.rtlRow]}>
              <View style={[s.sectionIcon, { backgroundColor: currentTheme.info + '15' }]}>
                <MaterialIcons name="analytics" size={16} color={currentTheme.info} />
              </View>
              <Text style={[s.sectionTitle, isRTL && s.rtlText]}>{t.quickStats}</Text>
            </View>
          </View>
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <LinearGradient colors={[currentTheme.primary + '18', currentTheme.primary + '08']} style={s.statIconBg}>
                <MaterialIcons name="people" size={22} color={currentTheme.primary} />
              </LinearGradient>
              <Text style={s.statValue}>{customers.length}</Text>
              <Text style={s.statLabel}>{t.customers}</Text>
            </View>
            <View style={s.statCard}>
              <LinearGradient colors={['#DBEAFE', '#EFF6FF']} style={s.statIconBg}>
                <MaterialIcons name="receipt-long" size={22} color="#2563EB" />
              </LinearGradient>
              <Text style={s.statValue}>{transactions.length}</Text>
              <Text style={s.statLabel}>{language === 'ur' ? 'لین دین' : 'Transactions'}</Text>
            </View>
            <View style={s.statCard}>
              <LinearGradient colors={['#F3E8FF', '#FAF5FF']} style={s.statIconBg}>
                <MaterialIcons name="calculate" size={22} color="#7C3AED" />
              </LinearGradient>
              <Text style={s.statValue}>
                {formatCurrency(Math.round(totalCredit / Math.max(creditCount, 1)))}
              </Text>
              <Text style={s.statLabel}>{t.avgCredit}</Text>
            </View>
          </View>
        </View>

        {/* Export Section */}
        <View style={s.section}>
          <View style={[s.sectionHead, isRTL && s.rtlRow]}>
            <View style={[s.sectionTitleRow, isRTL && s.rtlRow]}>
              <View style={[s.sectionIcon, { backgroundColor: currentTheme.warning + '15' }]}>
                <MaterialIcons name="cloud-download" size={16} color={currentTheme.warning} />
              </View>
              <Text style={[s.sectionTitle, isRTL && s.rtlText]}>{t.exportReport}</Text>
            </View>
          </View>
          <View style={s.exportGrid}>
            <Pressable
              style={({ pressed }) => [s.exportBtnCard, pressed && { opacity: 0.85 }]}
              onPress={() => handleExport('PDF')}
            >
              <LinearGradient colors={['#FEE2E2', '#FECACA']} style={s.exportIconBg}>
                <MaterialIcons name="picture-as-pdf" size={22} color="#DC2626" />
              </LinearGradient>
              <Text style={s.exportBtnText}>{t.downloadPdf}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.exportBtnCard, pressed && { opacity: 0.85 }]}
              onPress={() => handleExport('Excel')}
            >
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={s.exportIconBg}>
                <MaterialIcons name="table-chart" size={22} color="#16A34A" />
              </LinearGradient>
              <Text style={s.exportBtnText}>{t.downloadExcel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.exportBtnCard, pressed && { opacity: 0.85 }]}
              onPress={() => handleExport('WhatsApp')}
            >
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={s.exportIconBg}>
                <MaterialIcons name="share" size={22} color="#25D366" />
              </LinearGradient>
              <Text style={s.exportBtnText}>{t.shareWhatsapp}</Text>
            </Pressable>
          </View>
        </View>

        {/* Info Footer */}
        <View style={s.footerInfo}>
          <LinearGradient
            colors={[currentTheme.primary + '10', currentTheme.primary + '04']}
            style={s.footerGrad}
          >
            <MaterialIcons name="verified" size={20} color={currentTheme.primary} />
            <Text style={[s.footerText, isRTL && s.rtlText]}>
              {language === 'ur'
                ? `📊 ${settings.shopName} • ڈیٹا ${new Date().toLocaleDateString()} تک`
                : `📊 ${settings.shopName} • Data updated ${new Date().toLocaleDateString()}`}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  exportBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    padding: 4,
    marginTop: 16,
    gap: 4,
  },
  periodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 11,
  },
  periodChipActive: { backgroundColor: '#FFF' },
  periodChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue: { fontSize: 26, fontWeight: '800', color: '#FFF', marginTop: 4, letterSpacing: -0.5 },
  heroPerf: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, alignSelf: 'flex-start',
  },
  heroPerfText: { fontSize: 11, fontWeight: '700' },
  heroCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCircleText: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  heroCircleSub: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: -2 },

  // Floating summary
  summaryFloat: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: -16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 }, default: {},
    }),
  },
  summaryIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  summaryFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  summaryDot: { width: 6, height: 6, borderRadius: 3 },
  summaryCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  // Sections
  section: { marginTop: 26, paddingHorizontal: 20 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sectionBadgeText: { fontSize: 12, fontWeight: '800' },

  // Chart
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 }, default: {},
    }),
  },
  chartInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
  },
  chartCol: { flex: 1, alignItems: 'center' },
  barsWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, flex: 1, justifyContent: 'center' },
  bar: { width: 12, borderRadius: 5, minHeight: 4 },
  chartLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 8, fontWeight: '700' },
  legendRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 24,
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  // Debtors
  debtorsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 }, default: {},
    }),
  },
  debtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankBadge: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 15, fontWeight: '800', color: '#9CA3AF' },
  debtorName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  debtorBar: {
    height: 6, backgroundColor: '#F1F5F9', borderRadius: 3,
    marginTop: 6, overflow: 'hidden',
  },
  debtorBarFill: { height: '100%', borderRadius: 3 },
  debtorAmount: { fontSize: 14, fontWeight: '800', marginLeft: 8 },

  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginTop: 8 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 }, default: {},
    }),
  },
  statIconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 10, letterSpacing: -0.2 },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center', fontWeight: '600' },

  // Export
  exportGrid: { flexDirection: 'row', gap: 10 },
  exportBtnCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }, default: {},
    }),
  },
  exportIconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  exportBtnText: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginTop: 8 },

  // Footer
  footerInfo: { marginHorizontal: 20, marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  footerGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  footerText: { flex: 1, fontSize: 12, color: '#4B5563', fontWeight: '600' },
});
