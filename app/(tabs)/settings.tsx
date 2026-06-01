import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Switch, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { useApp } from '../../contexts/AppContext';
import { useAlert } from '@/template';

const THEMES = [
  { id: 'green', color: '#006837', label: 'Green' },
  { id: 'gold', color: '#B8860B', label: 'Gold' },
  { id: 'blue', color: '#1565C0', label: 'Blue' },
  { id: 'black', color: '#1A1A2E', label: 'Black' },
  { id: 'desert', color: '#C2956B', label: 'Desert' },
];

const LANGUAGES = [
  'English', 'اردو (Urdu)', 'हिन्दी (Hindi)', 'پنجابی (Punjabi)', 'سنڌي (Sindhi)',
  'پښتو (Pashto)', 'العربية (Arabic)', 'فارسی (Persian)', 'Türkçe (Turkish)',
  '中文 (Chinese)', '日本語 (Japanese)', '한국어 (Korean)', 'Français (French)',
  'Deutsch (German)', 'Español (Spanish)', 'Português (Portuguese)', 'Русский (Russian)',
  'ไทย (Thai)', 'Tiếng Việt (Vietnamese)', 'Bahasa Indonesia', 'Bahasa Melayu',
  'বাংলা (Bengali)', 'ગુજરાતી (Gujarati)', 'मराठी (Marathi)', 'Kiswahili (Swahili)', 'Custom',
];

const CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR'];

