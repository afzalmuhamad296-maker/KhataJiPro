import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minLevel: number;
  unit: string;
  rate: number;
  category: string;
}

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itemRates, formatCurrency } = useApp();
  const [stock, setStock] = useState<StockItem[]>(
    itemRates.map(item => ({
      id: item.id,
      name: item.name,
      currentStock: Math.floor(Math.random() * 50) + 5,
      minLevel: 10,
      unit: item.unit,
      rate: item.rate,
      category: item.category,
    }))
  );
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');

  const lowStockItems = stock.filter(s => s.currentStock <= s.minLevel);
  const filteredStock = stock
    .filter(s => filter === 'all' || (filter === 'low' ? s.currentStock <= s.minLevel : s.currentStock > s.minLevel))
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const updateStock = (id: string, qty: number) => {
    setStock(prev => prev.map(s => s.id === id ? { ...s, currentStock: Math.max(0, qty) } : s));
    setEditingId(null);
    setEditQty('');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Stock Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Alert Banner */}
      {lowStockItems.length > 0 && (
        <View style={styles.alertBanner}>
          <MaterialIcons name="warning" size={20} color="#FFF" />
          <Text style={styles.alertText}>{lowStockItems.length} items are low on stock!</Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={theme.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search items..." placeholderTextColor={theme.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'low', 'ok'] as const).map(f => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? `All (${stock.length})` : f === 'low' ? `Low (${lowStockItems.length})` : `OK (${stock.length - lowStockItems.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {filteredStock.map(item => {
          const isLow = item.currentStock <= item.minLevel;
          return (
            <View key={item.id} style={[styles.stockCard, isLow && styles.stockCardLow]}>
              <View style={styles.stockTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stockName}>{item.name}</Text>
                  <Text style={styles.stockCategory}>{item.category} • Rs. {item.rate}/{item.unit}</Text>
                </View>
                {isLow && (
                  <View style={styles.lowBadge}>
                    <MaterialIcons name="warning" size={12} color={theme.credit} />
                    <Text style={styles.lowBadgeText}>LOW</Text>
                  </View>
                )}
              </View>
              <View style={styles.stockBottom}>
                <View style={styles.stockMeter}>
                  <View style={styles.meterBg}>
                    <View style={[styles.meterFill, {
                      width: `${Math.min(100, (item.currentStock / Math.max(item.minLevel * 3, 1)) * 100)}%`,
                      backgroundColor: isLow ? theme.credit : theme.payment,
                    }]} />
                  </View>
                  <Text style={styles.stockQty}>{item.currentStock} {item.unit}s</Text>
                </View>
                <View style={styles.stockActions}>
                  <Pressable style={styles.stockActBtn} onPress={() => updateStock(item.id, item.currentStock - 1)}>
                    <MaterialIcons name="remove" size={16} color={theme.credit} />
                  </Pressable>
                  <Pressable style={styles.stockActBtn} onPress={() => updateStock(item.id, item.currentStock + 1)}>
                    <MaterialIcons name="add" size={16} color={theme.payment} />
                  </Pressable>
                  <Pressable style={styles.stockActBtn} onPress={() => { setEditingId(item.id); setEditQty(item.currentStock.toString()); }}>
                    <MaterialIcons name="edit" size={16} color={theme.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editingId !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Stock</Text>
            <Text style={styles.modalSubtitle}>{stock.find(s => s.id === editingId)?.name}</Text>
            <TextInput style={styles.modalInput} value={editQty} onChangeText={setEditQty} keyboardType="numeric" placeholder="Quantity" placeholderTextColor={theme.textMuted} autoFocus />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditingId(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={() => editingId && updateStock(editingId, parseInt(editQty) || 0)}>
                <Text style={styles.modalSaveText}>Update</Text>
              </Pressable>
            </View>
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
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.credit, padding: 12, marginHorizontal: 16, marginTop: 12, borderRadius: theme.borderRadius.sm },
  alertText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  searchRow: { paddingHorizontal: 16, marginTop: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: theme.textDark },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: '#FFF' },
  stockCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 10, ...theme.cardShadow },
  stockCardLow: { borderLeftWidth: 3, borderLeftColor: theme.credit },
  stockTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stockName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  stockCategory: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  lowBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.creditLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  lowBadgeText: { fontSize: 10, fontWeight: '700', color: theme.credit },
  stockBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  stockMeter: { flex: 1 },
  meterBg: { height: 6, backgroundColor: theme.borderLight, borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },
  stockQty: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginTop: 4 },
  stockActions: { flexDirection: 'row', gap: 6 },
  stockActBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.lg, padding: 24, width: '100%', maxWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: theme.textMuted, textAlign: 'center', marginTop: 4 },
  modalInput: { backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: theme.textDark, borderWidth: 1, borderColor: theme.border, marginTop: 16, textAlign: 'center', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadius.sm, backgroundColor: theme.background, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  modalSave: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadius.sm, backgroundColor: theme.primary, alignItems: 'center' },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
