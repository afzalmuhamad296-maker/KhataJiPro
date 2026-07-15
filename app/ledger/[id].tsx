import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, Linking, Share, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useApp } from '../../contexts/AppContext';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useAlert } from '@/template';

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getCustomerById, getCustomerTransactions, deleteTransaction, deleteCustomer,
    formatCurrency, t, language, isRTL, currentTheme, settings, formatDate,
  } = useApp();
  const { showAlert } = useAlert();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showQR, setShowQR] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const qrRef = useRef<any>(null);

  const customer = getCustomerById(id || '') as any;
  const allTransactions = getCustomerTransactions(id || '');
  const transactions = allTransactions.filter(txn => filter === 'all' || txn.type === filter);

  if (!customer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }}>
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={{ marginTop: 12, color: currentTheme.textMuted }}>Customer not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: currentTheme.primary, fontWeight: '700' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const qrData = JSON.stringify({
    name: customer.name, phone: customer.phone, balance: customer.balance, shop: settings.shopName,
  });

  const handleShareWhatsApp = useCallback(async () => {
    const message = `*${settings.shopName}*\n\n${language === 'ur' ? 'گاہک' : 'Customer'}: ${customer.name}\n${t.phone}: ${customer.phone}\n${t.balance}: ${formatCurrency(customer.balance)}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else showAlert('WhatsApp', 'WhatsApp is not installed');
    } catch { showAlert(t.error, 'Could not open WhatsApp'); }
  }, [customer, settings.shopName]);

  const handleDownloadQR = useCallback(async () => {
    if (!qrRef.current) return;
    try {
      qrRef.current.toDataURL(async (dataURL: string) => {
        const filename = `${customer.name.replace(/\s+/g, '_')}_QR.png`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, dataURL, { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri, { mimeType: 'image/png' });
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch { showAlert(t.error, 'Could not save QR'); }
  }, [customer]);

  const handleCall = () => {
    if (!customer.phone) {
      showAlert(t.error, language === 'ur' ? 'فون نمبر موجود نہیں' : 'No phone number');
      return;
    }
    Linking.openURL(`tel:${customer.phone}`).catch(() => {});
  };

  const handleSMS = () => {
    if (!customer.phone) return;
    const msg = language === 'ur'
      ? `السلام علیکم ${customer.name}، ${settings.shopName} پر آپ کا بقایا ${formatCurrency(customer.balance)} ہے۔`
      : `Dear ${customer.name}, your balance at ${settings.shopName} is ${formatCurrency(customer.balance)}. Please pay soon.`;
    Linking.openURL(`sms:${customer.phone}?body=${encodeURIComponent(msg)}`).catch(() => {});
  };

  const handleShareStatement = async () => {
    const stmt = `*${settings.shopName} - ${language === 'ur' ? 'اسٹیٹمنٹ' : 'Statement'}*\n\n${language === 'ur' ? 'گاہک' : 'Customer'}: ${customer.name}\n${t.phone}: ${customer.phone}\n\n${language === 'ur' ? 'کل ادھار' : 'Total Credit'}: ${formatCurrency(customer.totalCredit)}\n${language === 'ur' ? 'کل ادائیگی' : 'Total Paid'}: ${formatCurrency(customer.totalDebit)}\n${language === 'ur' ? 'موجودہ بقایا' : 'Current Balance'}: ${formatCurrency(customer.balance)}\n\n${language === 'ur' ? 'کل لین دین' : 'Total Transactions'}: ${allTransactions.length}`;
    try { await Share.share({ message: stmt }); } catch {}
  };

  const handleDeleteCustomer = () => {
    setShowMenu(false);
    showAlert(
      language === 'ur' ? 'گاہک حذف کریں؟' : 'Delete Customer?',
      language === 'ur'
        ? `${customer.name} اور اس کے تمام لین دین حذف ہو جائیں گے۔ یہ عمل واپس نہیں ہو سکتا۔`
        : `${customer.name} and all their transactions will be permanently deleted. This cannot be undone.`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete, style: 'destructive',
          onPress: () => {
            deleteCustomer(customer.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            router.back();
          },
        },
      ],
    );
  };

  const handleDeleteTransaction = (txnId: string) => {
    showAlert(t.delete, t.confirmDelete, [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: () => deleteTransaction(txnId) },
    ]);
  };

  const groupedByDate = transactions.reduce((groups, txn) => {
    const date = txn.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, typeof transactions>);

  const getDateLabel = (d: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (d === today) return t.today;
    if (d === yest) return t.yesterday;
    return formatDate(d);
  };

  const menuItems = [
    { icon: 'edit', label: language === 'ur' ? 'ترمیم کریں' : 'Edit Customer', color: '#2563EB', bg: '#DBEAFE', action: () => { setShowMenu(false); showAlert(language === 'ur' ? 'جلد آ رہا ہے' : 'Coming Soon', language === 'ur' ? 'ترمیم کا آپشن جلد شامل ہوگا' : 'Edit customer coming soon'); } },
    { icon: 'share', label: language === 'ur' ? 'اسٹیٹمنٹ شیئر' : 'Share Statement', color: '#16A34A', bg: '#DCFCE7', action: () => { setShowMenu(false); handleShareStatement(); } },
    { icon: 'notifications-active', label: language === 'ur' ? 'یاد دہانی بھیجیں' : 'Send Reminder', color: '#D97706', bg: '#FEF3C7', action: () => { setShowMenu(false); handleSMS(); } },
    { icon: 'receipt-long', label: language === 'ur' ? 'انوائس بنائیں' : 'Create Invoice', color: '#7C3AED', bg: '#F3E8FF', action: () => { setShowMenu(false); router.push('/invoice'); } },
    { icon: 'qr-code-2', label: language === 'ur' ? 'کیو آر کوڈ' : 'Show QR Code', color: '#0891B2', bg: '#CFFAFE', action: () => { setShowMenu(false); setShowQR(true); } },
    { icon: 'call', label: language === 'ur' ? 'کال کریں' : 'Call', color: '#0D7C4A', bg: '#DCFCE7', action: () => { setShowMenu(false); handleCall(); } },
    { icon: 'block', label: language === 'ur' ? 'گاہک بلاک' : 'Block Customer', color: '#B45309', bg: '#FEF3C7', action: () => { setShowMenu(false); showAlert(language === 'ur' ? 'گاہک بلاک' : 'Blocked', language === 'ur' ? 'گاہک کو ادھار نہیں دیا جائے گا' : 'No further credit will be allowed'); } },
    { icon: 'delete-forever', label: language === 'ur' ? 'گاہک حذف کریں' : 'Delete Customer', color: '#DC2626', bg: '#FEE2E2', danger: true, action: handleDeleteCustomer },
  ];

  const customerColor = customer.avatarColor || currentTheme.primary;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: currentTheme.background }}>
      {/* Gradient Header */}
      <LinearGradient colors={currentTheme.primaryGradient as any} style={s.header}>
        <View style={[s.headerRow, isRTL && s.rtlRow]}>
          <Pressable style={s.hBtn} onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFF" />
          </Pressable>
          <Text style={s.hTitle}>{t.ledger}</Text>
          <Pressable style={s.hBtn} onPress={() => setShowMenu(true)} hitSlop={8}>
            <MaterialIcons name="more-vert" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* Customer Card floating */}
        <View style={s.custInfo}>
          <View style={s.custAvatarWrap}>
            {customer.photo ? (
              <Image source={{ uri: customer.photo }} style={s.custPhoto} contentFit="cover" transition={200} />
            ) : (
              <View style={[s.custAvatarCircle, { backgroundColor: customerColor }]}>
                <Text style={s.custAvatarText}>
                  {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={s.custName}>{customer.name}</Text>
          <Text style={s.custPhone}>{customer.phone || (language === 'ur' ? 'کوئی نمبر نہیں' : 'No phone')}</Text>
          <View style={[s.balanceBadge, { backgroundColor: customer.balance > 0 ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)' }]}>
            <MaterialIcons
              name={customer.balance > 0 ? 'trending-up' : 'check-circle'}
              size={14}
              color={customer.balance > 0 ? '#FCA5A5' : '#86EFAC'}
            />
            <Text style={[s.balanceText, { color: customer.balance > 0 ? '#FCA5A5' : '#86EFAC' }]}>
              {customer.balance > 0 ? (language === 'ur' ? 'بقایا: ' : 'Due: ') : (language === 'ur' ? 'صاف: ' : 'Clear: ')}
              {formatCurrency(customer.balance)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={s.actionsRow}>
          <Pressable style={s.actBtn} onPress={handleCall}>
            <View style={[s.actIcon, { backgroundColor: '#DCFCE7' }]}>
              <MaterialIcons name="phone" size={20} color="#16A34A" />
            </View>
            <Text style={s.actLabel}>{t.call}</Text>
          </Pressable>
          <Pressable style={s.actBtn} onPress={handleSMS}>
            <View style={[s.actIcon, { backgroundColor: '#DBEAFE' }]}>
              <MaterialIcons name="sms" size={20} color="#2563EB" />
            </View>
            <Text style={s.actLabel}>{t.sms}</Text>
          </Pressable>
          <Pressable style={s.actBtn} onPress={handleShareWhatsApp}>
            <View style={[s.actIcon, { backgroundColor: '#F0FDF4' }]}>
              <MaterialIcons name="chat" size={20} color="#25D366" />
            </View>
            <Text style={s.actLabel}>WA</Text>
          </Pressable>
          <Pressable style={s.actBtn} onPress={() => setShowQR(true)}>
            <View style={[s.actIcon, { backgroundColor: '#EDE9FE' }]}>
              <MaterialIcons name="qr-code-2" size={20} color="#7C3AED" />
            </View>
            <Text style={s.actLabel}>QR</Text>
          </Pressable>
        </View>

        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={[s.sumBox, { borderLeftColor: currentTheme.credit }]}>
            <Text style={s.sumLabel}>{t.totalCredit}</Text>
            <Text style={[s.sumValue, { color: currentTheme.credit }]}>{formatCurrency(customer.totalCredit)}</Text>
          </View>
          <View style={[s.sumBox, { borderLeftColor: currentTheme.payment }]}>
            <Text style={s.sumLabel}>{t.totalDebit}</Text>
            <Text style={[s.sumValue, { color: currentTheme.payment }]}>{formatCurrency(customer.totalDebit)}</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={s.filterRow}>
          {([
            { key: 'all', label: t.all, count: allTransactions.length },
            { key: 'credit', label: t.credits, count: allTransactions.filter(t => t.type === 'credit').length },
            { key: 'debit', label: t.payments, count: allTransactions.filter(t => t.type === 'debit').length },
          ] as const).map(item => (
            <Pressable
              key={item.key}
              style={[s.filterChip, filter === item.key && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[s.filterText, filter === item.key && { color: '#FFF' }]}>{item.label}</Text>
              <View style={[s.filterCount, filter === item.key && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <Text style={[s.filterCountText, filter === item.key && { color: '#FFF' }]}>{item.count}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Transactions */}
        {Object.entries(groupedByDate).map(([date, txns]) => (
          <View key={date} style={s.dateGroup}>
            <Text style={[s.dateLabel, isRTL && s.rtlText]}>{getDateLabel(date)}</Text>
            {txns.map(txn => (
              <Pressable
                key={txn.id}
                style={s.txnRow}
                onLongPress={() => handleDeleteTransaction(txn.id)}
              >
                <View style={[s.txnDot, { backgroundColor: txn.type === 'credit' ? currentTheme.credit : currentTheme.payment }]}>
                  <MaterialIcons name={txn.type === 'credit' ? 'north-east' : 'south-west'} size={12} color="#FFF" />
                </View>
                <View style={s.txnInfo}>
                  <Text style={[s.txnNote, isRTL && s.rtlText]}>
                    {txn.note || (txn.type === 'credit' ? t.creditGiven : t.paymentReceived)}
                  </Text>
                  {txn.items && txn.items.length > 0 && (
                    <View style={s.itemsRow}>
                      {txn.items.slice(0, 3).map(item => (
                        <View key={item.id} style={s.itemChip}>
                          <Text style={s.itemChipText}>{item.name} ×{item.quantity}</Text>
                        </View>
                      ))}
                      {txn.items.length > 3 && (
                        <View style={s.itemChip}>
                          <Text style={s.itemChipText}>+{txn.items.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {txn.paymentMethod && (
                    <Text style={s.txnMethod}>
                      <MaterialIcons name="account-balance" size={10} /> via {txn.paymentMethod}
                    </Text>
                  )}
                </View>
                <Text style={[s.txnAmount, { color: txn.type === 'credit' ? currentTheme.credit : currentTheme.payment }]}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}

        {transactions.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 56 }}>📋</Text>
            <Text style={s.emptyText}>{t.noTransactions}</Text>
            <Text style={s.emptySub}>
              {language === 'ur' ? 'پہلا لین دین شامل کریں' : 'Add first transaction below'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[s.bottomActions, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.9 }]} onPress={() => router.push('/add-credit')}>
          <LinearGradient colors={[currentTheme.credit, '#B91C1C']} style={s.bottomBtn}>
            <MaterialIcons name="north-east" size={18} color="#FFF" />
            <Text style={s.bottomBtnText}>{t.addCredit}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.9 }]} onPress={() => router.push('/add-payment')}>
          <LinearGradient colors={[currentTheme.payment, '#15803D']} style={s.bottomBtn}>
            <MaterialIcons name="south-west" size={18} color="#FFF" />
            <Text style={s.bottomBtnText}>{t.addPayment}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Three-Dot Menu */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={s.menuOverlay} onPress={() => setShowMenu(false)}>
          <Pressable style={s.menuCard}>
            <View style={s.menuHandle} />
            <View style={s.menuHeader}>
              <View style={[s.menuAvatarSm, { backgroundColor: customerColor }]}>
                <Text style={s.menuAvatarText}>
                  {customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.menuTitle}>{customer.name}</Text>
                <Text style={s.menuSubtitle}>
                  {language === 'ur' ? 'گاہک کے اعمال' : 'Customer Actions'}
                </Text>
              </View>
              <Pressable onPress={() => setShowMenu(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={currentTheme.textDark} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              {menuItems.map((item, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [s.menuItem, pressed && { backgroundColor: currentTheme.borderLight }, isRTL && s.rtlRow]}
                  onPress={item.action}
                >
                  <View style={[s.menuItemIcon, { backgroundColor: item.bg }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[s.menuItemText, item.danger && { color: '#DC2626' }, isRTL && s.rtlText]}>
                    {item.label}
                  </Text>
                  <MaterialIcons
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={20}
                    color={currentTheme.textMuted}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* QR Modal */}
      <Modal visible={showQR} animationType="slide" transparent statusBarTranslucent>
        <View style={s.qrOverlay}>
          <View style={s.qrModal}>
            <LinearGradient colors={currentTheme.primaryGradient as any} style={s.qrHeader}>
              <Text style={s.qrTitle}>📱 {language === 'ur' ? 'کیو آر کوڈ' : 'Customer QR'}</Text>
              <Pressable onPress={() => setShowQR(false)} style={s.qrClose}>
                <MaterialIcons name="close" size={22} color="#FFF" />
              </Pressable>
            </LinearGradient>
            <View style={s.qrContent}>
              <View style={s.qrFrame}>
                <QRCode
                  value={qrData}
                  size={200}
                  color={currentTheme.primaryDark}
                  backgroundColor="#FFFFFF"
                  getRef={(ref: any) => { qrRef.current = ref; }}
                />
              </View>
              <Text style={s.qrCustName}>{customer.name}</Text>
              <Text style={s.qrCustPhone}>{customer.phone}</Text>
              <View style={[s.qrBalanceBadge, { backgroundColor: customer.balance > 0 ? '#FEE2E2' : '#DCFCE7' }]}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: customer.balance > 0 ? '#DC2626' : '#16A34A' }}>
                  {formatCurrency(customer.balance)}
                </Text>
              </View>
              <View style={s.qrActions}>
                <Pressable style={[s.qrActBtn, { backgroundColor: '#25D366' }]} onPress={handleShareWhatsApp}>
                  <MaterialIcons name="chat" size={16} color="#FFF" />
                  <Text style={s.qrActText}>Share</Text>
                </Pressable>
                <Pressable style={[s.qrActBtn, { backgroundColor: currentTheme.primary }]} onPress={handleDownloadQR}>
                  <MaterialIcons name="download" size={16} color="#FFF" />
                  <Text style={s.qrActText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  header: { paddingTop: 6, paddingBottom: 24, paddingHorizontal: 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },

  custInfo: { alignItems: 'center', marginTop: 16 },
  custAvatarWrap: { padding: 3, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,215,0,0.5)' },
  custPhoto: { width: 84, height: 84, borderRadius: 42 },
  custAvatarCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  custAvatarText: { fontSize: 30, fontWeight: '800', color: '#FFF' },
  custName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginTop: 12 },
  custPhone: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  balanceText: { fontSize: 14, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 18, backgroundColor: '#FFF', borderRadius: 18, padding: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 }, default: {} }) },
  actBtn: { alignItems: 'center', gap: 6 },
  actIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontSize: 11, fontWeight: '700', color: '#4B5563' },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 14 },
  sumBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderLeftWidth: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }, android: { elevation: 2 }, default: {} }) },
  sumLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sumValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  filterCount: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, minWidth: 18, alignItems: 'center' },
  filterCountText: { fontSize: 10, fontWeight: '800', color: '#4B5563' },

  dateGroup: { marginTop: 16, paddingHorizontal: 16 },
  dateLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  txnRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', padding: 12, borderRadius: 14, marginBottom: 8, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 }, android: { elevation: 1 }, default: {} }) },
  txnDot: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, marginLeft: 12 },
  txnNote: { fontSize: 13, fontWeight: '600', color: '#111827' },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  itemChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  itemChipText: { fontSize: 10, color: '#0D7C4A', fontWeight: '700' },
  txnMethod: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  txnAmount: { fontSize: 14, fontWeight: '800', marginLeft: 8 },

  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  emptyText: { fontSize: 16, color: '#111827', marginTop: 12, fontWeight: '700' },
  emptySub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bottomBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  bottomBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuCard: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 24, maxHeight: '85%' },
  menuHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuAvatarSm: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  menuTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  menuSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  menuItemIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },

  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrModal: { width: '100%', maxWidth: 380, backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden' },
  qrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  qrTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  qrClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  qrContent: { alignItems: 'center', padding: 24 },
  qrFrame: { padding: 16, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#F1F5F9' },
  qrCustName: { fontSize: 17, fontWeight: '800', color: '#111827', marginTop: 16 },
  qrCustPhone: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  qrBalanceBadge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  qrActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  qrActBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  qrActText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