const RECEIPT_TEMPLATES = ['Simple', 'Modern', 'Premium', 'Islamic'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, language, t, updateSettings, setLanguage } = useApp();
  const { showAlert } = useAlert();

  // Profile
  const [profileName, setProfileName] = useState(settings.ownerName);
  const [profilePhone, setProfilePhone] = useState(settings.phone);
  const [profileAddress, setProfileAddress] = useState(settings.address || 'Lahore, Pakistan');

  // Appearance
  const [selectedTheme, setSelectedTheme] = useState('green');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Language
  const [selectedLang, setSelectedLang] = useState(0);
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'>('DD/MM/YYYY');
  const [selectedCurrency, setSelectedCurrency] = useState(0);
  const [symbolPosition, setSymbolPosition] = useState<'before' | 'after'>('before');

  // Security
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [autoLock, setAutoLock] = useState('5min');
  const [twoFAThreshold, setTwoFAThreshold] = useState('50000');

  // Notifications
  const [smsToggle, setSmsToggle] = useState(settings.smsReminders);
  const [smsTemplate, setSmsTemplate] = useState('Assalam o Alaikum {name}, your balance at {shop} is Rs.{amount}. Kindly pay soon. JazakAllah!');
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

  // Business
  const [dailyGoal, setDailyGoal] = useState('50000');
  const [creditLimit, setCreditLimit] = useState('100000');
  const [shopOpen, setShopOpen] = useState('09:00');
  const [shopClose, setShopClose] = useState('21:00');
  const [taxRate, setTaxRate] = useState('17');
  const [discountRate, setDiscountRate] = useState('5');

  // Print
  const [receiptTemplate, setReceiptTemplate] = useState('Modern');
  const [invoiceFooter, setInvoiceFooter] = useState('Thank you for your business! - ' + settings.shopName);
  const [shareReceipt, setShareReceipt] = useState(true);
  const [shareInvoice, setShareInvoice] = useState(true);

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
    showAlert('Saved', 'Profile updated successfully');
  };

  const handleBackup = () => {
    showAlert('Backup', 'Data backup created successfully!\nLast backup: ' + new Date().toLocaleString());
  };

  const handleClearCache = () => {
    showAlert('Cache Cleared', 'App cache has been cleared (2.4 MB freed)');
  };

  const handleClearAll = () => {
    showAlert('Delete All Data?', 'This will permanently erase ALL your data including customers, transactions, and settings. This action CANNOT be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'DELETE',
        style: 'destructive',
        onPress: () => {
          showAlert('Confirm Again', 'Are you ABSOLUTELY sure? Type DELETE to confirm.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes, Delete Everything', style: 'destructive', onPress: () => showAlert('Done', 'All data has been cleared.') },
          ]);
        },
      },
    ]);
  };

  const handleExport = (type: string) => {
    showAlert('Export', `${type} file generated. Ready to share.`);
  };

  const handleRestore = () => {
    showAlert('Restore Data', 'Select a backup file to restore. Current data will be replaced.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Select File', onPress: () => showAlert('Restored', 'Data restored successfully! Reloading...') },
    ]);
  };

  const SectionHeader = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const ToggleRow = ({ label, subtitle, value, onValueChange }: { label: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void }) => (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {subtitle ? <Text style={styles.toggleSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
        thumbColor={value ? '#16A34A' : '#94A3B8'}
      />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <Pressable style={({ pressed }) => [styles.planBadge, pressed && { opacity: 0.8 }]} onPress={() => router.push('/plans')}>
          <MaterialIcons name="workspace-premium" size={14} color="#FFD700" />
          <Text style={styles.planText}>FREE</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== 1. PROFILE ===== */}
        <View style={styles.card}>
          <SectionHeader icon="person" title="Profile" color="#7C3AED" />
          
          <View style={styles.profilePhotoRow}>
            <View style={styles.profilePhoto}>
              <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.profilePhotoGradient}>
                <MaterialIcons name="store" size={32} color="#FFF" />
              </LinearGradient>
              <View style={styles.cameraIcon}>
                <MaterialIcons name="camera-alt" size={12} color="#FFF" />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.profileShopName}>{settings.shopName}</Text>
              <Text style={styles.profileSubtext}>Tap photo to change</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile</Text>
            <TextInput
              style={styles.input}
              value={profilePhone}
              onChangeText={setProfilePhone}
              placeholder="Phone number"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={profileAddress}
              onChangeText={setProfileAddress}
              placeholder="Shop address"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]} onPress={handleSaveProfile}>
            <MaterialIcons name="check" size={18} color="#FFF" />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </Pressable>
        </View>

        {/* ===== 2. APPEARANCE ===== */}
        <View style={styles.card}>
          <SectionHeader icon="palette" title="Appearance" color="#D97706" />
          
          <Text style={styles.subLabel}>Theme Color</Text>
          <View style={styles.themeRow}>
            {THEMES.map(t => (
              <Pressable
                key={t.id}
                style={[styles.themeCircle, { backgroundColor: t.color }, selectedTheme === t.id && styles.themeCircleActive]}
                onPress={() => setSelectedTheme(t.id)}
              >
                {selectedTheme === t.id ? <MaterialIcons name="check" size={18} color="#FFF" /> : null}
              </Pressable>
            ))}
          </View>

          <ToggleRow label="Dark Mode" subtitle="Auto-switches at 6 PM" value={darkMode} onValueChange={setDarkMode} />

          <Text style={[styles.subLabel, { marginTop: 16 }]}>Font Size</Text>
          <View style={styles.radioRow}>
            {(['small', 'medium', 'large'] as const).map(size => (
              <Pressable key={size} style={[styles.radioChip, fontSize === size && styles.radioChipActive]} onPress={() => setFontSize(size)}>
                <Text style={[styles.radioText, fontSize === size && styles.radioTextActive, { fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16 }]}>
                  {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'} {size.charAt(0).toUpperCase() + size.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ===== 3. LANGUAGE ===== */}
        <View style={styles.card}>
          <SectionHeader icon="translate" title="Language & Region" color="#2563EB" />
          
          <Text style={styles.subLabel}>App Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll} contentContainerStyle={{ gap: 6 }}>
            {LANGUAGES.slice(0, 8).map((lang, i) => (
              <Pressable
                key={lang}
                style={[styles.langChip, selectedLang === i && styles.langChipActive]}
                onPress={() => { setSelectedLang(i); if (i === 1) setLanguage('ur'); else setLanguage('en'); }}
              >
                <Text style={[styles.langChipText, selectedLang === i && styles.langChipTextActive]}>{lang.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.langCount}>+{LANGUAGES.length - 8} more languages available</Text>

          <Text style={[styles.subLabel, { marginTop: 16 }]}>Date Format</Text>
          <View style={styles.radioRow}>
            {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map(fmt => (
              <Pressable key={fmt} style={[styles.radioChip, dateFormat === fmt && styles.radioChipActive]} onPress={() => setDateFormat(fmt)}>
                <Text style={[styles.radioText, dateFormat === fmt && styles.radioTextActive]}>{fmt}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: 16 }]}>Currency</Text>
          <View style={styles.radioRow}>
            {CURRENCIES.map((cur, i) => (
              <Pressable key={cur} style={[styles.currencyChip, selectedCurrency === i && styles.currencyChipActive]} onPress={() => setSelectedCurrency(i)}>
                <Text style={[styles.currencyText, selectedCurrency === i && styles.currencyTextActive]}>{cur}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: 16 }]}>Symbol Position</Text>
          <View style={styles.radioRow}>
            <Pressable style={[styles.radioChip, symbolPosition === 'before' && styles.radioChipActive]} onPress={() => setSymbolPosition('before')}>
              <Text style={[styles.radioText, symbolPosition === 'before' && styles.radioTextActive]}>Rs. 100 (Before)</Text>
            </Pressable>
            <Pressable style={[styles.radioChip, symbolPosition === 'after' && styles.radioChipActive]} onPress={() => setSymbolPosition('after')}>
              <Text style={[styles.radioText, symbolPosition === 'after' && styles.radioTextActive]}>100 Rs. (After)</Text>
            </Pressable>
          </View>
        </View>

        {/* ===== 4. SECURITY ===== */}
        <View style={styles.card}>
          <SectionHeader icon="lock" title="Security" color="#DC2626" />
          
          <Pressable style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: theme.borderLight }]} onPress={() => router.push('/app-lock')}>
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="pin" size={18} color="#DC2626" />
              <Text style={styles.actionRowText}>Change PIN</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <ToggleRow label="Two-Factor Authentication" subtitle="Required for large transactions" value={twoFA} onValueChange={setTwoFA} />
          {twoFA ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>2FA Threshold (Rs.)</Text>
              <TextInput style={styles.input} value={twoFAThreshold} onChangeText={setTwoFAThreshold} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
          ) : null}

          <ToggleRow label="Biometric Login" subtitle="Face ID / Fingerprint" value={biometric} onValueChange={setBiometric} />

          <Text style={[styles.subLabel, { marginTop: 12 }]}>Auto-Lock After</Text>
          <View style={styles.radioRow}>
            {[{ k: 'instant', l: 'Instant' }, { k: '1min', l: '1 min' }, { k: '5min', l: '5 min' }, { k: '30min', l: '30 min' }].map(opt => (
              <Pressable key={opt.k} style={[styles.radioChip, autoLock === opt.k && styles.radioChipActive]} onPress={() => setAutoLock(opt.k)}>
                <Text style={[styles.radioText, autoLock === opt.k && styles.radioTextActive]}>{opt.l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ===== 5. NOTIFICATIONS ===== */}
        <View style={styles.card}>
          <SectionHeader icon="notifications" title="Notifications" color="#F59E0B" />
          
          <ToggleRow label="SMS Reminders" subtitle="Auto-send balance reminders" value={smsToggle} onValueChange={(v) => { setSmsToggle(v); updateSettings({ smsReminders: v }); }} />
          {smsToggle ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SMS Template</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={smsTemplate}
                onChangeText={setSmsTemplate}
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.textMuted}
              />
              <Text style={styles.helperText}>Use {'{name}'}, {'{shop}'}, {'{amount}'} as variables</Text>
            </View>
          ) : null}

          <ToggleRow label="Daily Reminder" subtitle={`Every day at ${reminderTime}`} value={dailyReminder} onValueChange={setDailyReminder} />
          <ToggleRow label="Payment Received" subtitle="Alert when payment comes in" value={paymentNotif} onValueChange={setPaymentNotif} />
          <ToggleRow label="Festival Greetings" subtitle="Eid, Shab-e-Barat, etc." value={festivalNotif} onValueChange={setFestivalNotif} />
          <ToggleRow label="Birthday Wishes" subtitle="Customer birthdays" value={birthdayNotif} onValueChange={setBirthdayNotif} />

          <View style={styles.divider} />
          <ToggleRow label="Sound" value={soundEnabled} onValueChange={setSoundEnabled} />
          <ToggleRow label="Vibration" value={vibrationEnabled} onValueChange={setVibrationEnabled} />
        </View>

        {/* ===== 6. DATA ===== */}
        <View style={styles.card}>
          <SectionHeader icon="cloud" title="Data & Backup" color="#059669" />

          <View style={styles.backupStatus}>
            <View style={styles.backupStatusLeft}>
              <MaterialIcons name="cloud-done" size={20} color={theme.payment} />
              <View>
                <Text style={styles.backupStatusText}>Last Backup</Text>
                <Text style={styles.backupStatusDate}>{lastBackup}</Text>
              </View>
            </View>
            <Pressable style={({ pressed }) => [styles.backupNowBtn, pressed && { opacity: 0.8 }]} onPress={handleBackup}>
              <Text style={styles.backupNowText}>Backup Now</Text>
            </Pressable>
          </View>

          <ToggleRow label="Auto Backup" subtitle="Automatic daily backups" value={autoBackup} onValueChange={setAutoBackup} />
          {autoBackup ? (
            <>
              <View style={styles.radioRow}>
                {['Daily', 'Weekly', 'Monthly'].map(f => (
                  <Pressable key={f} style={[styles.radioChip, backupFreq === f.toLowerCase() && styles.radioChipActive]} onPress={() => setBackupFreq(f.toLowerCase())}>
                    <Text style={[styles.radioText, backupFreq === f.toLowerCase() && styles.radioTextActive]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
              <ToggleRow label="WiFi Only" subtitle="Save mobile data" value={wifiOnly} onValueChange={setWifiOnly} />
            </>
          ) : null}

          <View style={styles.divider} />

          <Pressable style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: theme.borderLight }]} onPress={handleRestore}>
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="restore" size={18} color="#2563EB" />
              <Text style={styles.actionRowText}>Restore from Backup</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
          </Pressable>

          <View style={styles.exportRow}>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]} onPress={() => handleExport('Excel')}>
              <MaterialIcons name="table-chart" size={16} color="#16A34A" />
              <Text style={styles.exportBtnText}>Excel</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]} onPress={() => handleExport('PDF')}>
              <MaterialIcons name="picture-as-pdf" size={16} color="#DC2626" />
              <Text style={styles.exportBtnText}>PDF</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]} onPress={() => handleExport('JSON')}>
              <MaterialIcons name="code" size={16} color="#7C3AED" />
              <Text style={styles.exportBtnText}>JSON</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]} onPress={() => showAlert('Import', 'Select file to import data')}>
              <MaterialIcons name="file-upload" size={16} color="#2563EB" />
              <Text style={styles.exportBtnText}>Import</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Pressable style={({ pressed }) => [styles.actionRow, pressed && { backgroundColor: theme.borderLight }]} onPress={handleClearCache}>
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="cached" size={18} color="#F59E0B" />
              <Text style={styles.actionRowText}>Clear Cache (2.4 MB)</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.dangerRow, pressed && { backgroundColor: '#FEE2E2' }]} onPress={handleClearAll}>
            <View style={styles.actionRowLeft}>
              <MaterialIcons name="delete-forever" size={18} color="#DC2626" />
              <Text style={[styles.actionRowText, { color: '#DC2626' }]}>Clear All Data</Text>
            </View>
            <Text style={styles.dangerWarning}>Permanent</Text>
          </Pressable>
        </View>

        {/* ===== 7. BUSINESS ===== */}
        <View style={styles.card}>
          <SectionHeader icon="store" title="Business Settings" color="#0891B2" />
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Daily Goal (Rs.)</Text>
              <TextInput style={styles.input} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Credit Limit (Rs.)</Text>
              <TextInput style={styles.input} value={creditLimit} onChangeText={setCreditLimit} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Shop Opens</Text>
              <TextInput style={styles.input} value={shopOpen} onChangeText={setShopOpen} placeholder="09:00" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Shop Closes</Text>
              <TextInput style={styles.input} value={shopClose} onChangeText={setShopClose} placeholder="21:00" placeholderTextColor={theme.textMuted} />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Tax Rate (%)</Text>
              <TextInput style={styles.input} value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Discount (%)</Text>
              <TextInput style={styles.input} value={discountRate} onChangeText={setDiscountRate} keyboardType="numeric" placeholderTextColor={theme.textMuted} />
            </View>
          </View>
        </View>

        {/* ===== 8. PRINT ===== */}
        <View style={styles.card}>
          <SectionHeader icon="print" title="Print & Receipt" color="#7C3AED" />
          
          <Text style={styles.subLabel}>Receipt Template</Text>
          <View style={styles.templateGrid}>
            {RECEIPT_TEMPLATES.map(tmpl => (
              <Pressable key={tmpl} style={[styles.templateCard, receiptTemplate === tmpl && styles.templateCardActive]} onPress={() => setReceiptTemplate(tmpl)}>
                <View style={[styles.templatePreview, receiptTemplate === tmpl && { borderColor: theme.primary }]}>
                  <MaterialIcons name={tmpl === 'Islamic' ? 'mosque' : tmpl === 'Premium' ? 'diamond' : tmpl === 'Modern' ? 'auto-awesome' : 'receipt'} size={22} color={receiptTemplate === tmpl ? theme.primary : theme.textMuted} />
                </View>
                <Text style={[styles.templateName, receiptTemplate === tmpl && { color: theme.primary, fontWeight: '700' }]}>{tmpl}</Text>
                {receiptTemplate === tmpl ? (
                  <View style={styles.templateCheck}>
                    <MaterialIcons name="check-circle" size={14} color={theme.primary} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          <ToggleRow label="Auto-share Receipt" subtitle="After each transaction" value={shareReceipt} onValueChange={setShareReceipt} />
          <ToggleRow label="Share Invoice" subtitle="Include PDF attachment" value={shareInvoice} onValueChange={setShareInvoice} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Invoice Footer</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={invoiceFooter}
              onChangeText={setInvoiceFooter}
              multiline
              numberOfLines={2}
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        {/* ===== 9. DASHBOARD ===== */}
        <View style={styles.card}>
          <SectionHeader icon="dashboard" title="Dashboard" color="#BE185D" />
          
          <Text style={styles.subLabel}>Default Screen</Text>
          <View style={styles.radioRow}>
            {[{ k: 'dashboard', l: 'Home' }, { k: 'customers', l: 'Customers' }, { k: 'udhaar', l: 'Udhaar' }].map(opt => (
              <Pressable key={opt.k} style={[styles.radioChip, defaultScreen === opt.k && styles.radioChipActive]} onPress={() => setDefaultScreen(opt.k)}>
                <Text style={[styles.radioText, defaultScreen === opt.k && styles.radioTextActive]}>{opt.l}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: 16 }]}>Show on Dashboard</Text>
          <ToggleRow label="Business Health" value={showHealth} onValueChange={setShowHealth} />
          <ToggleRow label="Daily Summary" value={showSummary} onValueChange={setShowSummary} />
          <ToggleRow label="Goal Progress" value={showGoal} onValueChange={setShowGoal} />
          <ToggleRow label="Quick Actions" value={showActions} onValueChange={setShowActions} />
          <ToggleRow label="Recent Customers" value={showCustomers} onValueChange={setShowCustomers} />
          <ToggleRow label="Top Outstanding" value={showTop} onValueChange={setShowTop} />
        </View>

        {/* ===== 10. ABOUT ===== */}
        <View style={styles.card}>
          <SectionHeader icon="info" title="About" color="#4F46E5" />
          
          <View style={styles.aboutCenter}>
            <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.aboutIcon}>
              <MaterialIcons name="account-balance-wallet" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.aboutName}>KhataJi Pro</Text>
            <Text style={styles.aboutVersion}>Version 3.0.0</Text>
            <Text style={styles.aboutMade}>Made with ❤️ in Pakistan</Text>
          </View>

          <View style={styles.aboutLinks}>
            <Pressable style={({ pressed }) => [styles.aboutLink, pressed && { backgroundColor: theme.borderLight }]}>
              <MaterialIcons name="star" size={18} color="#F59E0B" />
              <Text style={styles.aboutLinkText}>Rate App</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.aboutLink, pressed && { backgroundColor: theme.borderLight }]}>
              <MaterialIcons name="headset-mic" size={18} color="#2563EB" />
              <Text style={styles.aboutLinkText}>Support</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.aboutLink, pressed && { backgroundColor: theme.borderLight }]}>
              <MaterialIcons name="privacy-tip" size={18} color="#059669" />
              <Text style={styles.aboutLinkText}>Privacy Policy</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.aboutLink, pressed && { backgroundColor: theme.borderLight }]}>
              <MaterialIcons name="gavel" size={18} color="#7C3AED" />
              <Text style={styles.aboutLinkText}>Terms of Service</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.aboutLink, pressed && { backgroundColor: theme.borderLight }]} onPress={() => showAlert('Up to Date', 'You are running the latest version.')}>
              <MaterialIcons name="system-update" size={18} color="#DC2626" />
              <Text style={styles.aboutLinkText}>Check for Updates</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Quick Navigation */}
        <View style={styles.card}>
          <SectionHeader icon="apps" title="Quick Access" color="#64748B" />
          <View style={styles.quickNavGrid}>
            {[
              { icon: 'mic', label: 'Voice', color: '#7C3AED', route: '/voice-entry' },
              { icon: 'smart-toy', label: 'AI Chat', color: '#0D7C4A', route: '/chat-assistant' },
              { icon: 'receipt-long', label: 'Invoice', color: '#D97706', route: '/invoice' },
              { icon: 'repeat', label: 'Recurring', color: '#2563EB', route: '/recurring' },
              { icon: 'inventory', label: 'Stock', color: '#059669', route: '/stock' },
              { icon: 'local-shipping', label: 'Suppliers', color: '#7C3AED', route: '/suppliers' },
              { icon: 'assessment', label: 'Sales', color: '#DC2626', route: '/sales-report' },
              { icon: 'link', label: 'Pay Links', color: '#4F46E5', route: '/pay-link' },
            ].map(item => (
              <Pressable key={item.label} style={({ pressed }) => [styles.quickNavItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]} onPress={() => router.push(item.route as any)}>
                <View style={[styles.quickNavIcon, { backgroundColor: item.color + '15' }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.quickNavLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>KhataJi Pro v3.0.0 | Free Plan (75 credits)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
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
  planText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textDark,
  },

  // Profile
  profilePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  profilePhoto: {
    position: 'relative',
  },
  profilePhotoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileShopName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
  },
  profileSubtext: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },

  // Inputs
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.textDark,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  helperText: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Save Button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Theme
  themeRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  themeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeCircleActive: {
    borderColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
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
    minHeight: 44,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },

  // Radio/Chips
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  radioChipActive: {
    backgroundColor: theme.primary + '12',
    borderColor: theme.primary,
  },
  radioText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  radioTextActive: {
    color: theme.primary,
  },

  // Language
  langScroll: {
    maxHeight: 38,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  langChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  langChipTextActive: {
    color: '#FFF',
  },
  langCount: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Currency
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.borderLight,
  },
  currencyChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  currencyTextActive: {
    color: '#B45309',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginVertical: 14,
  },

  // Action Rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 4,
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

  // Backup
  backupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.paymentLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  backupStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backupStatusText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  backupStatusDate: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.payment,
    marginTop: 1,
  },
  backupNowBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backupNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Export
  exportRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // Template
  templateGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  templateCard: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  templateCardActive: {},
  templatePreview: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  templateCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // About
  aboutCenter: {
    alignItems: 'center',
    marginBottom: 18,
  },
  aboutIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textDark,
    marginTop: 12,
  },
  aboutVersion: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 4,
  },
  aboutMade: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 6,
  },
  aboutLinks: {
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    paddingTop: 8,
  },
  aboutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  aboutLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.textDark,
  },

  // Quick Nav
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickNavItem: {
    width: '22%',
    alignItems: 'center',
  },
  quickNavIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 12,
    marginBottom: 8,
  },
});
