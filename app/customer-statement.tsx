import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Share, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

export default function CustomerStatementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, getCustomerTransactions, getCustomerById, formatCurrency, settings } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState(id || '');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [showPicker, setShowPicker] = useState(false);

  const customer = getCustomerById(selectedCustomer);
  const allTxns = getCustomerTransactions(selectedCustomer);

  const now = Date.now();
  const rangeDays = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 99999;
  const filteredTxns = allTxns.filter(t => {
    const txnDate = new Date(t.date).getTime();
    return now - txnDate <= rangeDays * 86400000;
  });

  const totalCredit = filteredTxns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = filteredTxns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const closingBalance = totalCredit - totalDebit;

  const handleShare = async () => {
    if (!customer) return;
    let statement = `═══ CUSTOMER STATEMENT ═══\n${settings.shopName}\n\n`;
    statement += `Customer: ${customer.name}\nPhone: ${customer.phone}\nPeriod: Last ${rangeDays} days\n\n`;
    statement += `Opening Balance: Rs. 0\n─────────────────────\n`;
    let runningBalance = 0;
    filteredTxns.reverse().forEach(t => {
      if (t.type === 'credit') runningBalance += t.amount;
      else runningBalance -= t.amount;
      statement += `${t.date} | ${t.type === 'credit' ? 'CR' : 'DR'} | Rs. ${t.amount} | Bal: Rs. ${runningBalance}\n`;
      if (t.note) statement += `  Note: ${t.note}\n`;
    });
    statement += `─────────────────────\nTotal Credit: ${formatCurrency(totalCredit)}\nTotal Paid: ${formatCurrency(totalDebit)}\nClosing Balance: ${formatCurrency(closingBalance)}\n═══════════════════════`;
    try {
      await Share.share({ message: statement });
    } catch {
      // cancelled
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Customer Statement</Text>
        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Customer Picker */}
        <Pressable style={styles.customerPicker} onPress={() => setShowPicker(!showPicker)}>
          <View style={styles.pickerLeft}>
            {customer ? (
              <>
                <View style={styles.pickerAvatar}>
                  <Text style={styles.pickerAvatarText}>{customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
                </View>
                <View>
                  <Text style={styles.pickerName}>{customer.name}</Text>
                  <Text style={styles.pickerPhone}>{customer.phone}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.pickerPlaceholder}>Select Customer</Text>
            )}
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color={theme.textMuted} />
        </Pressable>

        {showPicker && (
          <View style={styles.pickerDropdown}>
            {customers.filter(c => c.balance > 0).slice(0, 15).map(c => (
              <Pressable key={c.id} style={styles.pickerOption} onPress={() => { setSelectedCustomer(c.id); setShowPicker(false); }}>
                <Text style={styles.pickerOptionName}>{c.name}</Text>
                <Text style={styles.pickerOptionBalance}>{formatCurrency(c.balance)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Date Range */}
        <View style={styles.dateRangeRow}>
          {(['7days', '30days', '90days', 'all'] as const).map(range => (
            <Pressable key={range} style={[styles.rangeChip, dateRange === range && styles.rangeChipActive]} onPress={() => setDateRange(range)}>
              <Text style={[styles.rangeText, dateRange === range && styles.rangeTextActive]}>
                {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : range === '90days' ? '90 Days' : 'All'}
              </Text>
            </Pressable>
          ))}
        </View>

        {customer ? (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Credit</Text>
                  <Text style={[styles.summaryValue, { color: theme.credit }]}>{formatCurrency(totalCredit)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Paid</Text>
                  <Text style={[styles.summaryValue, { color: theme.payment }]}>{formatCurrency(totalDebit)}</Text>
                </View>
              </View>
              <View style={[styles.balanceBar, { backgroundColor: closingBalance > 0 ? theme.creditLight : theme.paymentLight }]}>
                <Text style={[styles.balanceBarText, { color: closingBalance > 0 ? theme.credit : theme.payment }]}>
                  Closing Balance: {formatCurrency(Math.abs(closingBalance))} {closingBalance > 0 ? '(Due)' : '(Advance)'}
                </Text>
              </View>
            </View>

            {/* Statement Table */}
            <View style={styles.statementCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Credit</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Paid</Text>
                <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Balance</Text>
              </View>
              {(() => {
                let runBal = 0;
                return filteredTxns.slice().reverse().map(txn => {
                  if (txn.type === 'credit') runBal += txn.amount;
                  else runBal -= txn.amount;
                  return (
                    <View key={txn.id} style={styles.tableRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tableDate}>{new Date(txn.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</Text>
                        {txn.note ? <Text style={styles.tableNote} numberOfLines={1}>{txn.note}</Text> : null}
                      </View>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'right', color: theme.credit }]}>
                        {txn.type === 'credit' ? formatCurrency(txn.amount) : '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'right', color: theme.payment }]}>
                        {txn.type === 'debit' ? formatCurrency(txn.amount) : '-'}
                      </Text>
                      <Text style={[styles.tableCellBold, { width: 80, textAlign: 'right' }]}>
                        {formatCurrency(Math.abs(runBal))}
                      </Text>
                    </View>
                  );
                });
              })()}
              {filteredTxns.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No transactions in this period</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleShare}>
                <MaterialIcons name="chat" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={handleShare}>
                <MaterialIcons name="picture-as-pdf" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>PDF</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#1565C0' }]} onPress={handleShare}>
                <MaterialIcons name="print" size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Print</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="description" size={56} color={theme.border} />
            <Text style={styles.emptyText}>Select a customer to view statement</Text>
          </View>
        )}
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
  customerPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 14, borderRadius: theme.borderRadius.md, ...theme.cardShadow },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  pickerName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  pickerPhone: { fontSize: 12, color: theme.textMuted },
  pickerPlaceholder: { fontSize: 15, color: theme.textMuted },
  pickerDropdown: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, marginTop: 6, borderWidth: 1, borderColor: theme.border, maxHeight: 250 },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  pickerOptionName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  pickerOptionBalance: { fontSize: 13, fontWeight: '700', color: theme.credit },
  dateRangeRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  rangeChip: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  rangeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  rangeText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  rangeTextActive: { color: '#FFF' },
  summaryCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginTop: 16, ...theme.cardShadow },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: theme.textMuted },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: theme.border },
  balanceBar: { marginTop: 12, padding: 10, borderRadius: 8, alignItems: 'center' },
  balanceBarText: { fontSize: 14, fontWeight: '700' },
  statementCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, marginTop: 16, overflow: 'hidden', ...theme.cardShadow },
  tableHeader: { flexDirection: 'row', backgroundColor: theme.primary, padding: 10 },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight, alignItems: 'center' },
  tableDate: { fontSize: 12, fontWeight: '500', color: theme.textDark },
  tableNote: { fontSize: 10, color: theme.textMuted, marginTop: 1 },
  tableCell: { fontSize: 12, color: theme.textDark },
  tableCellBold: { fontSize: 12, fontWeight: '700', color: theme.textDark },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: theme.borderRadius.md },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: theme.textMuted, marginTop: 12 },
});
