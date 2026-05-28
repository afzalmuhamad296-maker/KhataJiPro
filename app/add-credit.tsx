import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

export default function AddCreditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, itemRates, addTransaction, formatCurrency, t } = useApp();

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; quantity: number; rate: number; total: number }[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showRateBook, setShowRateBook] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const customer = customers.find(c => c.id === selectedCustomer);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const handleAddItem = (item: typeof itemRates[0]) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.rate } : i
      ));
    } else {
      setSelectedItems(prev => [...prev, { id: item.id, name: item.name, quantity: 1, rate: item.rate, total: item.rate }]);
    }
    setShowRateBook(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== itemId));
  };

  const totalFromItems = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = selectedItems.length > 0 ? totalFromItems : Number(amount) || 0;

  const handleSave = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (finalAmount <= 0) {
      Alert.alert('Error', 'Please enter an amount or add items');
      return;
    }

    addTransaction({
      customerId: selectedCustomer,
      customerName: customer?.name || '',
      type: 'credit',
      amount: finalAmount,
      note: note || selectedItems.map(i => i.name).join(', '),
      items: selectedItems.length > 0 ? selectedItems : undefined,
      date: new Date().toISOString().split('T')[0],
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

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
          <Text style={styles.headerTitle}>{t.addCredit}</Text>
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
                  <Text style={styles.customerBalance}>Balance: {formatCurrency(customer.balance)}</Text>
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

          {/* Items Section */}
          <View style={styles.sectionRow}>
            <Text style={styles.label}>{t.addItems}</Text>
            <Pressable style={styles.addItemBtn} onPress={() => setShowRateBook(!showRateBook)}>
              <MaterialIcons name="add" size={18} color={theme.primary} />
              <Text style={styles.addItemText}>Rate Book</Text>
            </Pressable>
          </View>

          {showRateBook && (
            <View style={styles.rateBookDropdown}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {itemRates.map(item => (
                  <Pressable
                    key={item.id}
                    style={styles.rateItem}
                    onPress={() => handleAddItem(item)}
                  >
                    <View>
                      <Text style={styles.rateItemName}>{item.name}</Text>
                      <Text style={styles.rateItemUnit}>{item.category} · {item.unit}</Text>
                    </View>
                    <Text style={styles.rateItemPrice}>{formatCurrency(item.rate)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <View style={styles.itemsContainer}>
              {selectedItems.map(item => (
                <View key={item.id} style={styles.itemChip}>
                  <View style={styles.itemChipInfo}>
                    <Text style={styles.itemChipName}>{item.name}</Text>
                    <Text style={styles.itemChipDetails}>
                      {item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.total)}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRemoveItem(item.id)}>
                    <MaterialIcons name="close" size={18} color={theme.credit} />
                  </Pressable>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.total}</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalFromItems)}</Text>
              </View>
            </View>
          )}

          {/* Manual Amount */}
          {selectedItems.length === 0 && (
            <>
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
            </>
          )}

          {/* Note */}
          <Text style={styles.label}>{t.note}</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Atta 2 bags + Cheeni"
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor={theme.textMuted}
          />
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t.save} - {formatCurrency(finalAmount)}</Text>
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
    color: theme.credit,
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
  customerBalance: {
    fontSize: 12,
    color: theme.credit,
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
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  rateBookDropdown: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  rateItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textDark,
  },
  rateItemUnit: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  rateItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  itemsContainer: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 8,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  itemChipInfo: {},
  itemChipName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textDark,
  },
  itemChipDetails: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.credit,
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
    backgroundColor: theme.credit,
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
