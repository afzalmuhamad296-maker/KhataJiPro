import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCustomerById, getCustomerTransactions, deleteTransaction, formatCurrency, t } = useApp();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const customer = getCustomerById(id || '');
  const allTransactions = getCustomerTransactions(id || '');
  const transactions = allTransactions.filter(txn => filter === 'all' || txn.type === filter);

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Customer not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.primary }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleDeleteTransaction = (txnId: string) => {
    Alert.alert(
      t.delete,
      t.confirmDelete,
      [
        { text: t.no, style: 'cancel' },
        { text: t.yes, style: 'destructive', onPress: () => deleteTransaction(txnId) },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  };

  const groupedByDate = transactions.reduce((groups, txn) => {
    const date = txn.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, typeof transactions>);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.ledger}</Text>
        <Pressable style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color={theme.textDark} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Info Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>
              {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          <View style={[styles.balanceBadge, { backgroundColor: customer.balance > 0 ? theme.creditLight : theme.paymentLight }]}>
            <Text style={[styles.balanceText, { color: customer.balance > 0 ? theme.credit : theme.payment }]}>
              {customer.balance > 0 ? 'Due: ' : 'Clear: '}{formatCurrency(customer.balance)}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn}>
              <MaterialIcons name="phone" size={20} color={theme.primary} />
              <Text style={styles.actionLabel}>{t.call}</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <MaterialIcons name="sms" size={20} color={theme.primary} />
              <Text style={styles.actionLabel}>{t.sms}</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.paymentLight }]} onPress={() => router.push('/add-payment')}>
              <MaterialIcons name="payments" size={20} color={theme.payment} />
              <Text style={[styles.actionLabel, { color: theme.payment }]}>{t.pay}</Text>
            </Pressable>
          </View>
        </View>

        {/* Credit/Debit Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { borderLeftColor: theme.credit }]}>
            <Text style={styles.summaryLabel}>{t.totalCredit}</Text>
            <Text style={[styles.summaryValue, { color: theme.credit }]}>{formatCurrency(customer.totalCredit)}</Text>
          </View>
          <View style={[styles.summaryBox, { borderLeftColor: theme.payment }]}>
            <Text style={styles.summaryLabel}>{t.totalDebit}</Text>
            <Text style={[styles.summaryValue, { color: theme.payment }]}>{formatCurrency(customer.totalDebit)}</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
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
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Transaction List */}
        {Object.entries(groupedByDate).map(([date, txns]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateLabel}>{formatDate(date)}</Text>
            {txns.map(txn => (
              <Pressable
                key={txn.id}
                style={styles.txnRow}
                onLongPress={() => handleDeleteTransaction(txn.id)}
              >
                <View style={[styles.txnDot, { backgroundColor: txn.type === 'credit' ? theme.credit : theme.payment }]} />
                <View style={styles.txnInfo}>
                  <Text style={styles.txnNote}>{txn.note || (txn.type === 'credit' ? 'Credit given' : 'Payment received')}</Text>
                  {txn.items && txn.items.length > 0 && (
                    <View style={styles.itemsList}>
                      {txn.items.map(item => (
                        <Text key={item.id} style={styles.itemText}>
                          {item.name} × {item.quantity} = {formatCurrency(item.total)}
                        </Text>
                      ))}
                    </View>
                  )}
                  {txn.paymentMethod && (
                    <Text style={styles.txnMethod}>via {txn.paymentMethod}</Text>
                  )}
                </View>
                <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.credit : theme.payment }]}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={56} color={theme.border} />
            <Text style={styles.emptyText}>{t.noTransactions}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[styles.bottomBtn, styles.creditBtn]} onPress={() => router.push('/add-credit')}>
          <MaterialIcons name="add" size={20} color="#FFF" />
          <Text style={styles.bottomBtnText}>{t.addCredit}</Text>
        </Pressable>
        <Pressable style={[styles.bottomBtn, styles.paymentBtn]} onPress={() => router.push('/add-payment')}>
          <MaterialIcons name="payments" size={20} color="#FFF" />
          <Text style={styles.bottomBtnText}>{t.addPayment}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerCard: {
    marginHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    ...theme.cardShadow,
  },
  customerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.primary,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textDark,
    marginTop: 10,
  },
  customerPhone: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  balanceBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  summaryBox: {
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
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
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
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  dateGroup: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    ...theme.cardShadow,
  },
  txnDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  txnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txnNote: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textDark,
  },
  itemsList: {
    marginTop: 6,
  },
  itemText: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 18,
  },
  txnMethod: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: theme.textMuted,
    marginTop: 12,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  creditBtn: {
    backgroundColor: theme.credit,
  },
  paymentBtn: {
    backgroundColor: theme.payment,
  },
  bottomBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
