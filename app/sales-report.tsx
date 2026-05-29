import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Share, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

export default function SalesReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, customers, formatCurrency } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const now = Date.now();
  const daysBack = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
  const periodTxns = transactions.filter(t => now - new Date(t.date).getTime() <= daysBack * 86400000);
  const totalCredit = periodTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalCollection = periodTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const avgDaily = totalCredit / Math.max(daysBack, 1);

  // Top customers
  const customerTotals = new Map<string, { name: string; credit: number; paid: number }>();
  periodTxns.forEach(t => {
    const existing = customerTotals.get(t.customerId) || { name: t.customerName, credit: 0, paid: 0 };
    if (t.type === 'credit') existing.credit += t.amount;
    else existing.paid += t.amount;
    customerTotals.set(t.customerId, existing);
  });
  const topCustomers = [...customerTotals.entries()].sort((a, b) => b[1].credit - a[1].credit).slice(0, 5);

  // Daily chart data
  const chartDays = Array.from({ length: Math.min(daysBack, 7) }, (_, i) => {
    const date = new Date(now - (daysBack - 1 - i) * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const dayCr = transactions.filter(t => t.date === dateStr && t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const dayDb = transactions.filter(t => t.date === dateStr && t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    return { label: date.toLocaleDateString('en-PK', { weekday: 'short' }), credit: dayCr, debit: dayDb };
  });
  const maxChart = Math.max(...chartDays.map(d => Math.max(d.credit, d.debit)), 1);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Sales Report</Text>
        <Pressable style={styles.shareBtn} onPress={() => Share.share({ message: `Sales Report (${period})\nCredit: ${formatCurrency(totalCredit)}\nCollection: ${formatCurrency(totalCollection)}` })}>
          <MaterialIcons name="share" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodRow}>
        {(['daily', 'weekly', 'monthly'] as const).map(p => (
          <Pressable key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: theme.credit }]}>
            <MaterialIcons name="arrow-upward" size={18} color={theme.credit} />
            <Text style={styles.summaryLabel}>Credit Given</Text>
            <Text style={[styles.summaryValue, { color: theme.credit }]}>{formatCurrency(totalCredit)}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: theme.payment }]}>
            <MaterialIcons name="arrow-downward" size={18} color={theme.payment} />
            <Text style={styles.summaryLabel}>Collected</Text>
            <Text style={[styles.summaryValue, { color: theme.payment }]}>{formatCurrency(totalCollection)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#1565C0' }]}>
            <MaterialIcons name="trending-up" size={18} color="#1565C0" />
            <Text style={styles.summaryLabel}>Avg Daily</Text>
            <Text style={[styles.summaryValue, { color: '#1565C0' }]}>{formatCurrency(Math.round(avgDaily))}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#6A1B9A' }]}>
            <MaterialIcons name="receipt" size={18} color="#6A1B9A" />
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={[styles.summaryValue, { color: '#6A1B9A' }]}>{periodTxns.length}</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Credit vs Collection</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.credit }]} /><Text style={styles.legendText}>Credit</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.payment }]} /><Text style={styles.legendText}>Collection</Text></View>
          </View>
          <View style={styles.chartContainer}>
            {chartDays.map((day, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={styles.chartBarGroup}>
                  <View style={[styles.chartBar, { height: Math.max(4, (day.credit / maxChart) * 80), backgroundColor: theme.credit }]} />
                  <View style={[styles.chartBar, { height: Math.max(4, (day.debit / maxChart) * 80), backgroundColor: theme.payment }]} />
                </View>
                <Text style={styles.chartLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Customers */}
        <Text style={styles.sectionTitle}>Top Customers</Text>
        {topCustomers.map(([id, data], i) => (
          <View key={id} style={styles.topCustomerRow}>
            <Text style={styles.rankNum}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.topName}>{data.name}</Text>
              <View style={styles.topBar}>
                <View style={[styles.topBarFill, { width: `${(data.credit / Math.max(topCustomers[0]?.[1].credit || 1, 1)) * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.topAmount}>{formatCurrency(data.credit)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  periodBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  periodText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  periodTextActive: { color: '#FFF' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 14, borderLeftWidth: 3, ...theme.cardShadow },
  summaryLabel: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  chartCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginTop: 6, ...theme.cardShadow },
  chartTitle: { fontSize: 15, fontWeight: '700', color: theme.textDark },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: theme.textMuted },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, marginTop: 16 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBarGroup: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  chartBar: { width: 12, borderRadius: 3 },
  chartLabel: { fontSize: 10, color: theme.textMuted, marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 12 },
  topCustomerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 6, gap: 10, ...theme.cardShadow },
  rankNum: { fontSize: 14, fontWeight: '700', color: theme.primary, width: 28 },
  topName: { fontSize: 14, fontWeight: '500', color: theme.textDark },
  topBar: { height: 4, backgroundColor: theme.borderLight, borderRadius: 2, marginTop: 6 },
  topBarFill: { height: '100%', backgroundColor: theme.credit, borderRadius: 2 },
  topAmount: { fontSize: 13, fontWeight: '700', color: theme.credit },
});
