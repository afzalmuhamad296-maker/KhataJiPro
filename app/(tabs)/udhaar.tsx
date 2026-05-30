import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function UdhaarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, t, formatCurrency } = useApp();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const filteredTransactions = transactions
    .filter(txn => filter === 'all' || txn.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  const groupedByDate = filteredTransactions.reduce((groups, txn) => {
    const date = txn.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, typeof filteredTransactions>);

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.udhaar}</Text>
        <View style={styles.headerActions}>
          <Pressable style={({ pressed }) => [styles.addCreditBtn, pressed && { opacity: 0.85 }]} onPress={() => router.push('/add-credit')}>
            <MaterialIcons name="north-east" size={16} color="#FFF" />
            <Text style={styles.addBtnText}>{t.credit}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.addPaymentBtn, pressed && { opacity: 0.85 }]} onPress={() => router.push('/add-payment')}>
            <MaterialIcons name="south-west" size={16} color="#FFF" />
            <Text style={styles.addBtnText}>{t.debit}</Text>
          </Pressable>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <LinearGradient colors={['#FEE2E2', '#FECACA']} style={styles.summaryIconWrap}>
            <MaterialIcons name="north-east" size={18} color={theme.credit} />
          </LinearGradient>
          <Text style={styles.summaryLabel}>{t.totalCredit}</Text>
          <Text style={[styles.summaryAmount, { color: theme.credit }]}>{formatCurrency(totalCredit)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.summaryIconWrap}>
            <MaterialIcons name="south-west" size={18} color={theme.payment} />
          </LinearGradient>
          <Text style={styles.summaryLabel}>{t.totalDebit}</Text>
          <Text style={[styles.summaryAmount, { color: theme.payment }]}>{formatCurrency(totalDebit)}</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {([
          { key: 'all', label: t.all, icon: 'list' },
          { key: 'credit', label: t.credits, icon: 'north-east' },
          { key: 'debit', label: t.payments, icon: 'south-west' },
        ] as const).map(item => (
          <Pressable
            key={item.key}
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <MaterialIcons name={item.icon as any} size={14} color={filter === item.key ? '#FFF' : theme.textMuted} />
            <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Transaction List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedByDate).map(([date, txns]) => (
          <View key={date}>
            <View style={styles.dateHeaderRow}>
              <View style={styles.dateHeaderLine} />
              <Text style={styles.dateHeader}>{formatDate(date)}</Text>
              <View style={styles.dateHeaderLine} />
            </View>
            {txns.map(txn => (
              <Pressable key={txn.id} style={({ pressed }) => [styles.txnCard, pressed && { opacity: 0.85 }]}>
                <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? theme.creditLight : theme.paymentLight }]}>
                  <MaterialIcons
                    name={txn.type === 'credit' ? 'north-east' : 'south-west'}
                    size={18}
                    color={txn.type === 'credit' ? theme.credit : theme.payment}
                  />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{txn.customerName}</Text>
                  <Text style={styles.txnNote} numberOfLines={1}>{txn.note}</Text>
                  {txn.items && txn.items.length > 0 ? (
                    <View style={styles.itemsRow}>
                      {txn.items.slice(0, 3).map(item => (
                        <View key={item.id} style={styles.itemChip}>
                          <Text style={styles.itemChipText}>{item.name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View style={styles.txnAmountCol}>
                  <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.credit : theme.payment }]}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                  {txn.paymentMethod ? (
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>{txn.paymentMethod}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="receipt-long" size={40} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyText}>{t.noTransactions}</Text>
          </View>
        ) : null}
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  addCreditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.credit,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.payment,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginTop: 10,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 18,
    marginBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
    gap: 10,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txnName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  txnNote: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  itemChip: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemChipText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  txnAmountCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  methodBadge: {
    backgroundColor: theme.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  methodText: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    fontWeight: '500',
  },
});
