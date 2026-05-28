import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
          <Pressable style={styles.addCreditBtn} onPress={() => router.push('/add-credit')}>
            <MaterialIcons name="add" size={18} color="#FFF" />
            <Text style={styles.addCreditText}>{t.credit}</Text>
          </Pressable>
          <Pressable style={styles.addPaymentBtn} onPress={() => router.push('/add-payment')}>
            <MaterialIcons name="add" size={18} color="#FFF" />
            <Text style={styles.addPaymentText}>{t.debit}</Text>
          </Pressable>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: theme.credit }]}>
          <Text style={styles.summaryLabel}>{t.totalCredit}</Text>
          <Text style={[styles.summaryAmount, { color: theme.credit }]}>{formatCurrency(totalCredit)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: theme.payment }]}>
          <Text style={styles.summaryLabel}>{t.totalDebit}</Text>
          <Text style={[styles.summaryAmount, { color: theme.payment }]}>{formatCurrency(totalDebit)}</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {([
          { key: 'all', label: t.all },
          { key: 'credit', label: t.credits },
          { key: 'debit', label: t.payments },
        ] as const).map(item => (
          <Pressable
            key={item.key}
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedByDate).map(([date, txns]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{formatDate(date)}</Text>
            {txns.map(txn => (
              <Pressable key={txn.id} style={styles.txnCard}>
                <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? theme.creditLight : theme.paymentLight }]}>
                  <MaterialIcons
                    name={txn.type === 'credit' ? 'arrow-upward' : 'arrow-downward'}
                    size={20}
                    color={txn.type === 'credit' ? theme.credit : theme.payment}
                  />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{txn.customerName}</Text>
                  <Text style={styles.txnNote} numberOfLines={1}>{txn.note}</Text>
                  {txn.items && txn.items.length > 0 && (
                    <View style={styles.itemsRow}>
                      {txn.items.map(item => (
                        <View key={item.id} style={styles.itemChip}>
                          <Text style={styles.itemChipText}>{item.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.txnAmountCol}>
                  <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.credit : theme.payment }]}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                  {txn.paymentMethod && (
                    <Text style={styles.payMethod}>{txn.paymentMethod}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color={theme.border} />
            <Text style={styles.emptyText}>{t.noTransactions}</Text>
          </View>
        )}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addCreditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.credit,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  addCreditText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.payment,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  addPaymentText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderLeftWidth: 3,
    ...theme.cardShadow,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  filterRow: {
    marginTop: 14,
    maxHeight: 44,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
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
  dateHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    ...theme.cardShadow,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 13,
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
  payMethod: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
  },
});
