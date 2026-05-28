import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
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

  // Top debtors
  const topDebtors = [...customers].filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);

  // Daily breakdown (last 7 days)
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.reports}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {([
            { key: 'daily', label: t.today },
            { key: 'weekly', label: t.thisWeek },
            { key: 'monthly', label: t.thisMonth },
          ] as const).map(item => (
            <Pressable
              key={item.key}
              style={[styles.periodChip, period === item.key && styles.periodChipActive]}
              onPress={() => setPeriod(item.key)}
            >
              <Text style={[styles.periodText, period === item.key && styles.periodTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF5F5' }]}>
            <MaterialIcons name="trending-up" size={24} color={theme.credit} />
            <Text style={styles.summaryLabel}>Credit Given</Text>
            <Text style={[styles.summaryValue, { color: theme.credit }]}>{formatCurrency(totalCredit)}</Text>
            <Text style={styles.summaryCount}>{creditCount} transactions</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FFF4' }]}>
            <MaterialIcons name="trending-down" size={24} color={theme.payment} />
            <Text style={styles.summaryLabel}>Payments</Text>
            <Text style={[styles.summaryValue, { color: theme.payment }]}>{formatCurrency(totalPayments)}</Text>
            <Text style={styles.summaryCount}>{paymentCount} transactions</Text>
          </View>
        </View>

        {/* Outstanding Card */}
        <View style={styles.outstandingCard}>
          <View style={styles.outstandingLeft}>
            <Text style={styles.outstandingLabel}>Total Outstanding</Text>
            <Text style={styles.outstandingValue}>{formatCurrency(outstanding)}</Text>
          </View>
          <View style={styles.outstandingRight}>
            <MaterialIcons name="warning" size={24} color={theme.warningDark} />
            <Text style={styles.outstandingCustomers}>{topDebtors.length} customers</Text>
          </View>
        </View>

        {/* Daily Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Overview</Text>
          <View style={styles.chartContainer}>
            {dailyBreakdown.map((day, index) => (
              <View key={index} style={styles.chartCol}>
                <View style={styles.barsWrapper}>
                  <View
                    style={[
                      styles.bar,
                      styles.creditBar,
                      { height: Math.max((day.credit / maxDailyAmount) * 100, 4) },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.debitBar,
                      { height: Math.max((day.debit / maxDailyAmount) * 100, 4) },
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

        {/* Top Debtors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Outstanding Customers</Text>
          {topDebtors.map((customer, index) => (
            <View key={customer.id} style={styles.debtorRow}>
              <Text style={styles.debtorRank}>#{index + 1}</Text>
              <View style={styles.debtorAvatar}>
                <Text style={styles.debtorAvatarText}>
                  {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={styles.debtorInfo}>
                <Text style={styles.debtorName}>{customer.name}</Text>
                <View style={styles.debtorBar}>
                  <View
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

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={20} color={theme.primary} />
              <Text style={styles.statItemValue}>{customers.length}</Text>
              <Text style={styles.statItemLabel}>Total Customers</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="receipt" size={20} color={theme.primary} />
              <Text style={styles.statItemValue}>{transactions.length}</Text>
              <Text style={styles.statItemLabel}>Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="calculate" size={20} color={theme.primary} />
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 14,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.surface,
    alignItems: 'center',
    borderWidth: 1,
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
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    ...theme.cardShadow,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginTop: 8,
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
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFDE7',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFF9C4',
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
    fontSize: 22,
    fontWeight: '700',
    color: theme.warningDark,
    marginTop: 4,
  },
  outstandingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outstandingCustomers: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    ...theme.cardShadow,
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
    width: 12,
    borderRadius: 4,
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
    marginTop: 6,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
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
  debtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  debtorRank: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textMuted,
    width: 28,
  },
  debtorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtorAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
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
    marginTop: 4,
    overflow: 'hidden',
  },
  debtorBarFill: {
    height: '100%',
    backgroundColor: theme.credit,
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
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    ...theme.cardShadow,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
    marginTop: 6,
  },
  statItemLabel: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
