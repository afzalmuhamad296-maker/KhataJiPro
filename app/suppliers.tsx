import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  items: string;
  lastOrder: string;
  totalPurchases: number;
}

export default function SuppliersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { formatCurrency } = useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: '1', name: 'Haji Flour Mills', phone: '03001111111', items: 'Atta, Maida, Suji', lastOrder: '2026-05-25', totalPurchases: 450000 },
    { id: '2', name: 'Punjab Sugar Traders', phone: '03002222222', items: 'Cheeni, Gur', lastOrder: '2026-05-20', totalPurchases: 280000 },
    { id: '3', name: 'Basmati Rice House', phone: '03003333333', items: 'Rice varieties', lastOrder: '2026-05-22', totalPurchases: 520000 },
    { id: '4', name: 'Dalda Oil Depot', phone: '03004444444', items: 'Ghee, Cooking Oil', lastOrder: '2026-05-28', totalPurchases: 380000 },
    { id: '5', name: 'Tapal Tea Agency', phone: '03005555555', items: 'Tea, Coffee', lastOrder: '2026-05-15', totalPurchases: 150000 },
    { id: '6', name: 'Daal Mandi Wholesale', phone: '03006666666', items: 'All Pulses', lastOrder: '2026-05-18', totalPurchases: 320000 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newItems, setNewItems] = useState('');

  const handleAdd = () => {
    if (!newName || !newPhone) { Alert.alert('Error', 'Name and phone required'); return; }
    setSuppliers(prev => [{
      id: Date.now().toString(), name: newName, phone: newPhone, items: newItems,
      lastOrder: new Date().toISOString().split('T')[0], totalPurchases: 0,
    }, ...prev]);
    setShowAdd(false);
    setNewName(''); setNewPhone(''); setNewItems('');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <MaterialIcons name={showAdd ? 'close' : 'add'} size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add Supplier</Text>
            <TextInput style={styles.input} placeholder="Supplier Name" placeholderTextColor={theme.textMuted} value={newName} onChangeText={setNewName} />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={theme.textMuted} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Items they supply" placeholderTextColor={theme.textMuted} value={newItems} onChangeText={setNewItems} />
            <Pressable style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Add Supplier</Text>
            </Pressable>
          </View>
        )}

        {suppliers.map(supplier => (
          <View key={supplier.id} style={styles.supplierCard}>
            <View style={styles.supplierTop}>
              <View style={styles.supplierAvatar}>
                <MaterialIcons name="business" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                <Text style={styles.supplierItems}>{supplier.items}</Text>
              </View>
            </View>
            <View style={styles.supplierBottom}>
              <View style={styles.supplierStat}>
                <Text style={styles.supplierStatLabel}>Last Order</Text>
                <Text style={styles.supplierStatValue}>{supplier.lastOrder}</Text>
              </View>
              <View style={styles.supplierStat}>
                <Text style={styles.supplierStatLabel}>Total</Text>
                <Text style={[styles.supplierStatValue, { color: theme.primary }]}>{formatCurrency(supplier.totalPurchases)}</Text>
              </View>
            </View>
            <View style={styles.supplierActions}>
              <Pressable style={[styles.supplierActionBtn, { backgroundColor: theme.backgroundSecondary }]}>
                <MaterialIcons name="phone" size={18} color={theme.primary} />
                <Text style={styles.supplierActionText}>Call</Text>
              </Pressable>
              <Pressable style={[styles.supplierActionBtn, { backgroundColor: '#E3F2FD' }]}>
                <MaterialIcons name="shopping-cart" size={18} color="#1565C0" />
                <Text style={[styles.supplierActionText, { color: '#1565C0' }]}>Order</Text>
              </Pressable>
              <Pressable style={[styles.supplierActionBtn, { backgroundColor: '#E8F5E9' }]}>
                <MaterialIcons name="chat" size={18} color="#25D366" />
                <Text style={[styles.supplierActionText, { color: '#25D366' }]}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  addCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16, ...theme.cardShadow },
  addTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark, marginBottom: 12 },
  input: { backgroundColor: theme.background, borderRadius: theme.borderRadius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textDark, borderWidth: 1, borderColor: theme.border, marginBottom: 10 },
  saveBtn: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  supplierCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12, ...theme.cardShadow },
  supplierTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  supplierName: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  supplierItems: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  supplierBottom: { flexDirection: 'row', gap: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.borderLight },
  supplierStat: {},
  supplierStatLabel: { fontSize: 11, color: theme.textMuted },
  supplierStatValue: { fontSize: 14, fontWeight: '600', color: theme.textDark, marginTop: 2 },
  supplierActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  supplierActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: theme.borderRadius.sm },
  supplierActionText: { fontSize: 12, fontWeight: '600', color: theme.primary },
});
