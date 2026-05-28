import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { APP_CONFIG } from '../constants/config';
import * as Haptics from 'expo-haptics';

export default function AddPaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addTransaction, formatCurrency, t } = useApp();

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const customer = customers.find(c => c.id === selectedCustomer);

  const customersWithBalance = customers.filter(c => c.balance > 0);
  const filteredCustomers = customersWithBalance.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const handleQuickAmount = (amt: number) => {
    setAmount(amt.toString());
    Haptics.selectionAsync();
  };

  const handleSave = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    addTransaction({
      customerId: selectedCustomer,
      customerName: customer?.name || '',
      type: 'debit',
      amount: Number(amount),
      note: note || 'Payment received',
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const paymentMethods = [
    { key: 'cash', label: t.cash, icon: 'payments' as const },
    { key: 'easypaisa', label: t.easypaisa, icon: 'phone-android' as const },
    { key: 'jazzcash', label: t.jazzcash, icon: 'phone-iphone' as const },
    { key: 'bank', label: t.bank, icon: 'account-balance' as const },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.addPayment}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Selector */}
          <Text style={styles.label}>{t.selectCustomer}</Text>
          <Pressable
            style={styles.customerSelector}
            onPress={() => setShowCustomerList(!showCustomerList)}
          >
            {customer ? (
              <View style={styles.selectedCustomer}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>
                    {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerOutstanding}>Outstanding: {formatCurrency(customer.balance)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.placeholderText}>{t.selectCustomer}</Text>
            )}
            <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.textMuted} />
          </Pressable>

          {showCustomerList && (
            <View style={styles.customerDropdown}>
              <TextInput
                style={styles.dropdownSearch}
                placeholder="Search..."
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholderTextColor={theme.textMuted}
              />
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {filteredCustomers.map(c => (
                  <Pressable
                    key={c.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedCustomer(c.id);
                      setShowCustomerList(false);
                      setCustomerSearch('');
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={styles.dropdownName}>{c.name}</Text>
                    <Text style={styles.dropdownBalance}>{formatCurrency(c.balance)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Amount */}
          <Text style={styles.label}>{t.amount}</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencyPrefix}>Rs.</Text>
            <TextInput
              style={styles.amountField}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmountsRow}>
            {APP_CONFIG.quickAmounts.map(amt => (
              <Pressable
                key={amt}
                style={[styles.quickAmountChip, amount === amt.toString() && styles.quickAmountActive]}
                onPress={() => handleQuickAmount(amt)}
              >
                <Text style={[styles.quickAmountText, amount === amt.toString() && styles.quickAmountTextActive]}>
                  {amt.toLocaleString()}
                </Text>
              </Pressable>
            ))}
          </View>

          {customer && (
            <Pressable
              style={styles.fullAmountBtn}
              onPress={() => handleQuickAmount(customer.balance)}
            >
              <Text style={styles.fullAmountText}>Full Amount: {formatCurrency(customer.balance)}</Text>
            </Pressable>
          )}

          {/* Payment Method */}
          <Text style={styles.label}>{t.paymentMethod}</Text>
          <View style={styles.paymentGrid}>
            {paymentMethods.map(method => (
              <Pressable
                key={method.key}
                style={[styles.paymentCard, paymentMethod === method.key && styles.paymentCardActive]}
                onPress={() => {
                  setPaymentMethod(method.key);
                  Haptics.selectionAsync();
                }}
              >
                <MaterialIcons
                  name={method.icon}
                  size={22}
                  color={paymentMethod === method.key ? theme.payment : theme.textMuted}
                />
                <Text style={[styles.paymentLabel, paymentMethod === method.key && styles.paymentLabelActive]}>
                  {method.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Note */}
          <Text style={styles.label}>{t.note}</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Monthly payment"
            value={note}
            onChangeText={setNote}
            placeholderTextColor={theme.textMuted}
          />
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t.save} - {formatCurrency(Number(amount) || 0)}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.payment,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
  },
  customerOutstanding: {
    fontSize: 12,
    color: theme.payment,
    fontWeight: '600',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 15,
    color: theme.textMuted,
  },
  customerDropdown: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  dropdownSearch: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
    fontSize: 14,
    color: theme.textDark,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textDark,
  },
  dropdownBalance: {
    fontSize: 13,
    color: theme.credit,
    fontWeight: '600',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
    height: 56,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textSecondary,
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: theme.textDark,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickAmountActive: {
    backgroundColor: theme.payment,
    borderColor: theme.payment,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  quickAmountTextActive: {
    color: '#FFF',
  },
  fullAmountBtn: {
    marginTop: 12,
    backgroundColor: theme.paymentLight,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.payment,
  },
  fullAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.payment,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentCard: {
    width: '47%',
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  paymentCardActive: {
    borderColor: theme.payment,
    backgroundColor: theme.paymentLight,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginTop: 6,
  },
  paymentLabelActive: {
    color: theme.payment,
  },
  noteInput: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 15,
    color: theme.textDark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  saveButton: {
    backgroundColor: theme.payment,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
