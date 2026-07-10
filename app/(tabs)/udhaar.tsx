import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function UdhaarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, customers, t, formatCurrency, language, isRTL, formatDate } = useApp();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [search, setSearch] = useState('');

  const totalCredit = transactions.filter(tx => tx.type === 'credit').reduce((s, tx) => s + tx.amount, 0);
  const totalDebit = transactions.filter(tx => tx.type === 'debit').reduce((s, tx) => s + tx.amount, 0);
  const netOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);

  const filtered = useMemo(() => {
    return transactions
      .filter(tx => filter === 'all' || tx.type === filter)
      .filter(tx =>
        tx.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (tx.note || '').toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, search]);

  const grouped = useMemo(() => {
    return filtered.reduce((groups, tx) => {
      const key = tx.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
      return groups;
    }, {} as Record<string, typeof filtered>);
  }, [filtered]);

  const getDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return t.today;
    if (dateStr === yest) return t.yesterday;
    return formatDate(dateStr);
  };

  const creditCount = transactions.filter(tx => tx.type === 'credit').length;
  const debitCount = transactions.filter(tx => tx.type === 'debit').length;

  return (
    <SafeAreaView edges={['top']} style={s.container}>
      <LinearGradient colors={['#0A6B3F', '#0D7C4A', '#065F37']} style={s.header}>
        <View style={[s.headerTopRow, isRTL && s.rtlRow]}>
          <View style={isRTL && { alignItems: 'flex-end' }}>
            <Text style={s.headerTitle}>💰 {t.udhaar}</Text>
            <Text style={s.headerSub}>
              {language === 'ur' ? `${transactions.length} کل لین دین` : `${transactions.length} total transactions`}
            </Text>
          </View>
          <View style={s.headerBadge}>
            <MaterialIcons name="account-balance" size={16} color="#FFD700" />
            <Text style={s.headerBadgeText}>{customers.length}</Text>
          </View>
        </View>

        {/* Net Position Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>{t.totalOutstanding}</Text>
          <Text style={s.heroValue}>{formatCurrency(netOutstanding)}</Text>
          <View style={[s.heroStats, isRTL && s.rtlRow]}>
            <View style={s.heroStat}>
              <View style={[s.heroStatIcon, { backgroundColor: 'rgba(252,165,165,0.2)' }]}>
                <MaterialIcons name="north-east" size={14} color="#FCA5A5" />
              </View>
              <View>
                <Text style={s.heroStatLabel}>{t.totalCredit}</Text>
                <Text style={s.heroStatVal}>{formatCurrency(totalCredit)}</Text>
              </View>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <View style={[s.heroStatIcon, { backgroundColor: 'rgba(134,239,172,0.2)' }]}>
                <MaterialIcons name="south-west" size={14} color="#86EFAC" />
              </View>
              <View>
                <Text style={s.heroStatLabel}>{t.totalDebit}</Text>
                <Text style={s.heroStatVal}>{formatCurrency(totalDebit)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[s.actionsRow, isRTL && s.rtlRow]}>
          <Pressable
            style={({ pressed }) => [s.actionBtn, { backgroundColor: theme.credit }, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/add-credit')}
          >
            <MaterialIcons name="north-east" size={18} color="#FFF" />
            <Text style={s.actionBtnText}>+ {t.credit}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.actionBtn, { backgroundColor: theme.payment }, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/add-payment')}
          >
            <MaterialIcons name="south-west" size={18} color="#FFF" />
            <Text style={s.actionBtnText}>+ {t.debit}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={s.searchBox}>
        <MaterialIcons name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={[s.searchInput, isRTL && s.rtlText]}
          placeholder={language === 'ur' ? 'گاہک یا نوٹ تلاش کریں' : 'Search customer or note...'}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={theme.textMuted}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={6}>
            <MaterialIcons name="close" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filtersRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 4 }}
      >
        {[
          { key: 'all' as const, label: t.all, icon: 'list', count: transactions.length, color: theme.primary },
          { key: 'credit' as const, label: t.credits, icon: 'north-east', count: creditCount, color: theme.credit },
          { key: 'debit' as const, label: t.payments, icon: 'south-west', count: debitCount, color: theme.payment },
        ].map(item => {
          const active = filter === item.key;
          return (
            <Pressable
              key={item.key}
              style={[s.filterChip, active && { backgroundColor: item.color, borderColor: item.color }]}
              onPress={() => setFilter(item.key)}
            >
              <MaterialIcons name={item.icon as any} size={14} color={active ? '#FFF' : item.color} />
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{item.label}</Text>
              <View style={[s.filterCount, active && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[s.filterCountText, active && { color: '#FFF' }]}>{item.count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([date, txns]) => (
          <View key={date}>
            <View style={[s.dateHead, isRTL && s.rtlRow]}>
              <View style={s.dateLine} />
              <View style={s.dateBadge}>
                <MaterialIcons name="event" size={12} color={theme.primary} />
                <Text style={s.dateBadgeText}>{getDateLabel(date)}</Text>
                <View style={s.dateCount}>
                  <Text style={s.dateCountText}>{txns.length}</Text>
                </View>
              </View>
              <View style={s.dateLine} />
            </View>
            {txns.map(tx => (
              <Pressable
                key={tx.id}
                style={({ pressed }) => [s.txnCard, pressed && { opacity: 0.85 }, isRTL && s.rtlRow]}
                onPress={() => router.push(`/ledger/${tx.customerId}` as any)}
              >
                <View style={[s.txnIcon, { backgroundColor: tx.type === 'credit' ? theme.creditLight : theme.paymentLight }]}>
                  <MaterialIcons
                    name={tx.type === 'credit' ? 'north-east' : 'south-west'}
                    size={18}
                    color={tx.type === 'credit' ? theme.credit : theme.payment}
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[s.txnName, isRTL && s.rtlText]} numberOfLines={1}>{tx.customerName}</Text>
                  <Text style={[s.txnNote, isRTL && s.rtlText]} numberOfLines={1}>
                    {tx.note || (tx.type === 'credit' ? t.creditGiven : t.paymentReceived)}
                  </Text>
                  {tx.items && tx.items.length > 0 ? (
                    <View style={s.itemsRow}>
                      {tx.items.slice(0, 3).map(item => (
                        <View key={item.id} style={s.itemBadge}>
                          <Text style={s.itemBadgeText} numberOfLines={1}>
                            {item.name} ×{item.quantity}
                          </Text>
                        </View>
                      ))}
                      {tx.items.length > 3 ? (
                        <View style={s.itemBadge}>
                          <Text style={s.itemBadgeText}>+{tx.items.length - 3}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <View style={s.txnAmtCol}>
                  <Text style={[s.txnAmt, { color: tx.type === 'credit' ? theme.credit : theme.payment }]}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                  {tx.paymentMethod ? (
                    <View style={s.methodBadge}>
                      <MaterialIcons
                        name={
                          tx.paymentMethod === 'cash' ? 'payments' :
                          tx.paymentMethod === 'bank' ? 'account-balance' :
                          tx.paymentMethod === 'easypaisa' ? 'phone-android' :
                          tx.paymentMethod === 'jazzcash' ? 'phone-iphone' : 'credit-card'
                        }
                        size={9}
                        color={theme.textMuted}
                      />
                      <Text style={s.methodText}>{tx.paymentMethod}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 60 }}>📋</Text>
            <Text style={s.emptyTitle}>
              {search
                ? (language === 'ur' ? 'کوئی نتیجہ نہیں' : 'No results found')
                : t.noTransactions}
            </Text>
            <Text style={s.emptySub}>
              {language === 'ur' ? 'پہلا لین دین شامل کریں' : 'Add your first transaction below'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Pressable style={s.emptyBtn} onPress={() => router.push('/add-credit')}>
                <LinearGradient colors={[theme.credit, '#B91C1C']} style={s.emptyBtnGrad}>
                  <MaterialIcons name="north-east" size={16} color="#FFF" />
                  <Text style={s.emptyBtnText}>{t.credit}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={s.emptyBtn} onPress={() => router.push('/add-payment')}>
                <LinearGradient colors={[theme.payment, '#15803D']} style={s.emptyBtnGrad}>
                  <MaterialIcons name="south-west" size={16} color="#FFF" />
                  <Text style={s.emptyBtnText}>{t.debit}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  headerBadgeText: { fontSize: 12, fontWeight: '800', color: '#FFD700' },
  heroCard: {
    marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue: { fontSize: 30, fontWeight: '800', color: '#FFF', marginTop: 4, letterSpacing: -0.5 },
  heroStats: { flexDirection: 'row', marginTop: 12, gap: 4 },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  heroStatVal: { fontSize: 13, fontWeight: '800', color: '#FFF', marginTop: 1 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 14, backgroundColor: '#FFF',
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 }, default: {},
    }),
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.textDark },
  filtersRow: { marginTop: 12, maxHeight: 50 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: theme.border,
  },
  filterChipText: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
  filterChipTextActive: { color: '#FFF' },
  filterCount: { backgroundColor: theme.background, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, minWidth: 20, alignItems: 'center' },
  filterCountText: { fontSize: 10, fontWeight: '800', color: theme.textMuted },
  dateHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
  dateLine: { flex: 1, height: 1, backgroundColor: theme.borderLight },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: theme.primary + '30' },
  dateBadgeText: { fontSize: 11, fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateCount: { backgroundColor: theme.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, minWidth: 18, alignItems: 'center' },
  dateCountText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  txnCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF', padding: 12, borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 }, default: {},
    }),
  },
  txnIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnName: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  txnNote: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  itemBadge: { backgroundColor: theme.backgroundSecondary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  itemBadgeText: { fontSize: 10, color: theme.primary, fontWeight: '700' },
  txnAmtCol: { alignItems: 'flex-end', marginLeft: 8 },
  txnAmt: { fontSize: 14, fontWeight: '800' },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.borderLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  methodText: { fontSize: 9, color: theme.textMuted, fontWeight: '700', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, color: theme.textDark, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, color: theme.textMuted, marginTop: 6 },
  emptyBtn: { borderRadius: 12, overflow: 'hidden' },
  emptyBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  emptyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
