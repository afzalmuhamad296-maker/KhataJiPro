import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

export default function BulkSMSScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, formatCurrency } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(0);
  const [sent, setSent] = useState(false);

  const dueCustomers = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

  const templates = [
    { title: 'Friendly Reminder', message: 'Dear {name}, you have Rs. {amount} pending. Please clear at your convenience. Thank you! - {shop}' },
    { title: 'Urgent Notice', message: 'Dear {name}, URGENT: Your outstanding of Rs. {amount} is overdue. Please pay immediately. - {shop}' },
    { title: 'Eid Greeting + Reminder', message: 'Eid Mubarak {name}! Wishing you joy. Also, kindly note Rs. {amount} is pending. - {shop}' },
    { title: 'Thank You + Balance', message: 'Dear {name}, thank you for being a valued customer. Your current balance is Rs. {amount}. - {shop}' },
  ];

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
    Haptics.selectionAsync();
  };

  const selectAll = () => {
    if (selected.size === dueCustomers.length) setSelected(new Set());
    else setSelected(new Set(dueCustomers.map(c => c.id)));
  };

  const handleSend = (method: 'sms' | 'whatsapp') => {
    if (selected.size === 0) { Alert.alert('Error', 'Select at least one customer'); return; }
    setSent(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Alert.alert('Success', `${method === 'sms' ? 'SMS' : 'WhatsApp'} sent to ${selected.size} customers`);
      setSent(false);
    }, 1000);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Bulk Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Template Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Template</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {templates.map((tmpl, i) => (
              <Pressable key={i} style={[styles.templateCard, template === i && styles.templateCardActive]} onPress={() => setTemplate(i)}>
                <Text style={[styles.templateTitle, template === i && { color: theme.primary }]}>{tmpl.title}</Text>
                <Text style={styles.templateMsg} numberOfLines={2}>{tmpl.message.replace('{name}', 'Ali').replace('{amount}', '5000').replace('{shop}', 'Store')}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Select Customers */}
        <View style={styles.section}>
          <View style={styles.selectHeader}>
            <Text style={styles.sectionTitle}>Select Customers ({selected.size}/{dueCustomers.length})</Text>
            <Pressable onPress={selectAll}>
              <Text style={styles.selectAllText}>{selected.size === dueCustomers.length ? 'Deselect All' : 'Select All'}</Text>
            </Pressable>
          </View>
          {dueCustomers.map(customer => (
            <Pressable key={customer.id} style={[styles.customerRow, selected.has(customer.id) && styles.customerRowActive]} onPress={() => toggleSelect(customer.id)}>
              <View style={[styles.checkbox, selected.has(customer.id) && styles.checkboxActive]}>
                {selected.has(customer.id) && <MaterialIcons name="check" size={14} color="#FFF" />}
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              </View>
              <Text style={styles.customerBalance}>{formatCurrency(customer.balance)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[styles.sendBtn, { backgroundColor: '#1565C0' }]} onPress={() => handleSend('sms')}>
          <MaterialIcons name="sms" size={20} color="#FFF" />
          <Text style={styles.sendBtnText}>Send SMS ({selected.size})</Text>
        </Pressable>
        <Pressable style={[styles.sendBtn, { backgroundColor: '#25D366' }]} onPress={() => handleSend('whatsapp')}>
          <MaterialIcons name="chat" size={20} color="#FFF" />
          <Text style={styles.sendBtnText}>WhatsApp ({selected.size})</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 16 },
  templateCard: { width: 220, backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 14, borderWidth: 1.5, borderColor: theme.border },
  templateCardActive: { borderColor: theme.primary, backgroundColor: theme.backgroundSecondary },
  templateTitle: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  templateMsg: { fontSize: 12, color: theme.textMuted, marginTop: 6, lineHeight: 16 },
  selectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  selectAllText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  customerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  customerRowActive: { backgroundColor: theme.backgroundSecondary },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  customerPhone: { fontSize: 12, color: theme.textMuted },
  customerBalance: { fontSize: 14, fontWeight: '700', color: theme.credit },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.borderLight },
  sendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.borderRadius.md },
  sendBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
