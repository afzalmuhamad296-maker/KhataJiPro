import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { customers, transactions, t, formatCurrency } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const getFilteredTransactions = () => {
    let startDate = today;
    if (period === 'weekly') startDate = weekAgo;
    if (period === 'monthly') startDate = monthAgo;
    return transactions.filter(txn => txn.date >= startDate);
  };

  const filtered = getFilteredTransactions();
  const totalCredit = filtered.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalPayments = filtered.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const outstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const creditCount = filtered.filter(t => t.type === 'credit').length;
  const paymentCount = filtered.filter(t => t.type === 'debit').length;

  const topDebtors = [...customers].filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);

  const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dayTxns = transactions.filter(t => t.date === date);
    const credit = dayTxns.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const debit = dayTxns.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    return { date, credit, debit, day: new Date(date).toLocaleDateString('en-PK', { weekday: 'short' }) };
  }).reverse();

  const maxDailyAmount = Math.max(...dailyBreakdown.map(d => Math.max(d.credit, d.debit)), 1);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.reports}</Text>
          <Text style={styles.subtitle}>Business analytics overview</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {([
            { key: 'daily', label: t.today, icon: 'today' },
            { key: 'weekly', label: t.thisWeek, icon: 'date-range' },
            { key: 'monthly', label: t.thisMonth, icon: 'calendar-month' },
          ] as const).map(item => (
            <Pressable
              key={item.key}
              style={[styles.periodChip, period === item.key && styles.periodChipActive]}
              onPress={() => setPeriod(item.key)}
            >
              <MaterialIcons name={item.icon as any} size={14} color={period === item.key ? '#FFF' : theme.textMuted} />
              <Text style={[styles.periodText, period === item.key && styles.periodTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.summaryCardIcon}>
              <MaterialIcons name="trending-up" size={20} color={theme.credit} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>Credit Given</Text>
            <Text style={[styles.summaryValue, { color: theme.credit }]}>{formatCurrency(totalCredit)}</Text>
            <Text style={styles.summaryCount}>{creditCount} txns</Text>
          </View>
          <View style={styles.summaryCard}>
            <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.summaryCardIcon}>
              <MaterialIcons name="trending-down" size={20} color={theme.payment} />
            </LinearGradient>
            <Text style={styles.summaryLabel}>Collected</Text>
            <Text style={[styles.summaryValue, { color: theme.payment }]}>{formatCurrency(totalPayments)}</Text>
            <Text style={styles.summaryCount}>{paymentCount} txns</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <LinearGradient
            colors={['#FFFBEB', '#FEF3C7']}
            style={styles.outstandingGradient}
          >
            <View style={styles.outstandingLeft}>
              <Text style={styles.outstandingLabel}>Total Outstanding</Text>
              <Text style={styles.outstandingValue}>{formatCurrency(outstanding)}</Text>
            </View>
            <View style={styles.outstandingRight}>
              <View style={styles.outstandingIconWrap}>
                <MaterialIcons name="account-balance-wallet" size={22} color="#D97706" />
              </View>
              <Text style={styles.outstandingCustomers}>{topDebtors.length} customers</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Daily Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Overview</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {dailyBreakdown.map((day, index) => (
                <View key={index} style={styles.chartCol}>
                  <View style={styles.barsWrapper}>
                    <View
                      style={[
                        styles.bar,
                        styles.creditBar,
                        { height: Math.max((day.credit / maxDailyAmount) * 90, 4) },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.debitBar,
                        { height: Math.max((day.debit / maxDailyAmount) * 90, 4) },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{day.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.credit }]} />
                <Text style={styles.legendText}>Credit</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.payment }]} />
                <Text style={styles.legendText}>Payment</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Debtors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Outstanding</Text>
          <View style={styles.debtorsList}>
            {topDebtors.map((customer, index) => (
              <View key={customer.id} style={styles.debtorRow}>
                <View style={[styles.rankBadge, index === 0 && { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.rankText, index === 0 && { color: '#D97706' }]}>#{index + 1}</Text>
                </View>
                <View style={styles.debtorInfo}>
                  <Text style={styles.debtorName}>{customer.name}</Text>
                  <View style={styles.debtorBar}>
                    <LinearGradient
                      colors={[theme.credit, '#F87171']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.debtorBarFill,
                        { width: `${(customer.balance / (topDebtors[0]?.balance || 1)) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.debtorAmount}>{formatCurrency(customer.balance)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <LinearGradient colors={['#E8F5ED', '#D1FAE5']} style={styles.statIcon}>
                <MaterialIcons name="people" size={20} color={theme.primary} />
              </LinearGradient>
              <Text style={styles.statItemValue}>{customers.length}</Text>
              <Text style={styles.statItemLabel}>Customers</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={styles.statIcon}>
                <MaterialIcons name="receipt" size={20} color="#2563EB" />
              </LinearGradient>
              <Text style={styles.statItemValue}>{transactions.length}</Text>
              <Text style={styles.statItemLabel}>Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient colors={['#F3E8FF', '#E9D5FF']} style={styles.statIcon}>
                <MaterialIcons name="calculate" size={20} color="#7C3AED" />
              </LinearGradient>
              <Text style={styles.statItemValue}>
                {formatCurrency(Math.round(totalCredit / Math.max(creditCount, 1)))}
              </Text>
              <Text style={styles.statItemLabel}>Avg Credit</Text>
            </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.textDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 18,
  },
  periodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  periodChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  periodTextActive: {
    color: '#FFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 18,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  summaryCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginTop: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryCount: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
  outstandingCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  outstandingGradient: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
  },
  outstandingLeft: {
    flex: 1,
  },
  outstandingLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  outstandingValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  outstandingRight: {
    alignItems: 'center',
  },
  outstandingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(217,119,6,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outstandingCustomers: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    flex: 1,
    justifyContent: 'center',
  },
  bar: {
    width: 14,
    borderRadius: 5,
    minHeight: 4,
  },
  creditBar: {
    backgroundColor: theme.credit,
  },
  debitBar: {
    backgroundColor: theme.payment,
  },
  chartLabel: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  debtorsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  debtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  rankBadge: {
    width: 30,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
  },
  debtorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  debtorName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  debtorBar: {
    height: 5,
    backgroundColor: theme.borderLight,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  debtorBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  debtorAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.credit,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItemValue: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textDark,
    marginTop: 8,
  },
  statItemLabel: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
});
