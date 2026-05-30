import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, t, formatCurrency } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'recent'>('recent');

  const filteredCustomers = customers
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'balance') return b.balance - a.balance;
      return new Date(b.lastTransaction || b.createdAt).getTime() - new Date(a.lastTransaction || a.createdAt).getTime();
    });

  const totalOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);

  const getAvatarColor = (index: number) => {
    const colors = ['#E8F5ED', '#FEF3C7', '#DBEAFE', '#F3E8FF', '#FCE7F3', '#FEE2E2'];
    const textColors = ['#0D7C4A', '#D97706', '#2563EB', '#7C3AED', '#BE185D', '#DC2626'];
    return { bg: colors[index % colors.length], text: textColors[index % textColors.length] };
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.customers}</Text>
          <Text style={styles.subtitle}>{customers.length} total</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]} onPress={() => router.push('/add-customer')}>
          <MaterialIcons name="person-add" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Outstanding Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: theme.credit }]} />
          <View>
            <Text style={styles.summaryLabel}>{t.outstanding}</Text>
            <Text style={[styles.summaryValue, { color: theme.credit }]}>{formatCurrency(totalOutstanding)}</Text>
          </View>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryDot, { backgroundColor: theme.primary }]} />
          <View>
            <Text style={styles.summaryLabel}>{t.totalCustomers}</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{customers.length}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.search}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Sort Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {(['recent', 'balance', 'name'] as const).map(sort => (
          <Pressable
            key={sort}
            style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
            onPress={() => setSortBy(sort)}
          >
            <MaterialIcons
              name={sort === 'recent' ? 'schedule' : sort === 'balance' ? 'account-balance-wallet' : 'sort-by-alpha'}
              size={14}
              color={sortBy === sort ? '#FFF' : theme.textMuted}
            />
            <Text style={[styles.sortChipText, sortBy === sort && styles.sortChipTextActive]}>
              {sort === 'recent' ? 'Recent' : sort === 'balance' ? 'Balance' : 'A-Z'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Customer List */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <FlashList
          data={filteredCustomers}
          keyExtractor={item => item.id}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: 4 }}
          renderItem={({ item, index }) => {
            const colors = getAvatarColor(index);
            return (
              <Pressable
                style={({ pressed }) => [styles.customerCard, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                onPress={() => router.push(`/ledger/${item.id}`)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>
                    {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                </View>
                <View style={styles.balanceCol}>
                  <Text style={[styles.balanceAmount, { color: item.balance > 0 ? theme.credit : theme.payment }]}>
                    {formatCurrency(item.balance)}
                  </Text>
                  {item.balance > 0 ? (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>Due</Text>
                    </View>
                  ) : (
                    <View style={[styles.dueBadge, { backgroundColor: theme.paymentLight }]}>
                      <Text style={[styles.dueBadgeText, { color: theme.payment }]}>Clear</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="people-outline" size={48} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyText}>{t.noCustomers}</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/add-customer')}>
                <Text style={styles.emptyButtonText}>{t.addCustomer}</Text>
              </Pressable>
            </View>
          )}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.cardShadow,
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.borderLight,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: theme.textDark,
  },
  sortRow: {
    marginTop: 14,
    maxHeight: 42,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  sortChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  sortChipTextActive: {
    color: '#FFF',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 3,
  },
  balanceCol: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  dueBadge: {
    backgroundColor: theme.creditLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  dueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.credit,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    fontWeight: '500',
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
