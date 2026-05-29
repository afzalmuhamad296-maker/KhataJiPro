import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

interface RecurringItem {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  items: string;
  nextDate: string;
  active: boolean;
  createdAt: string;
}

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, formatCurrency, addTransaction } = useApp();
  const [recurring, setRecurring] = useState<RecurringItem[]>([
    { id: '1', customerId: '1', customerName: 'Ahmed Khan', amount: 5200, frequency: 'weekly', items: 'Atta 2 bags, Cheeni 4kg', nextDate: '2026-06-05', active: true, createdAt: '2026-05-01' },
    { id: '2', customerId: '6', customerName: 'Farhan Malik', amount: 15000, frequency: 'monthly', items: 'Monthly ration', nextDate: '2026-06-15', active: true, createdAt: '2026-04-15' },
    { id: '3', customerId: '8', customerName: 'Hamza Tariq', amount: 3500, frequency: 'weekly', items: 'Grocery items', nextDate: '2026-06-02', active: true, createdAt: '2026-05-10' },
    { id: '4', customerId: '11', customerName: 'Kashif Nawaz', amount: 8700, frequency: 'monthly', items: 'Wholesale order', nextDate: '2026-06-20', active: false, createdAt: '2026-03-20' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newItems, setNewItems] = useState('');
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [newCustomerId, setNewCustomerId] = useState('');

  const getFreqColor = (freq: string) => {
    switch (freq) {
      case 'daily': return '#E53935';
      case 'weekly': return '#1565C0';
      case 'monthly': return '#6A1B9A';
      default: return theme.textMuted;
    }
  };

  const handleExecute = (item: RecurringItem) => {
    addTransaction({
      customerId: item.customerId,
      customerName: item.customerName,
      type: 'credit',
      amount: item.amount,
      note: `Recurring: ${item.items}`,
      date: new Date().toISOString().split('T')[0],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Executed', `Rs. ${item.amount} credit added for ${item.customerName}`);
  };

  const handleToggle = (id: string) => {
    setRecurring(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    Haptics.selectionAsync();
  };

  const handleAdd = () => {
    if (!newCustomerId || !newAmount) {
      Alert.alert('Error', 'Please fill customer and amount');
      return;
    }
    const customer = customers.find(c => c.id === newCustomerId);
    if (!customer) return;

    const nextDate = new Date();
    if (newFreq === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (newFreq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else nextDate.setMonth(nextDate.getMonth() + 1);

    const newItem: RecurringItem = {
      id: Date.now().toString(),
      customerId: customer.id,
      customerName: customer.name,
      amount: parseInt(newAmount),
      frequency: newFreq,
      items: newItems || 'Recurring items',
      nextDate: nextDate.toISOString().split('T')[0],
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRecurring(prev => [newItem, ...prev]);
    setShowAdd(false);
    setNewAmount('');
    setNewItems('');
    setNewCustomerId('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Recurring Transactions</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <MaterialIcons name="repeat" size={20} color={theme.primary} />
          <Text style={styles.summaryValue}>{recurring.filter(r => r.active).length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialIcons name="attach-money" size={20} color={theme.credit} />
          <Text style={[styles.summaryValue, { color: theme.credit }]}>
            {formatCurrency(recurring.filter(r => r.active).reduce((s, r) => s + r.amount, 0))}
          </Text>
          <Text style={styles.summaryLabel}>Monthly Total</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {recurring.map(item => (
          <View key={item.id} style={[styles.recurCard, !item.active && styles.recurCardInactive]}>
            <View style={styles.recurTop}>
              <View style={styles.recurLeft}>
                <View style={[styles.freqBadge, { backgroundColor: getFreqColor(item.frequency) + '20' }]}>
                  <Text style={[styles.freqText, { color: getFreqColor(item.frequency) }]}>{item.frequency}</Text>
                </View>
                <View>
                  <Text style={styles.recurName}>{item.customerName}</Text>
                  <Text style={styles.recurItems}>{item.items}</Text>
                </View>
              </View>
              <Text style={[styles.recurAmount, { color: theme.credit }]}>{formatCurrency(item.amount)}</Text>
            </View>
            <View style={styles.recurBottom}>
              <View style={styles.recurDateRow}>
                <MaterialIcons name="event" size={14} color={theme.textMuted} />
                <Text style={styles.recurDate}>Next: {item.nextDate}</Text>
              </View>
              <View style={styles.recurActions}>
                <Pressable style={styles.recurActionBtn} onPress={() => handleToggle(item.id)}>
                  <MaterialIcons name={item.active ? 'pause' : 'play-arrow'} size={18} color={item.active ? '#FF9800' : theme.payment} />
                </Pressable>
                <Pressable style={[styles.recurActionBtn, { backgroundColor: theme.primaryLight + '20' }]} onPress={() => handleExecute(item)}>
                  <MaterialIcons name="check" size={18} color={theme.primary} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Recurring</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <MaterialIcons name="close" size={24} color={theme.textDark} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Customer</Text>
              <ScrollView style={styles.customerList} nestedScrollEnabled>
                {customers.slice(0, 10).map(c => (
                  <Pressable
                    key={c.id}
                    style={[styles.customerOption, newCustomerId === c.id && styles.customerOptionActive]}
                    onPress={() => setNewCustomerId(c.id)}
                  >
                    <Text style={styles.customerOptionText}>{c.name}</Text>
                    {newCustomerId === c.id && <MaterialIcons name="check" size={18} color={theme.primary} />}
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Amount (Rs.)</Text>
              <TextInput style={styles.modalInput} value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" placeholder="5000" placeholderTextColor={theme.textMuted} />

              <Text style={styles.modalLabel}>Items/Note</Text>
              <TextInput style={styles.modalInput} value={newItems} onChangeText={setNewItems} placeholder="Atta, Cheeni, etc." placeholderTextColor={theme.textMuted} />

              <Text style={styles.modalLabel}>Frequency</Text>
              <View style={styles.freqRow}>
                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                  <Pressable key={f} style={[styles.freqOption, newFreq === f && styles.freqOptionActive]} onPress={() => setNewFreq(f)}>
                    <Text style={[styles.freqOptionText, newFreq === f && { color: '#FFF' }]}>{f}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.modalSaveBtn} onPress={handleAdd}>
                <Text style={styles.modalSaveText}>Add Recurring</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 14, alignItems: 'center', ...theme.cardShadow },
  summaryValue: { fontSize: 16, fontWeight: '700', color: theme.textDark, marginTop: 4 },
  summaryLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  recurCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 10, ...theme.cardShadow },
  recurCardInactive: { opacity: 0.5 },
  recurTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  recurLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  freqBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  freqText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  recurName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  recurItems: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  recurAmount: { fontSize: 16, fontWeight: '700' },
  recurBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  recurDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recurDate: { fontSize: 12, color: theme.textMuted },
  recurActions: { flexDirection: 'row', gap: 8 },
  recurActionBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark },
  modalLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 16, marginBottom: 8 },
  modalInput: { backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textDark, borderWidth: 1, borderColor: theme.border },
  customerList: { maxHeight: 150, borderWidth: 1, borderColor: theme.border, borderRadius: theme.borderRadius.sm },
  customerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  customerOptionActive: { backgroundColor: theme.backgroundSecondary },
  customerOptionText: { fontSize: 14, color: theme.textDark },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqOption: { flex: 1, paddingVertical: 10, borderRadius: theme.borderRadius.sm, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  freqOptionActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  freqOptionText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, textTransform: 'capitalize' },
  modalSaveBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  modalSaveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
