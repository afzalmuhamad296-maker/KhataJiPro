import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Switch, Platform, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAlert } from '@/template';

const THEMES = [
  { id: 'green', color: '#0D7C4A', label: 'Green', labelUr: 'سبز' },
  { id: 'gold', color: '#B8860B', label: 'Gold', labelUr: 'سنہری' },
  { id: 'blue', color: '#1565C0', label: 'Blue', labelUr: 'نیلا' },
  { id: 'black', color: '#1A1A2E', label: 'Black', labelUr: 'سیاہ' },
  { id: 'desert', color: '#C2956B', label: 'Desert', labelUr: 'صحرا' },
] as const;

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', native: 'پنجابی', dir: 'rtl' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', dir: 'rtl' },
  { code: 'ps', name: 'Pashto', native: 'پښتو', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'fa', name: 'Persian', native: 'فارسی', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', native: '中文', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', native: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', native: '한국어', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', native: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Spanish', native: 'Español', dir: 'ltr' },
];

const CURRENCIES = [
  { code: 'PKR', symbol: 'Rs.', name: 'PK Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'GB Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

const RECEIPT_TEMPLATES = [
  { id: 'simple', label: 'Simple', labelUr: 'سادہ', icon: 'receipt' },
  { id: 'modern', label: 'Modern', labelUr: 'جدید', icon: 'auto-awesome' },
  { id: 'premium', label: 'Premium', labelUr: 'پریمیم', icon: 'diamond' },
  { id: 'islamic', label: 'Islamic', labelUr: 'اسلامی', icon: 'mosque' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    settings, language, t, isRTL, themeColor, darkMode, fontSize, urduNumbers, customLanguages,
    updateSettings, setLanguage, setThemeColor, setDarkMode, setFontSize, setUrduNumbers,
    addCustomLanguage,
  } = useApp();
  const { showAlert } = useAlert();

  // Profile
  const [profileName, setProfileName] = useState(settings.ownerName);
  const [profilePhone, setProfilePhone] = useState(settings.phone);
  const [profileAddress, setProfileAddress] = useState(settings.address || 'Lahore, Pakistan');

  // Language
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'>('DD/MM/YYYY');
  const [selectedCurrency, setSelectedCurrency] = useState(0);
  const [symbolPosition, setSymbolPosition] = useState<'before' | 'after'>('before');
  const [showCustomLangModal, setShowCustomLangModal] = useState(false);

  // Custom language form
  const [clName, setClName] = useState('');
  const [clNative, setClNative] = useState('');
  const [clDirection, setClDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [clProgress, setClProgress] = useState(0);

  // Security
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [autoLock, setAutoLock] = useState('5min');
  const [twoFAThreshold, setTwoFAThreshold] = useState('10000');

  // Notifications
  const [smsToggle, setSmsToggle] = useState(settings.smsReminders);
  const [smsTemplate, setSmsTemplate] = useState(
    language === 'ur'
      ? 'السلام علیکم {name}، {shop} پر آپ کا بقایا {amount} روپے ہے۔ براہ کرم جلد ادائیگی کریں۔'
      : 'Assalam o Alaikum {name}, your balance at {shop} is Rs.{amount}. Kindly pay soon.'
  );
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [paymentNotif, setPaymentNotif] = useState(true);
  const [festivalNotif, setFestivalNotif] = useState(true);
  const [birthdayNotif, setBirthdayNotif] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Data
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFreq, setBackupFreq] = useState('daily');
  const [wifiOnly, setWifiOnly] = useState(true);
  const [lastBackup] = useState('2026-05-28 14:32');
  const storageUsed = 45; // KB
  const storageMax = 5120; // 5MB
  const storagePercent = (storageUsed / storageMax) * 100;

  // Business
  const [dailyGoal, setDailyGoal] = useState('20000');
  const [creditLimit, setCreditLimit] = useState('10000');
  const [shopOpen, setShopOpen] = useState('09:00');
  const [shopClose, setShopClose] = useState('21:00');
  const [taxRate, setTaxRate] = useState('17');
  const [discountRate, setDiscountRate] = useState('5');

  // Print
  const [receiptTemplate, setReceiptTemplate] = useState('modern');
  const [invoiceFooter, setInvoiceFooter] = useState(
    language === 'ur' ? 'آپ کے کاروبار کا شکریہ! - ' + settings.shopName : 'Thank you for your business! - ' + settings.shopName
  );
  const [shareWA, setShareWA] = useState(true);
  const [shareSMS, setShareSMS] = useState(true);
  const [shareEmail, setShareEmail] = useState(false);
  const [shareCopy, setShareCopy] = useState(true);

  // Dashboard
  const [defaultScreen, setDefaultScreen] = useState('dashboard');
  const [showHealth, setShowHealth] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showGoal, setShowGoal] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showCustomers, setShowCustomers] = useState(true);
  const [showTop, setShowTop] = useState(true);

  const handleSaveProfile = () => {
    updateSettings({ ownerName: profileName, phone: profilePhone, address: profileAddress });
    showAlert(t.success, language === 'ur' ? 'پروفائل محفوظ ہو گیا' : 'Profile saved successfully');
  };

  const handleBackup = () => {
    showAlert(t.backupNow, language === 'ur' ? 'بیک اپ کامیاب' : 'Backup created successfully\n' + new Date().toLocaleString());
  };

  const handleClearCache = () => {
    showAlert(t.clearCache, language === 'ur' ? 'کیشے صاف ہو گیا (2.4 MB)' : 'Cache cleared (2.4 MB freed)');
  };

  const handleClearAll = () => {
    showAlert(
      t.clearAll,
      language === 'ur' ? 'تمام ڈیٹا حذف ہو جائے گا۔ کیا آپ یقین رکھتے ہیں؟' : 'This will permanently delete all data',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: 'DELETE', style: 'destructive', onPress: () => {
            showAlert(t.confirmDelete, language === 'ur' ? 'آخری تصدیق' : 'Final confirmation', [
              { text: t.cancel, style: 'cancel' },
              { text: 'Yes', style: 'destructive', onPress: () => showAlert(t.success, language === 'ur' ? 'ڈیٹا صاف ہو گیا' : 'Data cleared') },
            ]);
          }
        },
      ]
    );
  };

  const handleExport = (type: string) => {
    showAlert(t.exportData, `${type} ${language === 'ur' ? 'فائل تیار' : 'file generated'}`);
  };

  const handleAddCustomLang = () => {
    if (!clName || !clNative) {
      showAlert(t.error, language === 'ur' ? 'نام اور مقامی نام لازمی ہیں' : 'Name and native name required');
      return;
    }
    // Simulate translation progress
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setClProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        addCustomLanguage({
          id: Date.now().toString(),
          name: clName,
          nativeName: clNative,
          direction: clDirection,
          translations: {},
        });
        setClName('');
        setClNative('');
        setClDirection('ltr');
        setClProgress(0);
        setShowCustomLangModal(false);
        showAlert(t.success, language === 'ur' ? 'زبان شامل ہو گئی' : 'Language added');
      }
    }, 50);
  };

  const handleExportLangJson = () => {
    showAlert(t.exportJson, language === 'ur' ? 'JSON فائل ڈاؤن لوڈ' : 'JSON file downloaded');
  };

  const handleImportLangJson = () => {
    showAlert(t.importJson, language === 'ur' ? 'فائل منتخب کریں' : 'Select JSON file');
  };

  const SectionHeader = ({ icon, title, color, emoji }: { icon: string; title: string; color: string; emoji?: string }) => (
    <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
        {emoji ? emoji + ' ' : ''}{title}
      </Text>
    </View>
  );

  const ToggleRow = ({ label, subtitle, value, onValueChange }: { label: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void }) => (
    <View style={[styles.toggleRow, isRTL && styles.rtlRow]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleLabel, isRTL && styles.rtlText]}>{label}</Text>
        {subtitle ? <Text style={[styles.toggleSubtitle, isRTL && styles.rtlText]}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
        thumbColor={value ? theme.payment : '#94A3B8'}
        ios_backgroundColor="#E2E8F0"
      />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Glass Header */}
      <LinearGradient
        colors={['rgba(13,124,74,0.08)', 'rgba(13,124,74,0.02)']}
        style={styles.glassHeader}
      >
        <View style={[styles.headerInner, isRTL && styles.rtlRow]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBack}>
            <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={theme.textDark} />
          </Pressable>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
            ⚙️ {t.settings}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.planBadge, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/plans')}
          >
            <MaterialIcons name="workspace-premium" size={12} color="#B45309" />
            <Text style={styles.planText}>{t.free.toUpperCase()}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== 1. PROFILE ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="👤" icon="person" title={t.profile} color="#7C3AED" />

          <View style={[styles.profilePhotoRow, isRTL && styles.rtlRow]}>
            <View style={styles.profilePhotoBorder}>
              <LinearGradient colors={['#0D7C4A', '#FFD700', '#0D7C4A']} style={styles.profilePhotoGradientBorder}>
                <View style={styles.profilePhoto}>
                  <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.profilePhotoInner}>
                    <MaterialIcons name="store" size={36} color="#FFF" />
                  </LinearGradient>
                </View>
              </LinearGradient>
              <Pressable style={styles.cameraIcon} hitSlop={4}>
                <MaterialIcons name="camera-alt" size={14} color="#FFF" />
              </Pressable>
            </View>
            <View style={{ flex: 1, marginHorizontal: 16 }}>
              <Text style={[styles.profileShopName, isRTL && styles.rtlText]}>{settings.shopName}</Text>
              <Text style={[styles.profileSubtext, isRTL && styles.rtlText]}>{t.tapPhotoChange}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.name}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText]}
              value={profileName}
              onChangeText={setProfileName}
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.phone}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText]}
              value={profilePhone}
              onChangeText={setProfilePhone}
              keyboardType="phone-pad"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.address}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText]}
              value={profileAddress}
              onChangeText={setProfileAddress}
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <Pressable
            style={({ pressed }) => [{ borderRadius: 14, overflow: 'hidden' }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleSaveProfile}
          >
            <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.saveBtn}>
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
              <Text style={styles.saveBtnText}>{t.saveProfile}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ===== 2. APPEARANCE ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🎨" icon="palette" title={t.appearance} color="#D97706" />

          <Text style={[styles.subLabel, isRTL && styles.rtlText]}>{t.themeColor}</Text>
          <View style={styles.themeRow}>
            {THEMES.map(th => (
              <Pressable
                key={th.id}
                style={[styles.themeCircle, { backgroundColor: th.color }, themeColor === th.id && styles.themeCircleActive]}
                onPress={() => setThemeColor(th.id as any)}
              >
                {themeColor === th.id ? <MaterialIcons name="check" size={20} color="#FFF" /> : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          <ToggleRow
            label={t.darkMode}
            subtitle={language === 'ur' ? 'شام 6 بجے خودکار' : 'Auto switches at 6 PM'}
            value={darkMode}
            onValueChange={setDarkMode}
          />

          <Text style={[styles.subLabel, { marginTop: 16 }, isRTL && styles.rtlText]}>{t.fontSize}</Text>
          <View style={styles.segmentControl}>
            {(['small', 'medium', 'large'] as const).map(size => (
              <Pressable
                key={size}
                style={[styles.segmentBtn, fontSize === size && styles.segmentBtnActive]}
                onPress={() => setFontSize(size)}
              >
                <Text style={[
                  styles.segmentText,
                  { fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16 },
                  fontSize === size && styles.segmentTextActive,
                ]}>
                  A
                </Text>
                <Text style={[styles.segmentLabel, fontSize === size && styles.segmentTextActive]}>
                  {t[size as 'small' | 'medium' | 'large']}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ===== 3. LANGUAGE ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🌐" icon="translate" title={t.language} color="#2563EB" />

          <Text style={[styles.subLabel, isRTL && styles.rtlText]}>{t.appLanguage}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LANGUAGES.slice(0, 10).map((lang) => {
              const isSelected = lang.code === language;
              const supportedCodes = ['en', 'ur', 'hi', 'pa', 'sd', 'ps', 'ar', 'fa'];
              const isBuiltIn = supportedCodes.includes(lang.code);
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.langCard, isSelected && styles.langCardActive]}
                  onPress={() => {
                    if (isBuiltIn) {
                      setLanguage(lang.code as any);
                      Platform.OS !== 'web' && showAlert(t.success, `${lang.native} ${language === 'ur' ? 'فعال' : 'activated'}`);
                    } else {
                      showAlert(t.language, `${lang.name} ${language === 'ur' ? 'جلد دستیاب - Custom Language استعمال کریں' : 'coming soon - Use Custom Language feature'}`);
                    }
                  }}
                >
                  <Text style={[styles.langCardNative, isSelected && styles.langCardNativeActive]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langCardName, isSelected && styles.langCardNameActive]}>
                    {lang.name}
                  </Text>
                  {lang.dir === 'rtl' ? (
                    <View style={styles.rtlBadge}>
                      <Text style={styles.rtlBadgeText}>RTL</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Add Custom Language */}
          <Pressable
            style={({ pressed }) => [styles.addCustomBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setShowCustomLangModal(true)}
          >
            <MaterialIcons name="add-circle-outline" size={18} color={theme.primary} />
            <Text style={styles.addCustomText}>➕ {t.addCustom}</Text>
          </Pressable>

          {customLanguages.length > 0 ? (
            <View style={styles.customLangsList}>
              {customLanguages.map(cl => (
                <View key={cl.id} style={styles.customLangItem}>
                  <Text style={styles.customLangName}>{cl.nativeName} • {cl.name}</Text>
                  <View style={styles.langActionsRow}>
                    <Pressable onPress={handleExportLangJson} hitSlop={6}>
                      <MaterialIcons name="file-download" size={16} color={theme.primary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Date Format */}
          <Text style={[styles.subLabel, { marginTop: 16 }, isRTL && styles.rtlText]}>{t.dateFormat}</Text>
          <View style={styles.radioRow}>
            {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
              <Pressable key={fmt} style={[styles.radioChip, dateFormat === fmt && styles.radioChipActive]} onPress={() => setDateFormat(fmt)}>
                <Text style={[styles.radioText, dateFormat === fmt && styles.radioTextActive]}>{fmt}</Text>
              </Pressable>
            ))}
          </View>

          {/* Currency */}
          <Text style={[styles.subLabel, { marginTop: 16 }, isRTL && styles.rtlText]}>{t.currency}</Text>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map((cur, i) => (
              <Pressable key={cur.code} style={[styles.currencyChip, selectedCurrency === i && styles.currencyChipActive]} onPress={() => setSelectedCurrency(i)}>
                <Text style={[styles.currencySymbol, selectedCurrency === i && styles.currencyTextActive]}>{cur.symbol}</Text>
                <Text style={[styles.currencyText, selectedCurrency === i && styles.currencyTextActive]}>{cur.code}</Text>
              </Pressable>
            ))}
          </View>

          {/* Symbol Position */}
          <Text style={[styles.subLabel, { marginTop: 16 }, isRTL && styles.rtlText]}>{t.symbolPosition}</Text>
          <View style={styles.radioRow}>
            <Pressable style={[styles.radioChip, symbolPosition === 'before' && styles.radioChipActive]} onPress={() => setSymbolPosition('before')}>
              <Text style={[styles.radioText, symbolPosition === 'before' && styles.radioTextActive]}>Rs. 100</Text>
            </Pressable>
            <Pressable style={[styles.radioChip, symbolPosition === 'after' && styles.radioChipActive]} onPress={() => setSymbolPosition('after')}>
              <Text style={[styles.radioText, symbolPosition === 'after' && styles.radioTextActive]}>100 Rs.</Text>
            </Pressable>
          </View>

          {/* Urdu Numerals (only if Urdu) */}
          {language === 'ur' ? (
            <>
              <View style={styles.divider} />
              <ToggleRow
                label={t.urduNumerals}
                subtitle="۱۲۳ → 123"
                value={urduNumbers}
                onValueChange={setUrduNumbers}
              />
            </>
          ) : null}
        </View>

        {/* ===== 4. SECURITY ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🔒" icon="lock" title={t.security} color="#DC2626" />

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: theme.borderLight }, isRTL && styles.rtlRow]}
            onPress={() => router.push('/app-lock')}
          >
            <View style={[styles.actionRowLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="pin" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.actionRowText, isRTL && styles.rtlText]}>{t.changePin}</Text>
            </View>
            <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={theme.textMuted} />
          </Pressable>

          <ToggleRow
            label={t.twoFA}
            subtitle={language === 'ur' ? 'بڑی رقم پر تصدیق' : 'For large amounts'}
            value={twoFA}
            onValueChange={setTwoFA}
          />
          {twoFA ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>
                {language === 'ur' ? '2FA حد (₹)' : '2FA Threshold (₹)'}
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.rtlText]}
                value={twoFAThreshold}
                onChangeText={setTwoFAThreshold}
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          ) : null}

          <ToggleRow
            label={t.biometric}
            subtitle="Face ID / Fingerprint"
            value={biometric}
            onValueChange={setBiometric}
          />

          <Text style={[styles.subLabel, { marginTop: 12 }, isRTL && styles.rtlText]}>{t.autoLock}</Text>
          <View style={styles.radioRow}>
            {[
              { k: '1min', l: '1 min' },
              { k: '5min', l: '5 min' },
              { k: '15min', l: '15 min' },
              { k: '30min', l: '30 min' },
              { k: 'never', l: t.never },
            ].map(opt => (
              <Pressable key={opt.k} style={[styles.radioChip, autoLock === opt.k && styles.radioChipActive]} onPress={() => setAutoLock(opt.k)}>
                <Text style={[styles.radioText, autoLock === opt.k && styles.radioTextActive]}>{opt.l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ===== 5. NOTIFICATIONS ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🔔" icon="notifications" title={t.notifications} color="#F59E0B" />

          <ToggleRow
            label={t.smsReminders}
            subtitle={language === 'ur' ? 'بقایا کی یاد دہانی' : 'Auto-send balance reminders'}
            value={smsToggle}
            onValueChange={(v) => { setSmsToggle(v); updateSettings({ smsReminders: v }); }}
          />
          {smsToggle ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.smsTemplate}</Text>
              <TextInput
                style={[styles.input, styles.textArea, isRTL && styles.rtlText]}
                value={smsTemplate}
                onChangeText={setSmsTemplate}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.textMuted}
              />
              <View style={styles.varRow}>
                {['{name}', '{amount}', '{balance}', '{shop}'].map(v => (
                  <View key={v} style={styles.varChip}>
                    <Text style={styles.varText}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <ToggleRow
            label={t.dailyReminder}
            subtitle={`${language === 'ur' ? 'روزانہ' : 'Every day at'} ${reminderTime}`}
            value={dailyReminder}
            onValueChange={setDailyReminder}
          />
          <ToggleRow label={t.paymentNotif} value={paymentNotif} onValueChange={setPaymentNotif} />
          <ToggleRow label={t.festivalNotif} value={festivalNotif} onValueChange={setFestivalNotif} />
          <ToggleRow label={t.birthdayNotif} value={birthdayNotif} onValueChange={setBirthdayNotif} />

          <View style={styles.divider} />
          <ToggleRow label={t.sound} value={soundEnabled} onValueChange={setSoundEnabled} />
          <ToggleRow label={t.vibration} value={vibrationEnabled} onValueChange={setVibrationEnabled} />
        </View>

        {/* ===== 6. DATA ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="💾" icon="cloud" title={t.dataBackup} color="#059669" />

          {/* Storage Indicator */}
          <View style={styles.storageCard}>
            <View style={[styles.storageHeader, isRTL && styles.rtlRow]}>
              <Text style={[styles.storageLabel, isRTL && styles.rtlText]}>{t.storage}</Text>
              <Text style={[styles.storageValue, isRTL && styles.rtlText]}>{storageUsed} KB / 5 MB</Text>
            </View>
            <View style={styles.storageBar}>
              <LinearGradient
                colors={[theme.primary, theme.payment]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.storageBarFill, { width: `${storagePercent}%` }]}
              />
            </View>
          </View>

          <View style={[styles.backupStatus, isRTL && styles.rtlRow]}>
            <View style={[styles.backupStatusLeft, isRTL && styles.rtlRow]}>
              <MaterialIcons name="cloud-done" size={20} color={theme.payment} />
              <View>
                <Text style={[styles.backupStatusText, isRTL && styles.rtlText]}>{t.lastBackup}</Text>
                <Text style={[styles.backupStatusDate, isRTL && styles.rtlText]}>{lastBackup}</Text>
              </View>
            </View>
            <Pressable style={({ pressed }) => [styles.backupNowBtn, pressed && { opacity: 0.85 }]} onPress={handleBackup}>
              <Text style={styles.backupNowText}>{t.backupNow}</Text>
            </Pressable>
          </View>

          <ToggleRow label={t.autoBackup} subtitle="Daily automatic backups" value={autoBackup} onValueChange={setAutoBackup} />
          {autoBackup ? (
            <>
              <View style={styles.radioRow}>
                {[
                  { k: 'daily', l: t.daily },
                  { k: 'weekly', l: t.weekly },
                  { k: 'monthly', l: t.monthly },
                ].map(f => (
                  <Pressable key={f.k} style={[styles.radioChip, backupFreq === f.k && styles.radioChipActive]} onPress={() => setBackupFreq(f.k)}>
                    <Text style={[styles.radioText, backupFreq === f.k && styles.radioTextActive]}>{f.l}</Text>
                  </Pressable>
                ))}
              </View>
              <ToggleRow label={t.wifiOnly} value={wifiOnly} onValueChange={setWifiOnly} />
            </>
          ) : null}

          <View style={styles.divider} />

          <Pressable style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: theme.borderLight }, isRTL && styles.rtlRow]} onPress={() => showAlert(t.restore, language === 'ur' ? 'بیک اپ فائل منتخب کریں' : 'Select backup file')}>
            <View style={[styles.actionRowLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#DBEAFE' }]}>
                <MaterialIcons name="restore" size={18} color="#2563EB" />
              </View>
              <Text style={[styles.actionRowText, isRTL && styles.rtlText]}>{t.restore}</Text>
            </View>
            <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={theme.textMuted} />
          </Pressable>

          <View style={styles.exportGrid}>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]} onPress={() => handleExport('Excel')}>
              <MaterialIcons name="table-chart" size={20} color="#16A34A" />
              <Text style={styles.exportBtnText}>Excel</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]} onPress={() => handleExport('PDF')}>
              <MaterialIcons name="picture-as-pdf" size={20} color="#DC2626" />
              <Text style={styles.exportBtnText}>PDF</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]} onPress={() => handleExport('JSON')}>
              <MaterialIcons name="code" size={20} color="#7C3AED" />
              <Text style={styles.exportBtnText}>JSON</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.85 }]} onPress={() => showAlert(t.importData, 'CSV')}>
              <MaterialIcons name="file-upload" size={20} color="#2563EB" />
              <Text style={styles.exportBtnText}>CSV</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Pressable style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: theme.borderLight }, isRTL && styles.rtlRow]} onPress={handleClearCache}>
            <View style={[styles.actionRowLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="cached" size={18} color="#D97706" />
              </View>
              <Text style={[styles.actionRowText, isRTL && styles.rtlText]}>{t.clearCache} (2.4 MB)</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.dangerRow, pressed && { backgroundColor: '#FEE2E2' }, isRTL && styles.rtlRow]} onPress={handleClearAll}>
            <View style={[styles.actionRowLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="delete-forever" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.actionRowText, { color: '#DC2626' }, isRTL && styles.rtlText]}>{t.clearAll}</Text>
            </View>
            <Text style={styles.dangerWarning}>{t.permanent}</Text>
          </Pressable>
        </View>

        {/* ===== 7. BUSINESS ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🏪" icon="store" title={t.business} color="#0891B2" />

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.dailyGoal} (₹)</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.creditLimit} (₹)</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.shopOpens}</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={shopOpen} onChangeText={setShopOpen} placeholder="09:00" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.shopCloses}</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={shopClose} onChangeText={setShopClose} placeholder="21:00" placeholderTextColor={theme.textMuted} />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.taxRate} (%)</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.discount} (%)</Text>
              <TextInput style={[styles.input, isRTL && styles.rtlText]} value={discountRate} onChangeText={setDiscountRate} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
          </View>
        </View>

        {/* ===== 8. PRINT ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🖨️" icon="print" title={t.printReceipt} color="#7C3AED" />

          <Text style={[styles.subLabel, isRTL && styles.rtlText]}>{t.receiptTemplate}</Text>
          <View style={styles.template2x2Grid}>
            {RECEIPT_TEMPLATES.map(tmpl => (
              <Pressable key={tmpl.id} style={[styles.templateCard2x2, receiptTemplate === tmpl.id && styles.templateCard2x2Active]} onPress={() => setReceiptTemplate(tmpl.id)}>
                <View style={[styles.templatePreview2x2, receiptTemplate === tmpl.id && { borderColor: theme.primary, borderWidth: 2 }]}>
                  <View style={styles.templatePreviewLine} />
                  <View style={[styles.templatePreviewLine, { width: '60%' }]} />
                  <MaterialIcons name={tmpl.icon as any} size={28} color={receiptTemplate === tmpl.id ? theme.primary : theme.textMuted} style={{ marginVertical: 6 }} />
                  <View style={[styles.templatePreviewLine, { width: '80%' }]} />
                  <View style={[styles.templatePreviewLine, { width: '50%' }]} />
                </View>
                <Text style={[styles.templateName, receiptTemplate === tmpl.id && { color: theme.primary, fontWeight: '700' }]}>
                  {language === 'ur' ? tmpl.labelUr : tmpl.label}
                </Text>
                {receiptTemplate === tmpl.id ? (
                  <View style={styles.templateCheck2x2}>
                    <MaterialIcons name="check-circle" size={16} color={theme.primary} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={[styles.subLabel, isRTL && styles.rtlText]}>
            {language === 'ur' ? 'شیئر کرنے کے طریقے' : 'Share Methods'}
          </Text>
          <View style={styles.shareGrid}>
            {[
              { k: shareWA, set: setShareWA, label: 'WhatsApp', icon: 'message', color: '#25D366' },
              { k: shareSMS, set: setShareSMS, label: 'SMS', icon: 'sms', color: '#2563EB' },
              { k: shareEmail, set: setShareEmail, label: 'Email', icon: 'email', color: '#DC2626' },
              { k: shareCopy, set: setShareCopy, label: 'Copy', icon: 'content-copy', color: '#7C3AED' },
            ].map((s, i) => (
              <Pressable key={i} style={[styles.shareCheckbox, s.k && styles.shareCheckboxActive]} onPress={() => s.set(!s.k)}>
                <MaterialIcons name={s.icon as any} size={18} color={s.k ? '#FFF' : s.color} />
                <Text style={[styles.shareLabel, s.k && { color: '#FFF' }]}>{s.label}</Text>
                {s.k ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t.invoiceFooter}</Text>
            <TextInput
              style={[styles.input, styles.textArea, isRTL && styles.rtlText]}
              value={invoiceFooter}
              onChangeText={setInvoiceFooter}
              multiline
              numberOfLines={2}
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        {/* ===== 9. DASHBOARD ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="📊" icon="dashboard" title={t.dashboard} color="#BE185D" />

          <Text style={[styles.subLabel, isRTL && styles.rtlText]}>
            {language === 'ur' ? 'ابتدائی صفحہ' : 'Default Screen'}
          </Text>
          <View style={styles.radioRow}>
            {[
              { k: 'dashboard', l: t.home },
              { k: 'customers', l: t.customers },
              { k: 'udhaar', l: t.udhaar },
              { k: 'reports', l: t.reports },
            ].map(opt => (
              <Pressable key={opt.k} style={[styles.radioChip, defaultScreen === opt.k && styles.radioChipActive]} onPress={() => setDefaultScreen(opt.k)}>
                <Text style={[styles.radioText, defaultScreen === opt.k && styles.radioTextActive]}>{opt.l}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: 16 }, isRTL && styles.rtlText]}>
            {language === 'ur' ? 'ڈیش بورڈ پر دکھائیں' : 'Show on Dashboard'}
          </Text>
          {[
            { l: language === 'ur' ? 'صحت' : 'Business Health', v: showHealth, set: setShowHealth },
            { l: language === 'ur' ? 'خلاصہ' : 'Summary', v: showSummary, set: setShowSummary },
            { l: language === 'ur' ? 'ہدف' : 'Goal Progress', v: showGoal, set: setShowGoal },
            { l: language === 'ur' ? 'فوری اعمال' : 'Quick Actions', v: showActions, set: setShowActions },
            { l: language === 'ur' ? 'حالیہ گاہک' : 'Recent Customers', v: showCustomers, set: setShowCustomers },
            { l: language === 'ur' ? 'سب سے زیادہ بقایا' : 'Top Outstanding', v: showTop, set: setShowTop },
          ].map((it, i) => (
            <Pressable key={i} style={[styles.checkRow, isRTL && styles.rtlRow]} onPress={() => it.set(!it.v)}>
              <View style={[styles.checkBox, it.v && styles.checkBoxActive]}>
                {it.v ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
              </View>
              <Text style={[styles.checkLabel, isRTL && styles.rtlText]}>{it.l}</Text>
            </Pressable>
          ))}
        </View>

        {/* ===== 10. ABOUT ===== */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="ℹ️" icon="info" title={t.about} color="#4F46E5" />

          <View style={styles.aboutCenter}>
            <LinearGradient colors={['#0D7C4A', '#065F37', '#FFD700']} style={styles.aboutLogoBorder}>
              <View style={styles.aboutLogoInner}>
                <MaterialIcons name="account-balance-wallet" size={36} color="#0D7C4A" />
              </View>
            </LinearGradient>
            <Text style={styles.aboutName}>KhataJi Pro</Text>
            <Text style={styles.aboutTagline}>{t.tagline}</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>{t.version} 3.0.0</Text>
            </View>
            <Text style={styles.aboutMade}>{t.madeIn}</Text>
          </View>

          <View style={styles.aboutLinks}>
            {[
              { i: 'star', c: '#F59E0B', l: t.rateApp },
              { i: 'headset-mic', c: '#2563EB', l: t.support },
              { i: 'privacy-tip', c: '#059669', l: t.privacy },
              { i: 'gavel', c: '#7C3AED', l: t.terms },
              { i: 'system-update', c: '#DC2626', l: t.checkUpdate, action: () => showAlert(t.success, language === 'ur' ? 'آپ تازہ ترین ورژن استعمال کر رہے ہیں' : 'You are on latest version') },
            ].map((it, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.aboutLink, pressed && { backgroundColor: theme.borderLight }, isRTL && styles.rtlRow]}
                onPress={(it as any).action}
              >
                <MaterialIcons name={it.i as any} size={18} color={it.c} />
                <Text style={[styles.aboutLinkText, isRTL && styles.rtlText]}>{it.l}</Text>
                <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick Access Grid */}
        <View style={styles.glassCard}>
          <SectionHeader emoji="🚀" icon="apps" title={t.quickAccess} color="#64748B" />
          <View style={styles.quickNavGrid}>
            {[
              { icon: 'mic', label: t.voiceEntry, color: '#7C3AED', route: '/voice-entry' },
              { icon: 'smart-toy', label: t.chatAssistant, color: '#0D7C4A', route: '/chat-assistant' },
              { icon: 'receipt-long', label: language === 'ur' ? 'انوائس' : 'Invoice', color: '#D97706', route: '/invoice' },
              { icon: 'inventory', label: language === 'ur' ? 'سٹاک' : 'Stock', color: '#059669', route: '/stock' },
              { icon: 'assessment', label: language === 'ur' ? 'فروخت' : 'Sales', color: '#DC2626', route: '/sales-report' },
              { icon: 'link', label: language === 'ur' ? 'پے لنک' : 'Pay Links', color: '#4F46E5', route: '/pay-link' },
              { icon: 'qr-code-scanner', label: 'QR', color: '#2563EB', route: '/qr-scanner' },
              { icon: 'auto-awesome', label: t.insights, color: '#BE185D', route: '/insights' },
            ].map(item => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.quickNavItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: item.color + '15' }]}>
                  <MaterialIcons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={[styles.quickNavLabel, isRTL && styles.rtlText]} numberOfLines={1}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>KhataJi Pro v3.0.0 • {t.free} (75 credits)</Text>
      </ScrollView>

      {/* Custom Language Modal */}
      <Modal visible={showCustomLangModal} transparent animationType="slide" onRequestClose={() => setShowCustomLangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.customLanguage}</Text>
              <Pressable onPress={() => setShowCustomLangModal(false)} hitSlop={6}>
                <MaterialIcons name="close" size={22} color="#FFF" />
              </Pressable>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.languageName}</Text>
                <TextInput style={styles.input} value={clName} onChangeText={setClName} placeholder="e.g., Bengali" placeholderTextColor={theme.textMuted} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.nativeName}</Text>
                <TextInput style={styles.input} value={clNative} onChangeText={setClNative} placeholder="e.g., বাংলা" placeholderTextColor={theme.textMuted} />
              </View>
              <Text style={styles.subLabel}>{t.direction}</Text>
              <View style={styles.radioRow}>
                <Pressable style={[styles.radioChip, clDirection === 'ltr' && styles.radioChipActive]} onPress={() => setClDirection('ltr')}>
                  <MaterialIcons name="format-textdirection-l-to-r" size={14} color={clDirection === 'ltr' ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.radioText, clDirection === 'ltr' && styles.radioTextActive]}>{t.ltr}</Text>
                </Pressable>
                <Pressable style={[styles.radioChip, clDirection === 'rtl' && styles.radioChipActive]} onPress={() => setClDirection('rtl')}>
                  <MaterialIcons name="format-textdirection-r-to-l" size={14} color={clDirection === 'rtl' ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.radioText, clDirection === 'rtl' && styles.radioTextActive]}>{t.rtl}</Text>
                </Pressable>
              </View>

              {clProgress > 0 ? (
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>
                    {language === 'ur' ? 'ترجمہ ہو رہا ہے...' : 'Translating...'} {clProgress}%
                  </Text>
                  <View style={styles.progressBar}>
                    <LinearGradient colors={[theme.primary, theme.payment]} style={[styles.progressFill, { width: `${clProgress}%` }]} />
                  </View>
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable style={({ pressed }) => [styles.modalActionBtn, styles.modalActionBtnSecondary, pressed && { opacity: 0.85 }]} onPress={handleImportLangJson}>
                  <MaterialIcons name="file-upload" size={16} color={theme.primary} />
                  <Text style={styles.modalActionBtnSecondaryText}>{t.importJson}</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.modalActionBtn, styles.modalActionBtnSecondary, pressed && { opacity: 0.85 }]} onPress={handleExportLangJson}>
                  <MaterialIcons name="file-download" size={16} color={theme.primary} />
                  <Text style={styles.modalActionBtnSecondaryText}>{t.exportJson}</Text>
                </Pressable>
              </View>

              <Pressable style={({ pressed }) => [{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }, pressed && { opacity: 0.9 }]} onPress={handleAddCustomLang}>
                <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.saveBtn}>
                  <MaterialIcons name="add" size={20} color="#FFF" />
                  <Text style={styles.saveBtnText}>{t.add}</Text>
                </LinearGradient>
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
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },

  // Glass Header
  glassHeader: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,124,74,0.08)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textDark,
    letterSpacing: -0.3,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  planText: { fontSize: 11, fontWeight: '800', color: '#B45309' },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(13,124,74,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
      default: {},
    }),
  },

  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark },

  // Profile
  profilePhotoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  profilePhotoBorder: { position: 'relative' },
  profilePhotoGradientBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  profilePhotoInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileShopName: { fontSize: 18, fontWeight: '700', color: theme.textDark },
  profileSubtext: { fontSize: 12, color: theme.textMuted, marginTop: 4 },

  // Inputs
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: theme.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: theme.textDark,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputRow: { flexDirection: 'row', gap: 10 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    height: 52,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Sub Labels
  subLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  divider: { height: 1, backgroundColor: theme.borderLight, marginVertical: 14 },

  // Themes
  themeRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  themeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeCircleActive: {
    borderColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 6 },
      default: {},
    }),
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 48,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  toggleSubtitle: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

  // Segment Control
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 9,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  segmentBtnActive: { backgroundColor: '#FFF' },
  segmentText: { fontWeight: '700', color: theme.textMuted },
  segmentTextActive: { color: theme.primary },
  segmentLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '600' },

  // Language
  langCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
    minWidth: 100,
    alignItems: 'center',
    position: 'relative',
  },
  langCardActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  langCardNative: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  langCardNativeActive: { color: '#FFF' },
  langCardName: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
  langCardNameActive: { color: 'rgba(255,255,255,0.85)' },
  rtlBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rtlBadgeText: { fontSize: 8, fontWeight: '800', color: '#FFF' },

  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.primary + '12',
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: theme.primary + '30',
    borderStyle: 'dashed',
  },
  addCustomText: { fontSize: 13, fontWeight: '700', color: theme.primary },

  customLangsList: { marginTop: 10, gap: 6 },
  customLangItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  customLangName: { fontSize: 13, fontWeight: '600', color: theme.textDark },
  langActionsRow: { flexDirection: 'row', gap: 12 },

  // Radio
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  radioChipActive: { backgroundColor: theme.primary + '12', borderColor: theme.primary },
  radioText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  radioTextActive: { color: theme.primary },

  // Currency Grid
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  currencyChipActive: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  currencySymbol: { fontSize: 13, fontWeight: '800', color: theme.textSecondary },
  currencyText: { fontSize: 11, fontWeight: '700', color: theme.textSecondary },
  currencyTextActive: { color: '#B45309' },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  actionRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowText: { fontSize: 14, fontWeight: '600', color: theme.textDark },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  dangerWarning: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  // Storage
  storageCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storageLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  storageValue: { fontSize: 12, fontWeight: '700', color: theme.textDark },
  storageBar: { height: 6, backgroundColor: theme.borderLight, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  storageBarFill: { height: '100%', borderRadius: 3 },

  // Backup
  backupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.paymentLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  backupStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backupStatusText: { fontSize: 11, color: theme.textSecondary, fontWeight: '600' },
  backupStatusDate: { fontSize: 13, fontWeight: '700', color: theme.payment, marginTop: 2 },
  backupNowBtn: { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  backupNowText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Export
  exportGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  exportBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.borderLight,
    gap: 4,
  },
  exportBtnText: { fontSize: 11, fontWeight: '700', color: theme.textSecondary },

  // SMS Variables
  varRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  varChip: { backgroundColor: theme.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  varText: { fontSize: 10, fontWeight: '700', color: theme.primary },

  // 2x2 Template Grid
  template2x2Grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard2x2: { width: '47%', alignItems: 'center', position: 'relative' },
  templateCard2x2Active: {},
  templatePreview2x2: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 12,
    backgroundColor: '#FAFCFB',
    borderWidth: 1.5,
    borderColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 4,
  },
  templatePreviewLine: {
    width: '70%',
    height: 4,
    backgroundColor: theme.borderLight,
    borderRadius: 2,
  },
  templateName: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginTop: 8 },
  templateCheck2x2: { position: 'absolute', top: 6, right: 6, backgroundColor: '#FFF', borderRadius: 12 },

  // Share Methods
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shareCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  shareCheckboxActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  shareLabel: { fontSize: 12, fontWeight: '600', color: theme.textDark },

  // Checkboxes
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  checkLabel: { fontSize: 14, color: theme.textDark, fontWeight: '500' },

  // About
  aboutCenter: { alignItems: 'center', marginBottom: 20 },
  aboutLogoBorder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogoInner: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
    marginTop: 14,
    letterSpacing: -0.3,
  },
  aboutTagline: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  versionBadge: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  versionText: { fontSize: 11, fontWeight: '700', color: theme.primary },
  aboutMade: { fontSize: 12, color: theme.textSecondary, marginTop: 8 },
  aboutLinks: { borderTopWidth: 1, borderTopColor: theme.borderLight, paddingTop: 4 },
  aboutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  aboutLinkText: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.textDark },

  // Quick Nav
  quickNavGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickNavItem: { width: '22%', alignItems: 'center' },
  quickNavIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavLabel: { fontSize: 10, fontWeight: '600', color: theme.textSecondary, marginTop: 6, textAlign: 'center' },

  footer: { textAlign: 'center', fontSize: 11, color: theme.textMuted, marginTop: 12 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  progressSection: { marginTop: 16 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: theme.borderLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalActionBtnSecondary: {
    backgroundColor: theme.primary + '12',
    borderWidth: 1.5,
    borderColor: theme.primary + '30',
  },
  modalActionBtnSecondaryText: { fontSize: 13, fontWeight: '700', color: theme.primary },
});
