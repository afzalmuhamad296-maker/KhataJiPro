import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
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

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.customers}</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-customer')}>
          <MaterialIcons name="person-add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Outstanding Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.outstanding}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalOutstanding)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t.totalCustomers}</Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>{customers.length}</Text>
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
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Sort Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(['recent', 'balance', 'name'] as const).map(sort => (
          <Pressable
            key={sort}
            style={[styles.sortChip, sortBy === sort && styles.sortChipActive]}
            onPress={() => setSortBy(sort)}
          >
            <Text style={[styles.sortChipText, sortBy === sort && styles.sortChipTextActive]}>
              {sort === 'recent' ? 'Recent' : sort === 'balance' ? 'Balance' : 'A-Z'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Customer List */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <FlashList
          data={filteredCustomers}
          keyExtractor={item => item.id}
          estimatedItemSize={76}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.customerCard}
              onPress={() => router.push(`/ledger/${item.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
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
                {item.balance > 0 && (
                  <View style={styles.dueBadge}>
                    <Text style={styles.dueBadgeText}>Due</Text>
                  </View>
                )}
                {item.balance === 0 && (
                  <View style={[styles.dueBadge, { backgroundColor: theme.paymentLight }]}>
                    <Text style={[styles.dueBadgeText, { color: theme.payment }]}>Clear</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={64} color={theme.border} />
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    ...theme.cardShadow,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: theme.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.credit,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: theme.textDark,
  },
  sortRow: {
    marginTop: 12,
    maxHeight: 44,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
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
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    marginTop: 10,
    ...theme.cardShadow,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    paddingVertical: 2,
    borderRadius: 10,
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
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
