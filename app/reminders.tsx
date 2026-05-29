import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

interface Reminder {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  template: '7days' | '15days' | '30days' | 'custom';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
}

const TEMPLATES = [
  { key: '7days', label: '7 Day Reminder', message: 'Dear {name}, your outstanding balance of Rs. {amount} is due. Please pay at your earliest convenience. - {shop}', days: 7 },
  { key: '15days', label: '15 Day Reminder', message: 'Dear {name}, it has been 15 days since your last payment. Outstanding: Rs. {amount}. Kindly clear your dues. - {shop}', days: 15 },
  { key: '30days', label: '30 Day Final Notice', message: 'FINAL NOTICE: Dear {name}, your account has Rs. {amount} overdue for 30+ days. Immediate payment required. - {shop}', days: 30 },
];

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, formatCurrency, settings } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', customerId: '6', customerName: 'Farhan Malik', amount: 45000, dueDate: '2026-05-22', template: '30days', status: 'sent', createdAt: '2026-05-25' },
    { id: '2', customerId: '3', customerName: 'Chaudhry Rashid', amount: 22000, dueDate: '2026-05-20', template: '15days', status: 'delivered', createdAt: '2026-05-26' },
    { id: '3', customerId: '14', customerName: 'Nadeem Butt', amount: 31000, dueDate: '2026-05-28', template: '7days', status: 'pending', createdAt: '2026-05-28' },
    { id: '4', customerId: '18', customerName: 'Rizwan Aslam', amount: 28500, dueDate: '2026-05-25', template: '15days', status: 'read', createdAt: '2026-05-27' },
  ]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'delivered' | 'read'>('all');
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('7days');

  const filteredReminders = reminders.filter(r => filter === 'all' || r.status === filter);
  const dueCustomers = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'sent': return '#2196F3';
      case 'delivered': return theme.primary;
      case 'read': return theme.payment;
      default: return theme.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'schedule';
      case 'sent': return 'check';
      case 'delivered': return 'done-all';
      case 'read': return 'visibility';
      default: return 'help';
    }
  };

  const handleSendReminder = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      customerId: customer.id,
      customerName: customer.name,
      amount: customer.balance,
      dueDate: new Date(Date.now() + (TEMPLATES.find(t => t.key === selectedTemplate)?.days || 7) * 86400000).toISOString().split('T')[0],
      template: selectedTemplate as any,
      status: 'sent',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setReminders(prev => [newReminder, ...prev]);
    setShowNewReminder(false);
    setSelectedCustomer(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Sent', `Reminder sent to ${customer.name}`);
  };

  if (showNewReminder) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowNewReminder(false)} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>New Reminder</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {/* Template Selection */}
          <Text style={styles.formLabel}>Reminder Template</Text>
          {TEMPLATES.map(tmpl => (
            <Pressable
              key={tmpl.key}
              style={[styles.templateCard, selectedTemplate === tmpl.key && styles.templateCardActive]}
              onPress={() => setSelectedTemplate(tmpl.key)}
            >
              <View style={styles.templateHeader}>
                <View style={[styles.radioCircle, selectedTemplate === tmpl.key && styles.radioCircleActive]} />
                <Text style={[styles.templateName, selectedTemplate === tmpl.key && { color: theme.primary }]}>{tmpl.label}</Text>
              </View>
              <Text style={styles.templateMsg}>{tmpl.message.replace('{name}', 'Customer').replace('{amount}', '5000').replace('{shop}', settings.shopName)}</Text>
            </Pressable>
          ))}

          {/* Customer Selection */}
          <Text style={[styles.formLabel, { marginTop: 24 }]}>Select Customer</Text>
          {dueCustomers.slice(0, 10).map(customer => (
            <Pressable
              key={customer.id}
              style={[styles.customerSelectRow, selectedCustomer === customer.id && styles.customerSelectActive]}
              onPress={() => setSelectedCustomer(customer.id)}
            >
              <View style={styles.customerSelectLeft}>
                <View style={[styles.radioCircle, selectedCustomer === customer.id && styles.radioCircleActive]} />
                <View>
                  <Text style={styles.customerSelectName}>{customer.name}</Text>
                  <Text style={styles.customerSelectPhone}>{customer.phone}</Text>
                </View>
              </View>
              <Text style={styles.customerSelectBalance}>{formatCurrency(customer.balance)}</Text>
            </Pressable>
          ))}

          {/* Send Button */}
          <Pressable style={styles.sendReminderBtn} onPress={handleSendReminder}>
            <MaterialIcons name="send" size={20} color="#FFF" />
            <Text style={styles.sendReminderText}>Send Reminder</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Reminders</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowNewReminder(true)}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{reminders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#FF9800' }]}>{reminders.filter(r => r.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#2196F3' }]}>{reminders.filter(r => r.status === 'sent').length}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: theme.payment }]}>{reminders.filter(r => r.status === 'read').length}</Text>
          <Text style={styles.statLabel}>Read</Text>
        </View>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(['all', 'pending', 'sent', 'delivered', 'read'] as const).map(f => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Reminders List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {filteredReminders.map(reminder => (
          <View key={reminder.id} style={styles.reminderCard}>
            <View style={styles.reminderTop}>
              <View style={styles.reminderLeft}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(reminder.status) }]}>
                  <MaterialIcons name={getStatusIcon(reminder.status) as any} size={14} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.reminderName}>{reminder.customerName}</Text>
                  <Text style={styles.reminderTemplate}>{TEMPLATES.find(t => t.key === reminder.template)?.label}</Text>
                </View>
              </View>
              <Text style={[styles.reminderAmount, { color: theme.credit }]}>{formatCurrency(reminder.amount)}</Text>
            </View>
            <View style={styles.reminderBottom}>
              <View style={styles.reminderDateRow}>
                <MaterialIcons name="event" size={14} color={theme.textMuted} />
                <Text style={styles.reminderDate}>Due: {reminder.dueDate}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reminder.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(reminder.status) }]}>{reminder.status}</Text>
              </View>
            </View>
          </View>
        ))}
        {filteredReminders.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-off" size={56} color={theme.border} />
            <Text style={styles.emptyText}>No reminders found</Text>
          </View>
        )}
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 12, alignItems: 'center', ...theme.cardShadow },
  statNum: { fontSize: 20, fontWeight: '700', color: theme.textDark },
  statLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  filterScroll: { marginTop: 14, maxHeight: 44 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: '#FFF' },
  reminderCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 10, ...theme.cardShadow },
  reminderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reminderName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  reminderTemplate: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  reminderAmount: { fontSize: 15, fontWeight: '700' },
  reminderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.borderLight },
  reminderDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderDate: { fontSize: 12, color: theme.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: theme.textMuted, marginTop: 12 },
  formLabel: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  templateCard: { backgroundColor: theme.surface, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: theme.border },
  templateCardActive: { borderColor: theme.primary, backgroundColor: theme.backgroundSecondary },
  templateHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border },
  radioCircleActive: { borderColor: theme.primary, backgroundColor: theme.primary },
  templateName: { fontSize: 15, fontWeight: '600', color: theme.textDark },
  templateMsg: { fontSize: 12, color: theme.textMuted, marginTop: 8, lineHeight: 18 },
  customerSelectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 6, borderWidth: 1, borderColor: theme.border },
  customerSelectActive: { borderColor: theme.primary, backgroundColor: theme.backgroundSecondary },
  customerSelectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerSelectName: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  customerSelectPhone: { fontSize: 12, color: theme.textMuted },
  customerSelectBalance: { fontSize: 14, fontWeight: '700', color: theme.credit },
  sendReminderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: theme.borderRadius.md, marginTop: 24 },
  sendReminderText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
