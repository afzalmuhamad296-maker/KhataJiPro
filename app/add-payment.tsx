import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';
import { APP_CONFIG } from '../constants/config';

export default function AddPaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, paymentMethods, addTransaction, formatCurrency, t, language, isRTL } = useApp();
  const { showAlert } = useAlert();

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'due'>('due');

  const customer = customers.find(c => c.id === selectedCustomer);
  const enabledMethods = paymentMethods.filter(pm => pm.enabled);

  const filteredCustomers = useMemo(() => {
    const base = customerFilter === 'due'
      ? customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance)
      : customers;
    return base.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerFilter, customerSearch]);

  const numAmount = Number(amount) || 0;
  const willOverpay = customer && numAmount > customer.balance;
  const dueCount = customers.filter(c => c.balance > 0).length;

  const handleQuickAmount = (amt: number) => {
    setAmount(amt.toString());
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSave = () => {
    if (!selectedCustomer) {
      showAlert(t.error, language === 'ur' ? 'گاہک منتخب کریں' : 'Please select a customer');
      return;
    }
    if (numAmount <= 0) {
      showAlert(t.error, language === 'ur' ? 'رقم درج کریں' : 'Please enter an amount');
      return;
    }
    addTransaction({
      customerId: selectedCustomer,
      customerName: customer?.name || '',
      type: 'debit',
      amount: numAmount,
      note: note || (language === 'ur' ? 'ادائیگی وصول' : 'Payment received'),
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showAlert(
      language === 'ur' ? 'کامیاب' : 'Success',
      language === 'ur'
        ? `${customer?.name} سے ${formatCurrency(numAmount)} وصول ہوا`
        : `${formatCurrency(numAmount)} received from ${customer?.name}`
    );
    setTimeout(() => router.back(), 500);
  };

  return (
    <SafeAreaView edges={['top']} style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#0D9F5A', '#16A34A', '#15803D']} style={s.header}>
          <View style={[s.headerRow, isRTL && s.rtlRow]}>
            <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color="#FFF" />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>{t.addPayment}</Text>
              <Text style={s.headerSubtitle}>
                {language === 'ur' ? 'ادائیگی وصول کریں' : 'Record payment received'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.headerAmount}>
            <MaterialIcons name="south-west" size={22} color="rgba(255,255,255,0.75)" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.headerAmountLabel}>
                {language === 'ur' ? 'وصول رقم' : 'Amount Received'}
              </Text>
              <Text style={s.headerAmountValue}>{formatCurrency(numAmount)}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[s.label, isRTL && s.rtlText]}>{t.selectCustomer}</Text>
          <Pressable
            style={({ pressed }) => [s.customerCard, pressed && { opacity: 0.85 }, isRTL && s.rtlRow]}
            onPress={() => setShowCustomerModal(true)}
          >
            {customer ? (
              <>
                <View style={s.custAvatar}>
                  <Text style={s.custAvatarText}>
                    {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[s.custName, isRTL && s.rtlText]}>{customer.name}</Text>
                  <Text style={[s.custPhone, isRTL && s.rtlText]}>{customer.phone}</Text>
                  <View style={[s.outstandingBadge, isRTL && s.rtlRow]}>
                    <MaterialIcons name="pending-actions" size={12} color={theme.credit} />
                    <Text style={s.outstandingText}>
                      {language === 'ur' ? 'بقایا:' : 'Outstanding:'} {formatCurrency(customer.balance)}
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="swap-horiz" size={20} color={theme.payment} />
              </>
            ) : (
              <>
                <View style={s.custAvatarEmpty}>
                  <MaterialIcons name="person-search" size={22} color={theme.payment} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[s.custEmptyTitle, isRTL && s.rtlText]}>{t.selectCustomer}</Text>
                  <Text style={[s.custEmptySub, isRTL && s.rtlText]}>
                    💰 {dueCount} {language === 'ur' ? 'گاہک بقایا کے ساتھ' : 'customers with balance'}
                  </Text>
                </View>
                <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={22} color={theme.textMuted} />
              </>
            )}
          </Pressable>

          <Text style={[s.label, isRTL && s.rtlText]}>{t.amount}</Text>
          <View style={s.amountBox}>
            <Text style={s.currencyLabel}>{language === 'ur' ? 'روپے' : 'Rs.'}</Text>
            <TextInput
              style={s.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {customer && customer.balance > 0 && (
            <Pressable
              style={({ pressed }) => [s.fullAmountBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleQuickAmount(customer.balance)}
            >
              <MaterialIcons name="done-all" size={16} color={theme.payment} />
              <Text style={s.fullAmountText}>
                💰 {language === 'ur' ? 'مکمل ادائیگی' : 'Full Payment'} · {formatCurrency(customer.balance)}
              </Text>
            </Pressable>
          )}

          {willOverpay ? (
            <View style={s.warningRow}>
              <MaterialIcons name="warning-amber" size={16} color="#D97706" />
              <Text style={s.warningText}>
                {language === 'ur'
                  ? `اضافی ${formatCurrency(numAmount - (customer?.balance || 0))} ایڈوانس`
                  : `Extra ${formatCurrency(numAmount - (customer?.balance || 0))} will be advance`}
              </Text>
            </View>
          ) : null}

          <Text style={[s.subLabel, isRTL && s.rtlText]}>
            ⚡ {language === 'ur' ? 'فوری رقم' : 'Quick Amounts'}
          </Text>
          <View style={s.quickAmountsGrid}>
            {APP_CONFIG.quickAmounts.map(amt => (
              <Pressable
                key={amt}
                style={[s.quickAmountChip, amount === amt.toString() && s.quickAmountChipActive]}
                onPress={() => handleQuickAmount(amt)}
              >
                <Text style={[s.quickAmountText, amount === amt.toString() && s.quickAmountTextActive]}>
                  +{amt.toLocaleString()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.label, isRTL && s.rtlText]}>{t.paymentMethod}</Text>
          <View style={s.methodsGrid}>
            {enabledMethods.map(method => {
              const isActive = paymentMethod === method.key;
              return (
                <Pressable
                  key={method.key}
                  style={[
                    s.methodCard,
                    isActive && { borderColor: method.color, backgroundColor: method.bgColor },
                  ]}
                  onPress={() => {
                    setPaymentMethod(method.key);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                >
                  <View style={[s.methodIconWrap, { backgroundColor: isActive ? method.color : method.bgColor }]}>
                    <MaterialIcons name={method.icon as any} size={22} color={isActive ? '#FFF' : method.color} />
                  </View>
                  <Text style={[s.methodLabel, isActive && { color: method.color, fontWeight: '800' }]}>
                    {language === 'ur' ? method.labelUr : method.label}
                  </Text>
                  {isActive ? (
                    <View style={s.methodCheck}>
                      <MaterialIcons name="check-circle" size={16} color={method.color} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.label, isRTL && s.rtlText]}>{t.note}</Text>
          <TextInput
            style={[s.noteInput, isRTL && s.rtlText]}
            placeholder={language === 'ur' ? 'مثال: ماہانہ ادائیگی' : 'e.g. Monthly payment'}
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor={theme.textMuted}
          />
        </ScrollView>

        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleSave}
            disabled={!selectedCustomer || numAmount <= 0}
          >
            <LinearGradient
              colors={!selectedCustomer || numAmount <= 0 ? ['#94A3B8', '#64748B'] : ['#16A34A', '#15803D']}
              style={s.saveBtn}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
              <Text style={s.saveBtnText}>{t.save} {formatCurrency(numAmount)}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showCustomerModal} transparent animationType="slide" onRequestClose={() => setShowCustomerModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <View style={[s.modalHeaderRow, isRTL && s.rtlRow]}>
              <Text style={s.modalTitle}>
                💰 {language === 'ur' ? 'گاہک منتخب کریں' : 'Select Customer'}
              </Text>
              <Pressable onPress={() => setShowCustomerModal(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={theme.textDark} />
              </Pressable>
            </View>
            <View style={s.filterTabs}>
              <Pressable
                style={[s.filterTab, customerFilter === 'due' && s.filterTabActive]}
                onPress={() => setCustomerFilter('due')}
              >
                <MaterialIcons name="pending-actions" size={14} color={customerFilter === 'due' ? theme.credit : theme.textMuted} />
                <Text style={[s.filterTabText, customerFilter === 'due' && { color: theme.credit }]}>
                  {language === 'ur' ? 'بقایا والے' : 'With Balance'} ({dueCount})
                </Text>
              </Pressable>
              <Pressable
                style={[s.filterTab, customerFilter === 'all' && s.filterTabActive]}
                onPress={() => setCustomerFilter('all')}
              >
                <MaterialIcons name="people" size={14} color={customerFilter === 'all' ? theme.primary : theme.textMuted} />
                <Text style={[s.filterTabText, customerFilter === 'all' && { color: theme.primary }]}>
                  {language === 'ur' ? 'تمام' : 'All'} ({customers.length})
                </Text>
              </Pressable>
            </View>
            <View style={s.modalSearchBox}>
              <MaterialIcons name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={[s.modalSearchInput, isRTL && s.rtlText]}
                placeholder={t.search}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <ScrollView style={{ maxHeight: 450 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {filteredCustomers.map(c => (
                <Pressable
                  key={c.id}
                  style={[s.modalCustRow, selectedCustomer === c.id && s.modalCustRowActive, isRTL && s.rtlRow]}
                  onPress={() => {
                    setSelectedCustomer(c.id);
                    setShowCustomerModal(false);
                    setCustomerSearch('');
                    Haptics.selectionAsync().catch(() => {});
                  }}
                >
                  <View style={s.modalCustAvatar}>
                    <Text style={s.modalCustAvatarText}>
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[s.modalCustName, isRTL && s.rtlText]}>{c.name}</Text>
                    <Text style={[s.modalCustPhone, isRTL && s.rtlText]}>{c.phone}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.modalCustBal, { color: c.balance > 0 ? theme.credit : theme.payment }]}>
                      {formatCurrency(c.balance)}
                    </Text>
                    {c.balance > 0 ? (
                      <View style={s.dueMiniBadge}>
                        <Text style={s.dueMiniText}>{t.due}</Text>
                      </View>
                    ) : (
                      <View style={s.clearBadge}>
                        <Text style={s.clearBadgeText}>{t.clear}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
              {filteredCustomers.length === 0 && (
                <View style={s.modalEmpty}>
                  <Text style={{ fontSize: 40 }}>{customerFilter === 'due' ? '🎉' : '😕'}</Text>
                  <Text style={s.modalEmptyText}>
                    {customerFilter === 'due'
                      ? (language === 'ur' ? 'کوئی بقایا نہیں' : 'No pending balances')
                      : (language === 'ur' ? 'کوئی گاہک نہیں' : 'No customers found')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  header: { paddingTop: 6, paddingBottom: 16, paddingHorizontal: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerAmount: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 14, marginTop: 12 },
  headerAmountLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  headerAmountValue: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 2, letterSpacing: -0.5 },
  label: { fontSize: 12, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
  subLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  customerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 }, default: {},
    }),
  },
  custAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.paymentLight, alignItems: 'center', justifyContent: 'center' },
  custAvatarEmpty: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.paymentLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.payment + '30', borderStyle: 'dashed' },
  custAvatarText: { fontSize: 14, fontWeight: '700', color: theme.payment },
  custName: { fontSize: 15, fontWeight: '700', color: theme.textDark },
  custPhone: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  custEmptyTitle: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  custEmptySub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  outstandingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.creditLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  outstandingText: { fontSize: 11, fontWeight: '700', color: theme.credit },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: theme.borderLight, height: 60 },
  currencyLabel: { fontSize: 18, fontWeight: '700', color: theme.textSecondary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: theme.textDark },
  fullAmountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.paymentLight, borderWidth: 1.5, borderColor: theme.payment + '40' },
  fullAmountText: { fontSize: 13, fontWeight: '800', color: theme.payment },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FEF3C7', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
  warningText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#92400E' },
  quickAmountsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickAmountChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: theme.borderLight },
  quickAmountChipActive: { backgroundColor: theme.payment, borderColor: theme.payment },
  quickAmountText: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
  quickAmountTextActive: { color: '#FFF' },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { width: '31%', backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: theme.borderLight, position: 'relative' },
  methodIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
  methodCheck: { position: 'absolute', top: 6, right: 6 },
  noteInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: theme.borderLight, fontSize: 14, color: theme.textDark, minHeight: 70, textAlignVertical: 'top' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: theme.borderLight },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: theme.textDark },
  filterTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  filterTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.borderLight },
  filterTabActive: { backgroundColor: '#FFF', borderColor: theme.primary },
  filterTabText: { fontSize: 12, fontWeight: '700', color: theme.textMuted },
  modalSearchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  modalSearchInput: { flex: 1, fontSize: 14, color: theme.textDark },
  modalCustRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  modalCustRowActive: { backgroundColor: theme.paymentLight },
  modalCustAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  modalCustAvatarText: { fontSize: 13, fontWeight: '700', color: theme.primary },
  modalCustName: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  modalCustPhone: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  modalCustBal: { fontSize: 13, fontWeight: '800' },
  dueMiniBadge: { backgroundColor: theme.creditLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  dueMiniText: { fontSize: 9, fontWeight: '800', color: theme.credit },
  clearBadge: { backgroundColor: theme.paymentLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  clearBadgeText: { fontSize: 9, fontWeight: '800', color: theme.payment },
  modalEmpty: { alignItems: 'center', paddingVertical: 40 },
  modalEmptyText: { fontSize: 14, color: theme.textMuted, marginTop: 8 },
});
