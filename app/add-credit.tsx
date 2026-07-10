import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';

const UNITS = ['kg', 'g', 'bag', 'tin', 'bottle', 'pack', 'piece', 'litre', 'dozen'];
const EMOJIS = ['🌾', '🍯', '🍚', '🛒', '🫘', '☕', '🥛', '🌶', '🧂', '🧼', '🥔', '🥩', '🥚', '📦'];
const CATS = ['Flour', 'Sugar', 'Rice', 'Oil & Ghee', 'Pulses', 'Beverages', 'Dairy', 'Spices', 'Household', 'Snacks', 'Other'];

export default function AddCreditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, itemRates, addTransaction, addItemRate, formatCurrency, t, language, isRTL } = useApp();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<'items' | 'amount'>('items');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{
    id: string; name: string; quantity: number; rate: number; total: number; image?: string;
  }>>([]);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showRateBookModal, setShowRateBookModal] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [rateBookSearch, setRateBookSearch] = useState('');

  // Custom item form
  const [ciName, setCiName] = useState('');
  const [ciRate, setCiRate] = useState('');
  const [ciQty, setCiQty] = useState('1');
  const [ciUnit, setCiUnit] = useState('kg');
  const [ciEmoji, setCiEmoji] = useState('📦');
  const [ciImage, setCiImage] = useState<string | undefined>();
  const [ciSaveToBook, setCiSaveToBook] = useState(true);
  const [ciCategory, setCiCategory] = useState('Other');

  const customer = customers.find(c => c.id === selectedCustomer);

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    ), [customers, customerSearch]);

  const filteredRateBook = useMemo(() =>
    itemRates.filter(item =>
      item.name.toLowerCase().includes(rateBookSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(rateBookSearch.toLowerCase())
    ), [itemRates, rateBookSearch]);

  const totalFromItems = selectedItems.reduce((sum, i) => sum + i.total, 0);
  const finalAmount = mode === 'items' ? totalFromItems : Number(amount) || 0;

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      const perm = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert(t.error, language === 'ur' ? 'اجازت درکار ہے' : 'Permission required');
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (!result.canceled && result.assets?.[0]) setCiImage(result.assets[0].uri);
    } catch (err: any) {
      showAlert(t.error, err?.message || 'Unable to pick image');
    }
  };

  const handleAddFromRateBook = (item: typeof itemRates[0]) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.rate } : i
      ));
    } else {
      setSelectedItems(prev => [...prev, { id: item.id, name: item.name, quantity: 1, rate: item.rate, total: item.rate, image: item.image }]);
    }
    Haptics.selectionAsync().catch(() => {});
    setShowRateBookModal(false);
  };

  const resetCustomItemForm = () => {
    setCiName(''); setCiRate(''); setCiQty('1'); setCiUnit('kg');
    setCiEmoji('📦'); setCiImage(undefined); setCiCategory('Other');
    setCiSaveToBook(true);
  };

  const handleAddCustomItem = () => {
    const rate = parseFloat(ciRate);
    const qty = parseFloat(ciQty) || 1;
    if (!ciName.trim() || !rate || rate <= 0) {
      showAlert(t.error, language === 'ur' ? 'نام اور ریٹ درکار ہے' : 'Name and valid rate required');
      return;
    }
    setSelectedItems(prev => [...prev, {
      id: 'custom_' + Date.now(), name: ciName.trim(), quantity: qty, rate,
      total: qty * rate, image: ciImage,
    }]);
    if (ciSaveToBook) {
      addItemRate({ name: ciName.trim(), rate, unit: ciUnit, category: ciCategory, image: ciImage });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    resetCustomItemForm();
    setShowCustomItemModal(false);
  };

  const updateItemQty = (id: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, total: newQty * i.rate };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => setSelectedItems(prev => prev.filter(i => i.id !== id));

  const handleSave = () => {
    if (!selectedCustomer) {
      showAlert(t.error, language === 'ur' ? 'گاہک منتخب کریں' : 'Please select a customer');
      return;
    }
    if (finalAmount <= 0) {
      showAlert(t.error, language === 'ur' ? 'رقم درج کریں' : 'Please enter an amount');
      return;
    }
    addTransaction({
      customerId: selectedCustomer,
      customerName: customer?.name || '',
      type: 'credit',
      amount: finalAmount,
      note: note || selectedItems.map(i => i.name).join(', ') || (language === 'ur' ? 'ادھار' : 'Credit'),
      items: selectedItems.length > 0 ? selectedItems.map(i => ({
        id: i.id, name: i.name, quantity: i.quantity, rate: i.rate, total: i.total,
      })) : undefined,
      date: new Date().toISOString().split('T')[0],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showAlert(
      language === 'ur' ? 'کامیاب' : 'Success',
      language === 'ur' ? `${customer?.name} کو ${formatCurrency(finalAmount)} ادھار شامل` : `${formatCurrency(finalAmount)} credit added to ${customer?.name}`
    );
    setTimeout(() => router.back(), 500);
  };

  return (
    <SafeAreaView edges={['top']} style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={['#DC2626', '#B91C1C', '#991B1B']} style={s.header}>
          <View style={[s.headerRow, isRTL && s.rtlRow]}>
            <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color="#FFF" />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>{t.addCredit}</Text>
              <Text style={s.headerSubtitle}>
                {language === 'ur' ? 'نیا ادھار درج کریں' : 'Record new credit'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.headerAmount}>
            <MaterialIcons name="north-east" size={22} color="rgba(255,255,255,0.75)" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.headerAmountLabel}>{t.amount}</Text>
              <Text style={s.headerAmountValue}>{formatCurrency(finalAmount)}</Text>
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
                  <Text style={[s.custBalance, isRTL && s.rtlText]}>
                    {t.balance}: {formatCurrency(customer.balance)}
                  </Text>
                </View>
                <MaterialIcons name="swap-horiz" size={20} color={theme.credit} />
              </>
            ) : (
              <>
                <View style={s.custAvatarEmpty}>
                  <MaterialIcons name="person-add" size={22} color={theme.credit} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[s.custEmptyTitle, isRTL && s.rtlText]}>{t.selectCustomer}</Text>
                  <Text style={[s.custEmptySub, isRTL && s.rtlText]}>
                    {language === 'ur' ? 'ادھار کے لیے گاہک' : 'Choose customer for credit'}
                  </Text>
                </View>
                <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={22} color={theme.textMuted} />
              </>
            )}
          </Pressable>

          <View style={s.modeToggle}>
            <Pressable style={[s.modeBtn, mode === 'items' && s.modeBtnActive]} onPress={() => setMode('items')}>
              <MaterialIcons name="inventory-2" size={16} color={mode === 'items' ? theme.credit : theme.textMuted} />
              <Text style={[s.modeBtnText, mode === 'items' && { color: theme.credit }]}>
                {language === 'ur' ? 'اشیاء' : 'Items'}
              </Text>
            </Pressable>
            <Pressable style={[s.modeBtn, mode === 'amount' && s.modeBtnActive]} onPress={() => setMode('amount')}>
              <MaterialIcons name="account-balance-wallet" size={16} color={mode === 'amount' ? theme.credit : theme.textMuted} />
              <Text style={[s.modeBtnText, mode === 'amount' && { color: theme.credit }]}>
                {language === 'ur' ? 'صرف رقم' : 'Amount Only'}
              </Text>
            </Pressable>
          </View>

          {mode === 'items' && (
            <>
              {selectedItems.length > 0 && (
                <View style={s.itemsList}>
                  {selectedItems.map(item => (
                    <View key={item.id} style={[s.itemRow, isRTL && s.rtlRow]}>
                      <View style={s.itemImg}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={s.itemImgPic} contentFit="cover" transition={150} />
                        ) : (
                          <Text style={{ fontSize: 20 }}>📦</Text>
                        )}
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <Text style={[s.itemName, isRTL && s.rtlText]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[s.itemRate, isRTL && s.rtlText]}>
                          {formatCurrency(item.rate)} × {item.quantity} = {formatCurrency(item.total)}
                        </Text>
                      </View>
                      <View style={s.qtyControls}>
                        <Pressable style={s.qtyBtn} onPress={() => updateItemQty(item.id, -1)} hitSlop={4}>
                          <MaterialIcons name="remove" size={14} color={theme.textDark} />
                        </Pressable>
                        <Text style={s.qtyText}>{item.quantity}</Text>
                        <Pressable style={s.qtyBtn} onPress={() => updateItemQty(item.id, 1)} hitSlop={4}>
                          <MaterialIcons name="add" size={14} color={theme.textDark} />
                        </Pressable>
                      </View>
                      <Pressable style={s.deleteItemBtn} onPress={() => removeItem(item.id)} hitSlop={6}>
                        <MaterialIcons name="close" size={16} color={theme.credit} />
                      </Pressable>
                    </View>
                  ))}
                  <View style={[s.itemsTotalRow, isRTL && s.rtlRow]}>
                    <Text style={[s.itemsTotalLabel, isRTL && s.rtlText]}>{t.total}</Text>
                    <Text style={[s.itemsTotalValue, isRTL && s.rtlText]}>{formatCurrency(totalFromItems)}</Text>
                  </View>
                </View>
              )}

              <View style={s.addItemsRow}>
                <Pressable
                  style={({ pressed }) => [s.addItemBigBtn, s.addItemBookBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setShowRateBookModal(true)}
                >
                  <MaterialIcons name="menu-book" size={18} color={theme.primary} />
                  <Text style={[s.addItemBigText, { color: theme.primary }]}>
                    {language === 'ur' ? 'ریٹ بک سے' : 'From Rate Book'}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.addItemBigBtn, s.addItemCustomBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setShowCustomItemModal(true)}
                >
                  <MaterialIcons name="add-photo-alternate" size={18} color="#FFF" />
                  <Text style={[s.addItemBigText, { color: '#FFF' }]}>
                    {language === 'ur' ? 'نئی چیز' : 'Add Custom'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {mode === 'amount' && (
            <View style={s.amountSection}>
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
              <View style={s.quickAmountsGrid}>
                {[100, 200, 500, 1000, 2000, 5000].map(amt => (
                  <Pressable
                    key={amt}
                    style={[s.quickAmountChip, amount === amt.toString() && s.quickAmountChipActive]}
                    onPress={() => { setAmount(amt.toString()); Haptics.selectionAsync().catch(() => {}); }}
                  >
                    <Text style={[s.quickAmountText, amount === amt.toString() && s.quickAmountTextActive]}>
                      +{amt.toLocaleString()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Text style={[s.label, isRTL && s.rtlText]}>{t.note}</Text>
          <TextInput
            style={[s.noteInput, isRTL && s.rtlText]}
            placeholder={language === 'ur' ? 'مثال: آٹا 2 بوریاں + چینی' : 'e.g. Atta 2 bags + Cheeni'}
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
            disabled={!selectedCustomer || finalAmount <= 0}
          >
            <LinearGradient
              colors={!selectedCustomer || finalAmount <= 0 ? ['#94A3B8', '#64748B'] : ['#DC2626', '#B91C1C']}
              style={s.saveBtn}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
              <Text style={s.saveBtnText}>{t.save} {formatCurrency(finalAmount)}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Customer Modal */}
      <Modal visible={showCustomerModal} transparent animationType="slide" onRequestClose={() => setShowCustomerModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <View style={[s.modalHeaderRow, isRTL && s.rtlRow]}>
              <Text style={s.modalTitle}>{t.selectCustomer}</Text>
              <Pressable onPress={() => setShowCustomerModal(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={theme.textDark} />
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
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 12 }}>
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
                  <Text style={[s.modalCustBal, c.balance > 0 ? { color: theme.credit } : { color: theme.payment }]}>
                    {formatCurrency(c.balance)}
                  </Text>
                </Pressable>
              ))}
              {filteredCustomers.length === 0 && (
                <View style={s.modalEmpty}>
                  <Text style={{ fontSize: 40 }}>😕</Text>
                  <Text style={s.modalEmptyText}>
                    {language === 'ur' ? 'کوئی گاہک نہیں' : 'No customers found'}
                  </Text>
                </View>
              )}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [s.modalNewBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { setShowCustomerModal(false); router.push('/add-customer'); }}
            >
              <MaterialIcons name="person-add" size={18} color={theme.primary} />
              <Text style={s.modalNewBtnText}>{t.newCustomer}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Rate Book Modal */}
      <Modal visible={showRateBookModal} transparent animationType="slide" onRequestClose={() => setShowRateBookModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle} />
            <View style={[s.modalHeaderRow, isRTL && s.rtlRow]}>
              <Text style={s.modalTitle}>📚 {language === 'ur' ? 'ریٹ بک' : 'Rate Book'}</Text>
              <Pressable onPress={() => setShowRateBookModal(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={theme.textDark} />
              </Pressable>
            </View>
            <View style={s.modalSearchBox}>
              <MaterialIcons name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={[s.modalSearchInput, isRTL && s.rtlText]}
                placeholder={language === 'ur' ? 'شئ تلاش' : 'Search items...'}
                value={rateBookSearch}
                onChangeText={setRateBookSearch}
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 12 }}>
              {filteredRateBook.slice(0, 60).map(item => (
                <Pressable
                  key={item.id}
                  style={[s.rateBookRow, isRTL && s.rtlRow]}
                  onPress={() => handleAddFromRateBook(item)}
                >
                  <View style={s.rateBookImg}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={s.rateBookImgPic} contentFit="cover" transition={150} />
                    ) : (
                      <Text style={{ fontSize: 20 }}>📦</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[s.rateBookName, isRTL && s.rtlText]}>{item.name}</Text>
                    <Text style={[s.rateBookMeta, isRTL && s.rtlText]}>{item.category} · /{item.unit}</Text>
                  </View>
                  <Text style={s.rateBookPrice}>{formatCurrency(item.rate)}</Text>
                  <View style={s.rateBookAdd}>
                    <MaterialIcons name="add" size={14} color="#FFF" />
                  </View>
                </Pressable>
              ))}
              {filteredRateBook.length === 0 && (
                <View style={s.modalEmpty}>
                  <Text style={{ fontSize: 40 }}>🏷️</Text>
                  <Text style={s.modalEmptyText}>
                    {language === 'ur' ? 'کوئی چیز نہیں ملی' : 'No items found'}
                  </Text>
                </View>
              )}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [s.modalNewBtn, pressed && { opacity: 0.85 }]}
              onPress={() => { setShowRateBookModal(false); setShowCustomItemModal(true); }}
            >
              <MaterialIcons name="add-circle-outline" size={18} color={theme.primary} />
              <Text style={s.modalNewBtnText}>
                {language === 'ur' ? 'نئی چیز شامل کریں' : 'Add Custom Item'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Custom Item Modal */}
      <Modal visible={showCustomItemModal} transparent animationType="slide" onRequestClose={() => setShowCustomItemModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalOverlay}>
          <View style={s.modalCard}>
            <LinearGradient colors={['#DC2626', '#B91C1C']} style={s.customItemHeader}>
              <Text style={s.customItemHeaderTitle}>
                ➕ {language === 'ur' ? 'نئی چیز شامل کریں' : 'Add Custom Item'}
              </Text>
              <Pressable onPress={() => { setShowCustomItemModal(false); resetCustomItemForm(); }} hitSlop={8}>
                <MaterialIcons name="close" size={22} color="#FFF" />
              </Pressable>
            </LinearGradient>
            <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <View style={s.ciPhotoWrap}>
                <View style={s.ciPhoto}>
                  {ciImage ? (
                    <Image source={{ uri: ciImage }} style={s.ciPhotoImg} contentFit="cover" transition={150} />
                  ) : (
                    <Text style={s.ciPhotoEmoji}>{ciEmoji}</Text>
                  )}
                </View>
                <View style={s.ciPhotoActions}>
                  <Pressable style={s.ciPhotoBtn} onPress={() => pickImage('camera')}>
                    <MaterialIcons name="camera-alt" size={16} color={theme.primary} />
                    <Text style={s.ciPhotoBtnText}>
                      {language === 'ur' ? 'کیمرہ' : 'Camera'}
                    </Text>
                  </Pressable>
                  <Pressable style={s.ciPhotoBtn} onPress={() => pickImage('gallery')}>
                    <MaterialIcons name="photo-library" size={16} color={theme.primary} />
                    <Text style={s.ciPhotoBtnText}>
                      {language === 'ur' ? 'گیلری' : 'Gallery'}
                    </Text>
                  </Pressable>
                  {ciImage && (
                    <Pressable style={[s.ciPhotoBtn, { backgroundColor: theme.creditLight }]} onPress={() => setCiImage(undefined)}>
                      <MaterialIcons name="delete-outline" size={16} color={theme.credit} />
                    </Pressable>
                  )}
                </View>
              </View>

              {!ciImage && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 8 }}>
                  {EMOJIS.map(em => (
                    <Pressable key={em} style={[s.emojiPick, ciEmoji === em && s.emojiPickActive]} onPress={() => setCiEmoji(em)}>
                      <Text style={{ fontSize: 20 }}>{em}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={[s.ciLabel, isRTL && s.rtlText]}>
                {language === 'ur' ? 'نام' : 'Item Name'}
              </Text>
              <TextInput
                style={[s.ciInput, isRTL && s.rtlText]}
                placeholder={language === 'ur' ? 'مثال: آٹا 10 کلو' : 'e.g. Atta (10kg)'}
                value={ciName}
                onChangeText={setCiName}
                placeholderTextColor={theme.textMuted}
              />

              <View style={s.ciRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.ciLabel, isRTL && s.rtlText]}>
                    {language === 'ur' ? 'ریٹ' : 'Rate (Rs.)'}
                  </Text>
                  <TextInput
                    style={[s.ciInput, s.ciInputBig, isRTL && s.rtlText]}
                    placeholder="0"
                    keyboardType="numeric"
                    value={ciRate}
                    onChangeText={setCiRate}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.ciLabel, isRTL && s.rtlText]}>
                    {language === 'ur' ? 'مقدار' : 'Quantity'}
                  </Text>
                  <TextInput
                    style={[s.ciInput, s.ciInputBig, isRTL && s.rtlText]}
                    placeholder="1"
                    keyboardType="numeric"
                    value={ciQty}
                    onChangeText={setCiQty}
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              <Text style={[s.ciLabel, isRTL && s.rtlText]}>
                {language === 'ur' ? 'یونٹ' : 'Unit'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {UNITS.map(u => (
                  <Pressable key={u} style={[s.unitPick, ciUnit === u && s.unitPickActive]} onPress={() => setCiUnit(u)}>
                    <Text style={[s.unitPickText, ciUnit === u && s.unitPickTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[s.ciLabel, { marginTop: 14 }, isRTL && s.rtlText]}>
                {language === 'ur' ? 'زمرہ' : 'Category'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {CATS.map(c => (
                  <Pressable key={c} style={[s.unitPick, ciCategory === c && s.unitPickActive]} onPress={() => setCiCategory(c)}>
                    <Text style={[s.unitPickText, ciCategory === c && s.unitPickTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {ciRate && ciQty ? (
                <View style={s.ciPreview}>
                  <Text style={s.ciPreviewLabel}>{language === 'ur' ? 'کل رقم' : 'Total'}</Text>
                  <Text style={s.ciPreviewValue}>
                    {formatCurrency((parseFloat(ciRate) || 0) * (parseFloat(ciQty) || 0))}
                  </Text>
                </View>
              ) : null}

              <View style={[s.ciSaveRow, isRTL && s.rtlRow]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.ciSaveLabel, isRTL && s.rtlText]}>
                    💾 {language === 'ur' ? 'ریٹ بک میں محفوظ کریں' : 'Save to Rate Book'}
                  </Text>
                  <Text style={[s.ciSaveSub, isRTL && s.rtlText]}>
                    {language === 'ur' ? 'اگلی بار خودکار دستیاب' : 'Available for future use'}
                  </Text>
                </View>
                <Switch
                  value={ciSaveToBook}
                  onValueChange={setCiSaveToBook}
                  trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                  thumbColor={ciSaveToBook ? theme.payment : '#94A3B8'}
                />
              </View>
            </ScrollView>

            <View style={s.ciActions}>
              <Pressable
                style={({ pressed }) => [s.ciCancelBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { setShowCustomItemModal(false); resetCustomItemForm(); }}
              >
                <Text style={s.ciCancelText}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.ciAddBtn, pressed && { opacity: 0.9 }]}
                onPress={handleAddCustomItem}
              >
                <LinearGradient colors={['#DC2626', '#B91C1C']} style={s.ciAddGrad}>
                  <MaterialIcons name="add" size={18} color="#FFF" />
                  <Text style={s.ciAddText}>{t.add}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  custAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.creditLight, alignItems: 'center', justifyContent: 'center' },
  custAvatarEmpty: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.creditLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.credit + '30', borderStyle: 'dashed' },
  custAvatarText: { fontSize: 14, fontWeight: '700', color: theme.credit },
  custName: { fontSize: 15, fontWeight: '700', color: theme.textDark },
  custPhone: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  custBalance: { fontSize: 12, color: theme.credit, fontWeight: '600', marginTop: 4 },
  custEmptyTitle: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  custEmptySub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  modeToggle: { flexDirection: 'row', backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 4, marginTop: 18 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  modeBtnActive: { backgroundColor: '#FFF' },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: theme.textMuted },
  itemsList: { backgroundColor: '#FFF', borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: theme.borderLight, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  itemImg: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  itemImgPic: { width: 40, height: 40, borderRadius: 12 },
  itemName: { fontSize: 13, fontWeight: '700', color: theme.textDark },
  itemRate: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.background, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 3 },
  qtyBtn: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 13, fontWeight: '800', color: theme.textDark, minWidth: 20, textAlign: 'center' },
  deleteItemBtn: { padding: 6, marginLeft: 4 },
  itemsTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: theme.creditLight },
  itemsTotalLabel: { fontSize: 13, fontWeight: '700', color: theme.textDark },
  itemsTotalValue: { fontSize: 18, fontWeight: '800', color: theme.credit },
  addItemsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addItemBigBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  addItemBookBtn: { backgroundColor: theme.primary + '12', borderWidth: 1.5, borderColor: theme.primary + '30' },
  addItemCustomBtn: { backgroundColor: theme.credit },
  addItemBigText: { fontSize: 13, fontWeight: '700' },
  amountSection: { marginTop: 12 },
  amountBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: theme.borderLight, height: 60 },
  currencyLabel: { fontSize: 18, fontWeight: '700', color: theme.textSecondary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: theme.textDark },
  quickAmountsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  quickAmountChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: theme.borderLight },
  quickAmountChipActive: { backgroundColor: theme.credit, borderColor: theme.credit },
  quickAmountText: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },
  quickAmountTextActive: { color: '#FFF' },
  noteInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: theme.borderLight, fontSize: 14, color: theme.textDark, minHeight: 70, textAlignVertical: 'top' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: theme.borderLight },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  modalHandle: { width: 40, height: 4, backgroundColor: theme.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: theme.textDark },
  modalSearchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  modalSearchInput: { flex: 1, fontSize: 14, color: theme.textDark },
  modalCustRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  modalCustRowActive: { backgroundColor: theme.creditLight },
  modalCustAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  modalCustAvatarText: { fontSize: 13, fontWeight: '700', color: theme.primary },
  modalCustName: { fontSize: 14, fontWeight: '700', color: theme.textDark },
  modalCustPhone: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  modalCustBal: { fontSize: 13, fontWeight: '800' },
  modalEmpty: { alignItems: 'center', paddingVertical: 40 },
  modalEmptyText: { fontSize: 14, color: theme.textMuted, marginTop: 8 },
  modalNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 20, marginVertical: 12, paddingVertical: 13, borderRadius: 12, backgroundColor: theme.primary + '12', borderWidth: 1.5, borderColor: theme.primary + '30', borderStyle: 'dashed' },
  modalNewBtnText: { fontSize: 13, fontWeight: '800', color: theme.primary },
  rateBookRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  rateBookImg: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  rateBookImgPic: { width: 40, height: 40, borderRadius: 12 },
  rateBookName: { fontSize: 13, fontWeight: '700', color: theme.textDark },
  rateBookMeta: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  rateBookPrice: { fontSize: 13, fontWeight: '800', color: theme.payment },
  rateBookAdd: { width: 26, height: 26, borderRadius: 8, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  customItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  customItemHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  ciPhotoWrap: { alignItems: 'center', marginBottom: 8 },
  ciPhoto: { width: 90, height: 90, borderRadius: 24, backgroundColor: theme.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.credit + '30' },
  ciPhotoImg: { width: 90, height: 90, borderRadius: 24 },
  ciPhotoEmoji: { fontSize: 40 },
  ciPhotoActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ciPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.primary + '12', borderWidth: 1, borderColor: theme.primary + '25' },
  ciPhotoBtnText: { fontSize: 12, fontWeight: '700', color: theme.primary },
  emojiPick: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: theme.borderLight },
  emojiPickActive: { backgroundColor: theme.primary + '20', borderColor: theme.primary },
  ciLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  ciInput: { backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.textDark, borderWidth: 1.5, borderColor: theme.borderLight, fontWeight: '600' },
  ciInputBig: { fontSize: 20, fontWeight: '800', color: theme.credit, textAlign: 'center' },
  ciRow: { flexDirection: 'row', marginTop: 4 },
  unitPick: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.borderLight },
  unitPickActive: { backgroundColor: theme.primary + '15', borderColor: theme.primary },
  unitPickText: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
  unitPickTextActive: { color: theme.primary },
  ciPreview: { backgroundColor: theme.creditLight, borderRadius: 12, padding: 12, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ciPreviewLabel: { fontSize: 12, fontWeight: '700', color: theme.credit },
  ciPreviewValue: { fontSize: 18, fontWeight: '800', color: theme.credit },
  ciSaveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: theme.background, borderRadius: 12 },
  ciSaveLabel: { fontSize: 13, fontWeight: '700', color: theme.textDark },
  ciSaveSub: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  ciActions: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: theme.borderLight },
  ciCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.background, alignItems: 'center', borderWidth: 1, borderColor: theme.borderLight },
  ciCancelText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  ciAddBtn: { flex: 1.5, borderRadius: 12, overflow: 'hidden' },
  ciAddGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  ciAddText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
