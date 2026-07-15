import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';

const GROUPS = [
  { id: 'regular', label: 'Regular', labelUr: 'باقاعدہ', color: '#0D7C4A', emoji: '🏪' },
  { id: 'wholesale', label: 'Wholesale', labelUr: 'ہول سیل', color: '#2563EB', emoji: '📦' },
  { id: 'vip', label: 'VIP', labelUr: 'وی آئی پی', color: '#B45309', emoji: '⭐' },
  { id: 'family', label: 'Family', labelUr: 'خاندان', color: '#BE185D', emoji: '👪' },
  { id: 'staff', label: 'Staff', labelUr: 'عملہ', color: '#7C3AED', emoji: '👤' },
];

const AVATAR_COLORS = ['#0D7C4A', '#DC2626', '#2563EB', '#7C3AED', '#B45309', '#BE185D', '#0891B2'];

export default function AddCustomerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addCustomer, t, language, isRTL, currentTheme, formatCurrency } = useApp();
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [group, setGroup] = useState('regular');
  const [photo, setPhoto] = useState<string | undefined>();
  const [avatarColorIdx, setAvatarColorIdx] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = name.trim()
    ? name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    setShowPhotoModal(false);
    try {
      const perm = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert(t.error, language === 'ur' ? 'اجازت درکار ہے' : 'Permission required');
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.7,
          });
      if (!result.canceled && result.assets?.[0]) {
        setPhoto(result.assets[0].uri);
        Haptics.selectionAsync().catch(() => {});
      }
    } catch (err: any) {
      showAlert(t.error, err?.message || 'Unable to pick photo');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showAlert(t.error, language === 'ur' ? 'گاہک کا نام لازمی ہے' : 'Customer name is required');
      return;
    }
    setSaving(true);
    const openingBal = parseFloat(openingBalance) || 0;
    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      // extended fields via type cast
      ...(email.trim() && { email: email.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(creditLimit && { creditLimit: parseFloat(creditLimit) }),
      ...(photo && { photo }),
      group,
      avatarColor: AVATAR_COLORS[avatarColorIdx],
    } as any);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showAlert(
      language === 'ur' ? 'کامیاب' : 'Success',
      language === 'ur' ? `${name} شامل ہو گیا` : `${name} added successfully`,
    );
    setTimeout(() => router.back(), 400);
  };

  const selectedGroup = GROUPS.find(g => g.id === group)!;

  return (
    <SafeAreaView edges={['top']} style={[s.container, { backgroundColor: currentTheme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient colors={currentTheme.primaryGradient as any} style={s.header}>
          <View style={[s.headerRow, isRTL && s.rtlRow]}>
            <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color="#FFF" />
            </Pressable>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>➕ {t.addCustomer}</Text>
              <Text style={s.headerSubtitle}>
                {language === 'ur' ? 'نئے گاہک کی تفصیلات' : 'Enter customer details'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Photo/Avatar Preview */}
          <View style={s.avatarSection}>
            <Pressable onPress={() => setShowPhotoModal(true)}>
              <View style={[s.avatarRing, { borderColor: photo ? '#FFD700' : 'rgba(255,255,255,0.35)' }]}>
                {photo ? (
                  <Image source={{ uri: photo }} style={s.avatarImg} contentFit="cover" transition={200} />
                ) : (
                  <View style={[s.avatarCircle, { backgroundColor: AVATAR_COLORS[avatarColorIdx] }]}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={s.avatarCam}>
                <MaterialIcons name={photo ? 'edit' : 'camera-alt'} size={16} color="#FFF" />
              </View>
            </Pressable>
            <Text style={s.avatarHint}>
              {language === 'ur' ? '📷 تصویر منتخب کریں' : '📷 Tap to add photo'}
            </Text>
            {!photo && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, marginTop: 10 }}>
                {AVATAR_COLORS.map((c, i) => (
                  <Pressable
                    key={c}
                    style={[s.colorDot, { backgroundColor: c }, avatarColorIdx === i && s.colorDotActive]}
                    onPress={() => { setAvatarColorIdx(i); Haptics.selectionAsync().catch(() => {}); }}
                  >
                    {avatarColorIdx === i && <MaterialIcons name="check" size={12} color="#FFF" />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info Card */}
          <View style={s.card}>
            <View style={[s.cardHead, isRTL && s.rtlRow]}>
              <View style={[s.cardIcon, { backgroundColor: currentTheme.primary + '15' }]}>
                <MaterialIcons name="person" size={16} color={currentTheme.primary} />
              </View>
              <Text style={[s.cardTitle, isRTL && s.rtlText]}>
                {language === 'ur' ? 'بنیادی معلومات' : 'Basic Information'}
              </Text>
              <View style={s.reqBadge}>
                <Text style={s.reqText}>{language === 'ur' ? 'لازمی' : 'Required'}</Text>
              </View>
            </View>

            <Text style={[s.label, isRTL && s.rtlText]}>
              {t.name} <Text style={{ color: currentTheme.credit }}>*</Text>
            </Text>
            <View style={s.inputBox}>
              <MaterialIcons name="person-outline" size={18} color={currentTheme.textMuted} />
              <TextInput
                style={[s.input, isRTL && s.rtlText]}
                placeholder={language === 'ur' ? 'مثلاً احمد خان' : 'e.g. Ahmed Khan'}
                value={name}
                onChangeText={setName}
                autoFocus
                placeholderTextColor={currentTheme.textMuted}
              />
            </View>

            <Text style={[s.label, isRTL && s.rtlText]}>{t.phone}</Text>
            <View style={s.inputBox}>
              <MaterialIcons name="phone" size={18} color={currentTheme.textMuted} />
              <TextInput
                style={[s.input, isRTL && s.rtlText]}
                placeholder="0300-1234567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={currentTheme.textMuted}
              />
              {phone.length >= 10 && (
                <MaterialIcons name="check-circle" size={16} color={currentTheme.payment} />
              )}
            </View>

            <Text style={[s.label, isRTL && s.rtlText]}>
              {language === 'ur' ? 'ای میل (اختیاری)' : 'Email (optional)'}
            </Text>
            <View style={s.inputBox}>
              <MaterialIcons name="email" size={18} color={currentTheme.textMuted} />
              <TextInput
                style={[s.input, isRTL && s.rtlText]}
                placeholder="customer@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={currentTheme.textMuted}
              />
            </View>

            <Text style={[s.label, isRTL && s.rtlText]}>{t.address}</Text>
            <View style={[s.inputBox, { alignItems: 'flex-start', minHeight: 70 }]}>
              <MaterialIcons name="location-on" size={18} color={currentTheme.textMuted} style={{ marginTop: 12 }} />
              <TextInput
                style={[s.input, isRTL && s.rtlText, { minHeight: 60, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder={language === 'ur' ? 'دکان کا پتہ' : 'Shop 12, Anarkali Bazaar'}
                value={address}
                onChangeText={setAddress}
                multiline
                placeholderTextColor={currentTheme.textMuted}
              />
            </View>
          </View>

          {/* Group Card */}
          <View style={s.card}>
            <View style={[s.cardHead, isRTL && s.rtlRow]}>
              <View style={[s.cardIcon, { backgroundColor: selectedGroup.color + '15' }]}>
                <MaterialIcons name="category" size={16} color={selectedGroup.color} />
              </View>
              <Text style={[s.cardTitle, isRTL && s.rtlText]}>
                {language === 'ur' ? 'زمرہ' : 'Customer Group'}
              </Text>
            </View>
            <View style={s.groupsGrid}>
              {GROUPS.map(g => {
                const active = group === g.id;
                return (
                  <Pressable
                    key={g.id}
                    style={[s.groupChip, active && { backgroundColor: g.color, borderColor: g.color }]}
                    onPress={() => { setGroup(g.id); Haptics.selectionAsync().catch(() => {}); }}
                  >
                    <Text style={s.groupEmoji}>{g.emoji}</Text>
                    <Text style={[s.groupText, active && { color: '#FFF' }]}>
                      {language === 'ur' ? g.labelUr : g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Financial Card */}
          <View style={s.card}>
            <View style={[s.cardHead, isRTL && s.rtlRow]}>
              <View style={[s.cardIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="account-balance-wallet" size={16} color="#D97706" />
              </View>
              <Text style={[s.cardTitle, isRTL && s.rtlText]}>
                {language === 'ur' ? 'مالیاتی حد' : 'Financial Limits'}
              </Text>
              <View style={[s.reqBadge, { backgroundColor: currentTheme.backgroundSecondary }]}>
                <Text style={[s.reqText, { color: currentTheme.textMuted }]}>
                  {language === 'ur' ? 'اختیاری' : 'Optional'}
                </Text>
              </View>
            </View>

            <Text style={[s.label, isRTL && s.rtlText]}>
              {t.creditLimit} (₹)
            </Text>
            <View style={s.inputBox}>
              <Text style={s.currSym}>Rs.</Text>
              <TextInput
                style={[s.input, isRTL && s.rtlText]}
                placeholder="10,000"
                value={creditLimit}
                onChangeText={setCreditLimit}
                keyboardType="numeric"
                placeholderTextColor={currentTheme.textMuted}
              />
              {creditLimit ? (
                <Text style={s.helperText}>
                  {formatCurrency(parseFloat(creditLimit) || 0)}
                </Text>
              ) : null}
            </View>

            <Text style={[s.label, isRTL && s.rtlText]}>
              {language === 'ur' ? 'ابتدائی بقایا (اگر کوئی ہو)' : 'Opening Balance (if any)'}
            </Text>
            <View style={s.inputBox}>
              <MaterialIcons name="north-east" size={18} color={currentTheme.credit} />
              <TextInput
                style={[s.input, isRTL && s.rtlText]}
                placeholder="0"
                value={openingBalance}
                onChangeText={setOpeningBalance}
                keyboardType="numeric"
                placeholderTextColor={currentTheme.textMuted}
              />
            </View>
            {openingBalance && parseFloat(openingBalance) > 0 ? (
              <View style={s.infoBox}>
                <MaterialIcons name="info-outline" size={12} color="#1E40AF" />
                <Text style={s.infoText}>
                  {language === 'ur'
                    ? 'یہ رقم بطور ابتدائی ادھار درج ہو گی'
                    : 'This will be recorded as opening credit'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Notes Card */}
          <View style={s.card}>
            <View style={[s.cardHead, isRTL && s.rtlRow]}>
              <View style={[s.cardIcon, { backgroundColor: '#F3E8FF' }]}>
                <MaterialIcons name="notes" size={16} color="#7C3AED" />
              </View>
              <Text style={[s.cardTitle, isRTL && s.rtlText]}>
                {language === 'ur' ? 'اضافی نوٹس' : 'Additional Notes'}
              </Text>
            </View>
            <TextInput
              style={[s.noteInput, isRTL && s.rtlText]}
              placeholder={language === 'ur'
                ? 'مثلاً: ماہانہ ادائیگی کرتا ہے، خاص گاہک'
                : 'e.g. Pays monthly, regular customer, prefers cash'}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={currentTheme.textMuted}
            />
          </View>
        </ScrollView>

        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: currentTheme.borderLight }]}>
          <Pressable
            style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleSave}
            disabled={!name.trim() || saving}
          >
            <LinearGradient
              colors={!name.trim() ? ['#94A3B8', '#64748B'] : (currentTheme.primaryGradient as any)}
              style={s.saveBtn}
            >
              <MaterialIcons name={saving ? 'hourglass-empty' : 'person-add'} size={20} color="#FFF" />
              <Text style={s.saveBtnText}>
                {saving
                  ? (language === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                  : (language === 'ur' ? 'گاہک محفوظ کریں' : 'Save Customer')}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Photo Picker Modal */}
      <Modal visible={showPhotoModal} transparent animationType="fade" onRequestClose={() => setShowPhotoModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowPhotoModal(false)}>
          <Pressable style={s.photoModal}>
            <View style={s.photoModalHandle} />
            <Text style={s.photoModalTitle}>
              📷 {language === 'ur' ? 'تصویر شامل کریں' : 'Add Photo'}
            </Text>
            <View style={s.photoOptions}>
              <Pressable style={s.photoOpt} onPress={() => pickPhoto('camera')}>
                <LinearGradient colors={['#DBEAFE', '#BFDBFE']} style={s.photoOptIcon}>
                  <MaterialIcons name="camera-alt" size={26} color="#2563EB" />
                </LinearGradient>
                <Text style={s.photoOptText}>{language === 'ur' ? 'کیمرہ' : 'Camera'}</Text>
                <Text style={s.photoOptSub}>{language === 'ur' ? 'نئی تصویر' : 'Take a photo'}</Text>
              </Pressable>
              <Pressable style={s.photoOpt} onPress={() => pickPhoto('gallery')}>
                <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={s.photoOptIcon}>
                  <MaterialIcons name="photo-library" size={26} color="#16A34A" />
                </LinearGradient>
                <Text style={s.photoOptText}>{language === 'ur' ? 'گیلری' : 'Gallery'}</Text>
                <Text style={s.photoOptSub}>{language === 'ur' ? 'محفوظ تصویر' : 'From album'}</Text>
              </Pressable>
              {photo && (
                <Pressable style={s.photoOpt} onPress={() => { setPhoto(undefined); setShowPhotoModal(false); }}>
                  <LinearGradient colors={['#FEE2E2', '#FECACA']} style={s.photoOptIcon}>
                    <MaterialIcons name="delete-outline" size={26} color="#DC2626" />
                  </LinearGradient>
                  <Text style={s.photoOptText}>{language === 'ur' ? 'ہٹائیں' : 'Remove'}</Text>
                  <Text style={s.photoOptSub}>{language === 'ur' ? 'تصویر ہٹائیں' : 'Delete photo'}</Text>
                </Pressable>
              )}
            </View>
            <Pressable style={s.photoCancel} onPress={() => setShowPhotoModal(false)}>
              <Text style={s.photoCancelText}>{t.cancel}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  header: {
    paddingTop: 6, paddingBottom: 24, paddingHorizontal: 12,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '500' },

  avatarSection: { alignItems: 'center', marginTop: 18 },
  avatarRing: {
    padding: 4, borderRadius: 70, borderWidth: 3,
  },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 38, fontWeight: '800', color: '#FFF' },
  avatarCam: {
    position: 'absolute', bottom: 4, right: 4,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0D7C4A',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFF',
  },
  avatarHint: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 10 },
  colorDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  colorDotActive: { borderColor: '#FFF', transform: [{ scale: 1.15 }] },

  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }, default: {},
    }),
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  reqBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  reqText: { fontSize: 10, fontWeight: '800', color: '#DC2626', textTransform: 'uppercase' },

  label: { fontSize: 11, fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 12, height: 48,
    borderWidth: 1.5, borderColor: '#F1F5F9',
  },
  input: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },
  currSym: { fontSize: 15, fontWeight: '800', color: '#4B5563' },
  helperText: { fontSize: 11, fontWeight: '700', color: '#0D7C4A' },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, padding: 8, backgroundColor: '#EFF6FF',
    borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 11, color: '#1E40AF', fontWeight: '600' },
  noteInput: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#F1F5F9',
    fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top',
  },

  groupsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 22, backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#F1F5F9',
  },
  groupEmoji: { fontSize: 15 },
  groupText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },

  bottomBar: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 14,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  photoModal: {
    backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 40,
  },
  photoModalHandle: {
    width: 40, height: 4, backgroundColor: '#E2E8F0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  photoModalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 20 },
  photoOptions: { flexDirection: 'row', gap: 10 },
  photoOpt: { flex: 1, alignItems: 'center', padding: 14, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  photoOptIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  photoOptText: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 10 },
  photoOptSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  photoCancel: { marginTop: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  photoCancelText: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
});
