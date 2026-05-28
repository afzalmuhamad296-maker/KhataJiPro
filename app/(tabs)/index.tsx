import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, transactions, settings, t, formatCurrency, getTodayStats } = useApp();
  const stats = getTodayStats();

  const recentTransactions = transactions.slice(0, 8);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.shopName}>{settings.shopName}</Text>
          </View>
          <Pressable style={styles.notifButton}>
            <MaterialIcons name="notifications-none" size={24} color={theme.textPrimary} />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsGrid}>
          <Pressable style={[styles.statCard, styles.creditCard]}>
            <MaterialIcons name="arrow-upward" size={20} color={theme.credit} />
            <Text style={styles.statLabel}>{t.todayCredit}</Text>
            <Text style={[styles.statValue, { color: theme.credit }]}>
              {formatCurrency(stats.todayCredit)}
            </Text>
          </Pressable>
          <Pressable style={[styles.statCard, styles.collectionCard]}>
            <MaterialIcons name="arrow-downward" size={20} color={theme.payment} />
            <Text style={styles.statLabel}>{t.todayCollection}</Text>
            <Text style={[styles.statValue, { color: theme.payment }]}>
              {formatCurrency(stats.todayCollection)}
            </Text>
          </Pressable>
          <Pressable style={[styles.statCard, styles.outstandingCard]}>
            <MaterialIcons name="account-balance" size={20} color={theme.warningDark} />
            <Text style={styles.statLabel}>{t.outstanding}</Text>
            <Text style={[styles.statValue, { color: theme.warningDark }]}>
              {formatCurrency(stats.outstanding)}
            </Text>
          </Pressable>
          <Pressable style={[styles.statCard, styles.customersCard]} onPress={() => router.push('/(tabs)/customers')}>
            <MaterialIcons name="people" size={20} color={theme.primary} />
            <Text style={styles.statLabel}>{t.totalCustomers}</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {stats.totalCustomers}
            </Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <View style={styles.quickActionsRow}>
            <Pressable style={styles.quickAction} onPress={() => router.push('/add-credit')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.creditLight }]}>
                <MaterialIcons name="add-circle" size={24} color={theme.credit} />
              </View>
              <Text style={styles.quickActionLabel}>{t.addCredit}</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/add-payment')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.paymentLight }]}>
                <MaterialIcons name="payments" size={24} color={theme.payment} />
              </View>
              <Text style={styles.quickActionLabel}>{t.addPayment}</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/qr-scanner')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <MaterialIcons name="qr-code-scanner" size={24} color="#1565C0" />
              </View>
              <Text style={styles.quickActionLabel}>QR Scan</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/payment-methods')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EDE7F6' }]}>
                <MaterialIcons name="account-balance-wallet" size={24} color="#7B1FA2" />
              </View>
              <Text style={styles.quickActionLabel}>Methods</Text>
            </Pressable>
          </View>
          <View style={[styles.quickActionsRow, { marginTop: 12 }]}>
            <Pressable style={styles.quickAction} onPress={() => router.push('/add-customer')}>
              <View style={[styles.quickActionIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <MaterialIcons name="person-add" size={24} color={theme.primary} />
              </View>
              <Text style={styles.quickActionLabel}>{t.addCustomer}</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/reports')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <MaterialIcons name="assessment" size={24} color="#E65100" />
              </View>
              <Text style={styles.quickActionLabel}>{t.reports}</Text>
            </Pressable>
            <View style={styles.quickAction} />
            <View style={styles.quickAction} />
          </View>
        </View>

        {/* Top Outstanding Customers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Outstanding</Text>
            <Pressable onPress={() => router.push('/(tabs)/customers')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          {customers
            .filter(c => c.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5)
            .map(customer => (
              <Pressable
                key={customer.id}
                style={styles.customerRow}
                onPress={() => router.push(`/ledger/${customer.id}`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                </View>
                <Text style={styles.customerBalance}>{formatCurrency(customer.balance)}</Text>
              </Pressable>
            ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
          </View>
          {recentTransactions.map(txn => (
            <View key={txn.id} style={styles.transactionRow}>
              <View style={[styles.txnIcon, { backgroundColor: txn.type === 'credit' ? theme.creditLight : theme.paymentLight }]}>
                <MaterialIcons
                  name={txn.type === 'credit' ? 'arrow-upward' : 'arrow-downward'}
                  size={18}
                  color={txn.type === 'credit' ? theme.credit : theme.payment}
                />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnName}>{txn.customerName}</Text>
                <Text style={styles.txnNote}>{txn.note || (txn.type === 'credit' ? t.credit : t.debit)}</Text>
              </View>
              <View style={styles.txnAmountCol}>
                <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.credit : theme.payment }]}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
                <Text style={styles.txnDate}>{txn.date}</Text>
              </View>
            </View>
          ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 2,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.cardShadow,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    ...theme.cardShadow,
  },
  creditCard: { borderLeftWidth: 3, borderLeftColor: theme.credit },
  collectionCard: { borderLeftWidth: 3, borderLeftColor: theme.payment },
  outstandingCard: { borderLeftWidth: 3, borderLeftColor: theme.warningDark },
  customersCard: { borderLeftWidth: 3, borderLeftColor: theme.primary },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
    marginTop: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    ...theme.cardShadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  customerPhone: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  customerBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.credit,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txnName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  txnNote: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  txnAmountCol: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txnDate: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
});
