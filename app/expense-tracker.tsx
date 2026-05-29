import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string;
  type: 'income' | 'expense';
}

const CATEGORIES = [
  { key: 'rent', label: 'Rent', icon: 'home', color: '#E53935' },
  { key: 'electricity', label: 'Electricity', icon: 'flash-on', color: '#FF9800' },
  { key: 'supplies', label: 'Supplies', icon: 'inventory', color: '#2196F3' },
  { key: 'staff', label: 'Staff Salary', icon: 'people', color: '#9C27B0' },
  { key: 'transport', label: 'Transport', icon: 'local-shipping', color: '#00BCD4' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build', color: '#795548' },
  { key: 'food', label: 'Food/Tea', icon: 'restaurant', color: '#4CAF50' },
  { key: 'other', label: 'Other', icon: 'more-horiz', color: '#607D8B' },
];

export default function ExpenseTrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { formatCurrency, getTodayStats } = useApp();
  const stats = getTodayStats();

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', category: 'electricity', amount: 8500, note: 'Monthly bill', date: '2026-05-29', type: 'expense' },
    { id: '2', category: 'staff', amount: 25000, note: 'Helper salary', date: '2026-05-28', type: 'expense' },
    { id: '3', category: 'supplies', amount: 12000, note: 'Packaging materials', date: '2026-05-27', type: 'expense' },
    { id: '4', category: 'food', amount: 800, note: 'Chai + snacks', date: '2026-05-29', type: 'expense' },
    { id: '5', category: 'transport', amount: 2500, note: 'Delivery van fuel', date: '2026-05-28', type: 'expense' },
    { id: '6', category: 'rent', amount: 35000, note: 'Monthly shop rent', date: '2026-05-25', type: 'expense' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('other');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalIncome = stats.todayCollection + expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const filteredExpenses = expenses.filter(e => filter === 'all' || e.type === filter);

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.key && e.type === 'expense').reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const handleAdd = () => {
    if (!newAmount) { Alert.alert('Error', 'Enter amount'); return; }
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: newCategory,
      amount: parseInt(newAmount),
      note: newNote || CATEGORIES.find(c => c.key === newCategory)?.label || '',
      date: new Date().toISOString().split('T')[0],
      type: newType,
    };
    setExpenses(prev => [newExpense, ...prev]);
    setShowAdd(false);
    setNewAmount('');
    setNewNote('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Expense Tracker</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Daily Summary */}
        <View style={styles.dailySummary}>
          <View style={styles.dailyRow}>
            <View style={[styles.dailyCard, { borderLeftColor: theme.payment }]}>
              <Text style={styles.dailyLabel}>Income</Text>
              <Text style={[styles.dailyValue, { color: theme.payment }]}>{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={[styles.dailyCard, { borderLeftColor: theme.credit }]}>
              <Text style={styles.dailyLabel}>Expenses</Text>
              <Text style={[styles.dailyValue, { color: theme.credit }]}>{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>
          <View style={[styles.profitCard, { backgroundColor: netProfit >= 0 ? theme.paymentLight : theme.creditLight }]}>
            <MaterialIcons name={netProfit >= 0 ? 'trending-up' : 'trending-down'} size={24} color={netProfit >= 0 ? theme.payment : theme.credit} />
            <View>
              <Text style={styles.profitLabel}>{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</Text>
              <Text style={[styles.profitValue, { color: netProfit >= 0 ? theme.payment : theme.credit }]}>
                {formatCurrency(Math.abs(netProfit))}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.categoryGrid}>
            {categoryTotals.map(cat => (
              <View key={cat.key} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <MaterialIcons name={cat.icon as any} size={18} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.label}</Text>
                <Text style={styles.categoryAmount}>{formatCurrency(cat.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </Pressable>
          ))}
        </View>

        {/* Transactions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {filteredExpenses.map(expense => {
            const cat = CATEGORIES.find(c => c.key === expense.category);
            return (
              <View key={expense.id} style={styles.expenseRow}>
                <View style={[styles.expenseIcon, { backgroundColor: (cat?.color || theme.textMuted) + '20' }]}>
                  <MaterialIcons name={(cat?.icon || 'receipt') as any} size={20} color={cat?.color || theme.textMuted} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseName}>{expense.note}</Text>
                  <Text style={styles.expenseCategory}>{cat?.label} • {expense.date}</Text>
                </View>
                <Text style={[styles.expenseAmount, { color: expense.type === 'expense' ? theme.credit : theme.payment }]}>
                  {expense.type === 'expense' ? '-' : '+'}{formatCurrency(expense.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Entry</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <MaterialIcons name="close" size={24} color={theme.textDark} />
              </Pressable>
            </View>

            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <Pressable style={[styles.typeBtn, newType === 'expense' && styles.typeBtnActiveExpense]} onPress={() => setNewType('expense')}>
                <Text style={[styles.typeBtnText, newType === 'expense' && { color: '#FFF' }]}>Expense</Text>
              </Pressable>
              <Pressable style={[styles.typeBtn, newType === 'income' && styles.typeBtnActiveIncome]} onPress={() => setNewType('income')}>
                <Text style={[styles.typeBtnText, newType === 'income' && { color: '#FFF' }]}>Income</Text>
              </Pressable>
            </View>

            {/* Amount */}
            <Text style={styles.modalLabel}>Amount (Rs.)</Text>
            <TextInput style={styles.modalInput} value={newAmount} onChangeText={setNewAmount} keyboardType="numeric" placeholder="5000" placeholderTextColor={theme.textMuted} />

            {/* Category */}
            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => (
                <Pressable key={cat.key} style={[styles.catOption, newCategory === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '10' }]} onPress={() => setNewCategory(cat.key)}>
                  <MaterialIcons name={cat.icon as any} size={18} color={cat.color} />
                  <Text style={[styles.catOptionText, { color: newCategory === cat.key ? cat.color : theme.textSecondary }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Note */}
            <Text style={styles.modalLabel}>Note</Text>
            <TextInput style={styles.modalInput} value={newNote} onChangeText={setNewNote} placeholder="Description..." placeholderTextColor={theme.textMuted} />

            <Pressable style={styles.modalSaveBtn} onPress={handleAdd}>
              <Text style={styles.modalSaveText}>Add Entry</Text>
            </Pressable>
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
  dailySummary: { padding: 16 },
  dailyRow: { flexDirection: 'row', gap: 10 },
  dailyCard: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 14, borderLeftWidth: 3, ...theme.cardShadow },
  dailyLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  dailyValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  profitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 16, borderRadius: theme.borderRadius.md },
  profitLabel: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },
  profitValue: { fontSize: 20, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: { width: '48%', backgroundColor: theme.surface, borderRadius: theme.borderRadius.sm, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, ...theme.cardShadow },
  categoryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 12, color: theme.textSecondary, flex: 1 },
  categoryAmount: { fontSize: 12, fontWeight: '700', color: theme.textDark },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: '#FFF' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 8, ...theme.cardShadow },
  expenseIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  expenseInfo: { flex: 1, marginLeft: 12 },
  expenseName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  expenseCategory: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark },
  typeToggle: { flexDirection: 'row', backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  typeBtnActiveExpense: { backgroundColor: theme.credit },
  typeBtnActiveIncome: { backgroundColor: theme.payment },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  modalLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 16, marginBottom: 8 },
  modalInput: { backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textDark, borderWidth: 1, borderColor: theme.border },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  catOptionText: { fontSize: 12, fontWeight: '600' },
  modalSaveBtn: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  modalSaveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
