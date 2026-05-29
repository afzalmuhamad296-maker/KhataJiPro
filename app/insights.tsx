import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, formatCurrency, getTodayStats } = useApp();
  const stats = getTodayStats();

  // Calculate insights
  const weekTxns = transactions.filter(t => {
    const txnDate = new Date(t.date).getTime();
    return Date.now() - txnDate <= 7 * 86400000;
  });
  const weekCredit = weekTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const weekCollection = weekTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const collectionRate = weekCredit > 0 ? Math.round((weekCollection / weekCredit) * 100) : 0;

  // Day analysis
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = dayNames.map((name, i) => {
    const dayTxns = transactions.filter(t => new Date(t.date).getDay() === i && t.type === 'credit');
    return { name, total: dayTxns.reduce((s, t) => s + t.amount, 0) };
  });
  const bestDay = dayTotals.reduce((best, d) => d.total > best.total ? d : best, dayTotals[0]);
  const worstDay = dayTotals.filter(d => d.total > 0).reduce((worst, d) => d.total < worst.total ? d : worst, dayTotals[0]);

  // Customer predictions
  const topPayers = [...customers]
    .filter(c => c.totalDebit > 0)
    .sort((a, b) => (b.totalDebit / Math.max(b.totalCredit, 1)) - (a.totalDebit / Math.max(a.totalCredit, 1)))
    .slice(0, 5);

  const atRisk = customers.filter(c => c.balance > 10000 && !c.lastTransaction);

  // Growth calc
  const prevWeekTxns = transactions.filter(t => {
    const txnDate = new Date(t.date).getTime();
    const diff = Date.now() - txnDate;
    return diff > 7 * 86400000 && diff <= 14 * 86400000;
  });
  const prevWeekCredit = prevWeekTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const growthPercent = prevWeekCredit > 0 ? Math.round(((weekCredit - prevWeekCredit) / prevWeekCredit) * 100) : 0;

  const insights = [
    { icon: 'trending-up', color: growthPercent >= 0 ? theme.payment : theme.credit, title: growthPercent >= 0 ? `Business up ${growthPercent}%` : `Business down ${Math.abs(growthPercent)}%`, subtitle: `This week vs last week credit`, priority: 'high' },
    { icon: 'schedule', color: '#FF9800', title: `${bestDay.name} is your best day`, subtitle: `Avg ${formatCurrency(bestDay.total)} in credit`, priority: 'medium' },
    { icon: 'warning', color: theme.credit, title: `${worstDay.name} has lowest sales`, subtitle: `Consider running offers on ${worstDay.name}`, priority: 'low' },
    { icon: 'account-balance-wallet', color: theme.primary, title: `Collection rate: ${collectionRate}%`, subtitle: `${formatCurrency(weekCollection)} collected out of ${formatCurrency(weekCredit)} credit`, priority: 'high' },
    { icon: 'people', color: '#1565C0', title: `${customers.filter(c => c.balance > 0).length} customers have dues`, subtitle: `Total outstanding: ${formatCurrency(stats.outstanding)}`, priority: 'medium' },
    { icon: 'star', color: '#6A1B9A', title: `${topPayers[0]?.name || 'N/A'} pays most reliably`, subtitle: `Payment rate: ${topPayers[0] ? Math.round((topPayers[0].totalDebit / Math.max(topPayers[0].totalCredit, 1)) * 100) : 0}%`, priority: 'medium' },
  ];

  const getPriorityColor = (p: string) => p === 'high' ? theme.credit : p === 'medium' ? '#FF9800' : theme.payment;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Business Insights</Text>
        <View style={styles.aiBadge}>
          <MaterialIcons name="auto-awesome" size={14} color="#FFF" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Weekly Summary */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>This Week Summary</Text>
          <View style={styles.weekStats}>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatValue, { color: theme.credit }]}>{formatCurrency(weekCredit)}</Text>
              <Text style={styles.weekStatLabel}>Credit Given</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatValue, { color: theme.payment }]}>{formatCurrency(weekCollection)}</Text>
              <Text style={styles.weekStatLabel}>Collected</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={[styles.weekStatValue, { color: theme.primary }]}>{weekTxns.length}</Text>
              <Text style={styles.weekStatLabel}>Transactions</Text>
            </View>
          </View>
        </View>

        {/* Day Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sales by Day</Text>
          <View style={styles.chartBars}>
            {dayTotals.map(day => {
              const maxTotal = Math.max(...dayTotals.map(d => d.total), 1);
              const height = Math.max(10, (day.total / maxTotal) * 80);
              return (
                <View key={day.name} style={styles.barCol}>
                  <View style={[styles.bar, { height, backgroundColor: day.name === bestDay.name ? theme.primary : theme.border }]} />
                  <Text style={[styles.barLabel, day.name === bestDay.name && { color: theme.primary, fontWeight: '700' }]}>{day.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI Insights */}
        <Text style={styles.sectionTitle}>AI Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
              <MaterialIcons name={insight.icon as any} size={22} color={insight.color} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightSubtitle}>{insight.subtitle}</Text>
            </View>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(insight.priority) }]} />
          </View>
        ))}

        {/* Top Payers */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Reliable Payers</Text>
        {topPayers.map((customer, i) => {
          const rate = Math.round((customer.totalDebit / Math.max(customer.totalCredit, 1)) * 100);
          return (
            <View key={customer.id} style={styles.payerRow}>
              <Text style={styles.payerRank}>#{i + 1}</Text>
              <View style={styles.payerInfo}>
                <Text style={styles.payerName}>{customer.name}</Text>
                <View style={styles.payerBar}>
                  <View style={[styles.payerBarFill, { width: `${Math.min(rate, 100)}%` }]} />
                </View>
              </View>
              <Text style={styles.payerRate}>{rate}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6A1B9A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  aiBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  weekCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.lg, padding: 20, ...theme.cardShadow },
  weekTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark, marginBottom: 16 },
  weekStats: { flexDirection: 'row', justifyContent: 'space-between' },
  weekStat: { alignItems: 'center' },
  weekStatValue: { fontSize: 16, fontWeight: '700' },
  weekStatLabel: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
  chartCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginTop: 16, ...theme.cardShadow },
  chartTitle: { fontSize: 14, fontWeight: '700', color: theme.textDark, marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 20, borderRadius: 4 },
  barLabel: { fontSize: 11, color: theme.textMuted, marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 12 },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 14, borderRadius: theme.borderRadius.md, marginBottom: 8, ...theme.cardShadow },
  insightIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1, marginLeft: 12 },
  insightTitle: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  insightSubtitle: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  payerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 6, ...theme.cardShadow },
  payerRank: { fontSize: 14, fontWeight: '700', color: theme.primary, width: 30 },
  payerInfo: { flex: 1 },
  payerName: { fontSize: 14, fontWeight: '500', color: theme.textDark },
  payerBar: { height: 4, backgroundColor: theme.borderLight, borderRadius: 2, marginTop: 6 },
  payerBarFill: { height: '100%', backgroundColor: theme.payment, borderRadius: 2 },
  payerRate: { fontSize: 14, fontWeight: '700', color: theme.payment, width: 40, textAlign: 'right' },
});
