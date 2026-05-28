import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paymentMethods, transactions, updatePaymentMethod, togglePaymentMethod, formatCurrency, language } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Analytics
  const methodStats = paymentMethods.map(pm => {
    const methodTxns = transactions.filter(t => t.type === 'debit' && t.paymentMethod === pm.key);
    const totalAmount = methodTxns.reduce((sum, t) => sum + t.amount, 0);
    const count = methodTxns.length;
    return { ...pm, totalAmount, count };
  });

  const totalPayments = methodStats.reduce((sum, m) => sum + m.totalAmount, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialIcons name="account-balance-wallet" size={24} color={theme.primary} />
            <Text style={styles.summaryTitle}>Payment Overview</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(totalPayments)}</Text>
              <Text style={styles.statLabel}>Total Received</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{paymentMethods.filter(pm => pm.enabled).length}</Text>
              <Text style={styles.statLabel}>Active Methods</Text>
            </View>
          </View>
        </View>

        {/* Usage Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Breakdown</Text>
          <View style={styles.chartCard}>
            {methodStats.filter(m => m.count > 0).map(method => {
              const percentage = totalPayments > 0 ? (method.totalAmount / totalPayments) * 100 : 0;
              return (
                <View key={method.id} style={styles.chartRow}>
                  <View style={styles.chartLeft}>
                    <View style={[styles.chartDot, { backgroundColor: method.color }]} />
                    <Text style={styles.chartLabel}>{method.label}</Text>
                  </View>
                  <View style={styles.chartBarContainer}>
                    <View style={[styles.chartBar, { width: `${Math.max(percentage, 2)}%`, backgroundColor: method.color }]} />
                  </View>
                  <Text style={styles.chartPercent}>{percentage.toFixed(0)}%</Text>
                </View>
              );
            })}
            {methodStats.filter(m => m.count > 0).length === 0 && (
              <Text style={styles.noDataText}>No payment data yet</Text>
            )}
          </View>
        </View>

        {/* Payment Methods List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Methods</Text>
          {paymentMethods.map(method => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodHeader}>
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, { backgroundColor: method.bgColor }]}>
                    <MaterialIcons name={method.icon as any} size={22} color={method.color} />
                  </View>
                  <View>
                    <Text style={styles.methodName}>
                      {language === 'ur' ? method.labelUr : method.label}
                    </Text>
                    {method.accountId ? (
                      <Text style={styles.methodAccount}>{method.accountId}</Text>
                    ) : null}
                  </View>
                </View>
                <Switch
                  value={method.enabled}
                  onValueChange={() => {
                    togglePaymentMethod(method.id);
                    Haptics.selectionAsync();
                  }}
                  trackColor={{ false: theme.border, true: theme.primaryLight }}
                  thumbColor={method.enabled ? theme.primary : '#f4f3f4'}
                />
              </View>

              {/* Stats for this method */}
              <View style={styles.methodStats}>
                <View style={styles.methodStatItem}>
                  <Text style={styles.methodStatValue}>
                    {methodStats.find(m => m.id === method.id)?.count || 0}
                  </Text>
                  <Text style={styles.methodStatLabel}>Transactions</Text>
                </View>
                <View style={styles.methodStatItem}>
                  <Text style={[styles.methodStatValue, { color: method.color }]}>
                    {formatCurrency(methodStats.find(m => m.id === method.id)?.totalAmount || 0)}
                  </Text>
                  <Text style={styles.methodStatLabel}>Total</Text>
                </View>
              </View>

              {/* Edit Account ID */}
              {method.accountLabel ? (
                <View style={styles.accountSection}>
                  {editingId === method.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.accountInput}
                        placeholder={method.accountLabel}
                        placeholderTextColor={theme.textMuted}
                        value={method.accountId}
                        onChangeText={(text) => updatePaymentMethod(method.id, { accountId: text })}
                        keyboardType={method.key === 'card' ? 'numeric' : 'default'}
                      />
                      <Pressable
                        style={styles.saveAccountBtn}
                        onPress={() => {
                          setEditingId(null);
                          Haptics.selectionAsync();
                        }}
                      >
                        <MaterialIcons name="check" size={18} color="#FFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.editAccountBtn}
                      onPress={() => setEditingId(method.id)}
                    >
                      <MaterialIcons name="edit" size={14} color={theme.primary} />
                      <Text style={styles.editAccountText}>
                        {method.accountId || `Add ${method.accountLabel}`}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color={theme.primary} />
          <Text style={styles.infoText}>
            Enabled payment methods will appear in the payment form when receiving payments from customers.
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  backBtn: {
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
  summaryCard: {
    margin: 16,
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    ...theme.cardShadow,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textDark,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.border,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    ...theme.cardShadow,
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textDark,
  },
  chartBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: theme.borderLight,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    width: 36,
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  methodCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    ...theme.cardShadow,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textDark,
  },
  methodAccount: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  methodStats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    gap: 16,
  },
  methodStatItem: {
    flex: 1,
  },
  methodStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textDark,
  },
  methodStatLabel: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  accountSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  accountInput: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textDark,
    borderWidth: 1,
    borderColor: theme.border,
  },
  saveAccountBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editAccountText: {
    fontSize: 13,
    color: theme.primary,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});
