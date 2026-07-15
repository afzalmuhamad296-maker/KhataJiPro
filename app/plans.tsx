import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
  Modal, TextInput, Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';

interface PricedFeature {
  id: string;
  icon: string;
  emoji: string;
  label: string;
  labelUr: string;
  price: number;
  category: 'core' | 'ai' | 'business' | 'support';
  freeIncluded: boolean;
}

const INITIAL_FEATURES: PricedFeature[] = [
  { id: 'unlimited_cust', icon: 'people', emoji: '👥', label: 'Unlimited Customers', labelUr: 'لامحدود گاہک', price: 50, category: 'core', freeIncluded: false },
  { id: 'unlimited_txn', icon: 'receipt', emoji: '📄', label: 'Unlimited Transactions', labelUr: 'لامحدود لین دین', price: 50, category: 'core', freeIncluded: false },
  { id: 'multi_lang', icon: 'translate', emoji: '🌐', label: 'All Languages (8+)', labelUr: 'تمام زبانیں', price: 30, category: 'core', freeIncluded: true },
  { id: 'voice_ai', icon: 'mic', emoji: '🎤', label: 'AI Voice Control', labelUr: 'اے آئی وائس', price: 100, category: 'ai', freeIncluded: false },
  { id: 'chat_ai', icon: 'smart-toy', emoji: '🤖', label: 'AI Chat Assistant', labelUr: 'اے آئی چیٹ', price: 80, category: 'ai', freeIncluded: false },
  { id: 'insights', icon: 'auto-awesome', emoji: '✨', label: 'AI Business Insights', labelUr: 'کاروباری بصیرت', price: 60, category: 'ai', freeIncluded: false },
  { id: 'chatgpt', icon: 'psychology', emoji: '🧠', label: 'ChatGPT Integration', labelUr: 'چیٹ جی پی ٹی', price: 150, category: 'ai', freeIncluded: false },
  { id: 'pdf_invoice', icon: 'picture-as-pdf', emoji: '📑', label: 'PDF Invoices', labelUr: 'پی ڈی ایف انوائس', price: 40, category: 'business', freeIncluded: false },
  { id: 'excel_export', icon: 'table-chart', emoji: '📊', label: 'Excel Export', labelUr: 'ایکسل ایکسپورٹ', price: 30, category: 'business', freeIncluded: false },
  { id: 'cloud_backup', icon: 'cloud-upload', emoji: '☁️', label: 'Auto Cloud Backup', labelUr: 'کلاؤڈ بیک اپ', price: 70, category: 'business', freeIncluded: false },
  { id: 'multi_biz', icon: 'business', emoji: '🏢', label: 'Multi-Business (5)', labelUr: 'ملٹی بزنس', price: 90, category: 'business', freeIncluded: false },
  { id: 'staff', icon: 'group', emoji: '👨‍👩‍👦', label: 'Staff Accounts (5)', labelUr: 'اسٹاف اکاؤنٹس', price: 80, category: 'business', freeIncluded: false },
  { id: 'bulk_sms', icon: 'send', emoji: '📱', label: 'Unlimited SMS/WA', labelUr: 'لامحدود ایس ایم ایس', price: 50, category: 'business', freeIncluded: false },
  { id: 'advanced_charts', icon: 'analytics', emoji: '📈', label: 'Advanced Charts', labelUr: 'ایڈوانس چارٹس', price: 40, category: 'business', freeIncluded: false },
  { id: 'priority_support', icon: 'support-agent', emoji: '🎧', label: 'Priority Support', labelUr: 'ترجیحی سپورٹ', price: 40, category: 'support', freeIncluded: false },
  { id: 'training', icon: 'school', emoji: '🎓', label: 'Personal Training', labelUr: 'ذاتی تربیت', price: 60, category: 'support', freeIncluded: false },
];

const PRESETS = [
  { id: 'starter', name: 'Starter', nameUr: 'شروعاتی', emoji: '🌱', ids: ['unlimited_cust', 'unlimited_txn', 'multi_lang', 'pdf_invoice'] },
  { id: 'business', name: 'Business', nameUr: 'کاروبار', emoji: '💼', ids: ['unlimited_cust', 'unlimited_txn', 'multi_lang', 'pdf_invoice', 'excel_export', 'cloud_backup', 'advanced_charts', 'priority_support'] },
  { id: 'pro', name: 'Pro AI', nameUr: 'پرو اے آئی', emoji: '🚀', ids: INITIAL_FEATURES.map(f => f.id) },
];

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language, isRTL, currentTheme, formatCurrency } = useApp();
  const { showAlert } = useAlert();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [features, setFeatures] = useState<PricedFeature[]>(INITIAL_FEATURES);
  const [selectedIds, setSelectedIds] = useState<string[]>(PRESETS[1].ids);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editingBase, setEditingBase] = useState(false);
  const [baseMonthly, setBaseMonthly] = useState('299');
  const [showFAQ, setShowFAQ] = useState<number | null>(null);

  const yearlyDiscount = 0.3; // 30%

  const totalMonthly = useMemo(
    () => selectedIds.reduce((sum, id) => {
      const f = features.find(x => x.id === id);
      return sum + (f ? f.price : 0);
    }, 0),
    [selectedIds, features]
  );

  const displayPrice = billing === 'monthly' ? totalMonthly : Math.round(totalMonthly * 12 * (1 - yearlyDiscount));
  const yearlyEquivMonthly = Math.round(totalMonthly * (1 - yearlyDiscount));
  const yearlySavings = Math.round(totalMonthly * 12 * yearlyDiscount);

  const toggleFeature = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    Haptics.selectionAsync().catch(() => {});
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedIds(preset.ids);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const saveFeaturePrice = () => {
    if (!editingId) return;
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      showAlert(t.error, language === 'ur' ? 'صحیح قیمت درج کریں' : 'Enter valid price');
      return;
    }
    setFeatures(prev => prev.map(f => f.id === editingId ? { ...f, price: newPrice } : f));
    setEditingId(null);
    setEditPrice('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const startEditPrice = (feature: PricedFeature) => {
    setEditingId(feature.id);
    setEditPrice(String(feature.price));
  };

  const categoryLabels = {
    core: { label: 'Core Features', labelUr: 'بنیادی', icon: '⚙️', color: '#0D7C4A' },
    ai: { label: 'AI Features', labelUr: 'اے آئی', icon: '🤖', color: '#7C3AED' },
    business: { label: 'Business Tools', labelUr: 'کاروباری اوزار', icon: '💼', color: '#D97706' },
    support: { label: 'Support', labelUr: 'سپورٹ', icon: '🎧', color: '#2563EB' },
  };

  const groupedFeatures = features.reduce((groups, f) => {
    if (!groups[f.category]) groups[f.category] = [];
    groups[f.category].push(f);
    return groups;
  }, {} as Record<string, PricedFeature[]>);

  return (
    <SafeAreaView edges={['top']} style={[s.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header + Hero */}
        <LinearGradient colors={currentTheme.primaryGradient as any} style={s.hero}>
          <View style={[s.headerRow, isRTL && s.rtlRow]}>
            <Pressable onPress={() => router.back()} style={s.hBtn} hitSlop={8}>
              <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFF" />
            </Pressable>
            <Text style={s.hTitle}>💎 {language === 'ur' ? 'پلانز اور قیمت' : 'Plans & Pricing'}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={s.heroBadge}>
            <MaterialIcons name="tune" size={16} color="#FFD700" />
            <Text style={s.heroBadgeText}>
              {language === 'ur' ? 'اپنا پلان بنائیں' : 'Build Your Own Plan'}
            </Text>
          </View>

          <Text style={s.heroTitle}>
            {language === 'ur' ? 'صرف وہی چنیں جو چاہیے' : 'Pay only for what you need'}
          </Text>
          <Text style={s.heroSub}>
            {language === 'ur'
              ? 'ہر فیچر کی الگ قیمت • قابل ترمیم • آسان'
              : 'Per-feature pricing • Customizable • Transparent'}
          </Text>

          {/* Billing Toggle */}
          <View style={s.billingToggle}>
            <Pressable
              style={[s.billBtn, billing === 'monthly' && s.billBtnActive]}
              onPress={() => setBilling('monthly')}
            >
              <Text style={[s.billBtnText, billing === 'monthly' && { color: currentTheme.primary }]}>
                {language === 'ur' ? 'ماہانہ' : 'Monthly'}
              </Text>
            </Pressable>
            <Pressable
              style={[s.billBtn, billing === 'yearly' && s.billBtnActive]}
              onPress={() => setBilling('yearly')}
            >
              <Text style={[s.billBtnText, billing === 'yearly' && { color: currentTheme.primary }]}>
                {language === 'ur' ? 'سالانہ' : 'Yearly'}
              </Text>
              <View style={s.saveBadge}>
                <Text style={s.saveBadgeText}>-30%</Text>
              </View>
            </Pressable>
          </View>

          {/* Live Price Display */}
          <View style={s.priceCard}>
            <View style={[s.priceRow, isRTL && s.rtlRow]}>
              <View>
                <Text style={s.priceLabel}>
                  {language === 'ur' ? 'آپ کی قیمت' : 'Your Price'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={s.priceValue}>{formatCurrency(displayPrice)}</Text>
                  <Text style={s.pricePer}>/{billing === 'monthly' ? (language === 'ur' ? 'ماہ' : 'mo') : (language === 'ur' ? 'سال' : 'yr')}</Text>
                </View>
                {billing === 'yearly' && (
                  <Text style={s.priceSavings}>
                    💰 {language === 'ur' ? 'بچت' : 'Save'} {formatCurrency(yearlySavings)} • {formatCurrency(yearlyEquivMonthly)}/{language === 'ur' ? 'ماہ' : 'mo'}
                  </Text>
                )}
              </View>
              <View style={s.featureCountBadge}>
                <Text style={s.featureCountNum}>{selectedIds.length}</Text>
                <Text style={s.featureCountLbl}>{language === 'ur' ? 'فیچرز' : 'features'}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Presets */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, isRTL && s.rtlText]}>
            🎯 {language === 'ur' ? 'فوری پلان' : 'Quick Presets'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}>
            {PRESETS.map(preset => {
              const active = JSON.stringify(preset.ids.sort()) === JSON.stringify([...selectedIds].sort());
              return (
                <Pressable
                  key={preset.id}
                  style={[s.presetCard, active && { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary + '10' }]}
                  onPress={() => applyPreset(preset)}
                >
                  <Text style={{ fontSize: 26 }}>{preset.emoji}</Text>
                  <Text style={[s.presetName, active && { color: currentTheme.primary }]}>
                    {language === 'ur' ? preset.nameUr : preset.name}
                  </Text>
                  <Text style={s.presetCount}>
                    {preset.ids.length} {language === 'ur' ? 'فیچرز' : 'features'}
                  </Text>
                  {active && (
                    <View style={[s.presetActiveBadge, { backgroundColor: currentTheme.primary }]}>
                      <MaterialIcons name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Feature Categories */}
        {(Object.keys(groupedFeatures) as Array<keyof typeof categoryLabels>).map(cat => {
          const info = categoryLabels[cat];
          return (
            <View key={cat} style={s.section}>
              <View style={[s.catHead, isRTL && s.rtlRow]}>
                <Text style={{ fontSize: 20 }}>{info.icon}</Text>
                <Text style={[s.catTitle, isRTL && s.rtlText]}>
                  {language === 'ur' ? info.labelUr : info.label}
                </Text>
                <View style={[s.catBadge, { backgroundColor: info.color + '15' }]}>
                  <Text style={[s.catBadgeText, { color: info.color }]}>
                    {groupedFeatures[cat].filter(f => selectedIds.includes(f.id)).length}/{groupedFeatures[cat].length}
                  </Text>
                </View>
              </View>

              {groupedFeatures[cat].map(feature => {
                const active = selectedIds.includes(feature.id);
                return (
                  <View
                    key={feature.id}
                    style={[s.featRow, active && { borderColor: currentTheme.primary + '40', backgroundColor: currentTheme.primary + '05' }]}
                  >
                    <Pressable
                      style={[s.featToggle, isRTL && s.rtlRow]}
                      onPress={() => toggleFeature(feature.id)}
                    >
                      <View style={[s.featCheck, active && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}>
                        {active && <MaterialIcons name="check" size={14} color="#FFF" />}
                      </View>
                      <Text style={s.featEmoji}>{feature.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.featLabel, active && { color: currentTheme.primary }, isRTL && s.rtlText]}>
                          {language === 'ur' ? feature.labelUr : feature.label}
                        </Text>
                        {feature.freeIncluded && (
                          <View style={s.freeInc}>
                            <MaterialIcons name="check-circle" size={10} color="#16A34A" />
                            <Text style={s.freeIncText}>{language === 'ur' ? 'مفت شامل' : 'Free tier'}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <Pressable style={s.priceEditBtn} onPress={() => startEditPrice(feature)}>
                      <Text style={[s.priceEditText, active && { color: currentTheme.primary }]}>
                        {formatCurrency(feature.price)}
                        <Text style={{ fontSize: 10, fontWeight: '600', color: currentTheme.textMuted }}>/mo</Text>
                      </Text>
                      <MaterialIcons name="edit" size={11} color={currentTheme.textMuted} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Comparison Table */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, isRTL && s.rtlText]}>
            📊 {language === 'ur' ? 'موازنہ' : 'Free vs Your Plan'}
          </Text>
          <View style={s.compareCard}>
            <View style={[s.compareHead, { backgroundColor: currentTheme.backgroundSecondary }]}>
              <Text style={[s.compareCol, { flex: 1.5 }]}>{language === 'ur' ? 'فیچر' : 'Feature'}</Text>
              <Text style={s.compareCol}>{t.free}</Text>
              <Text style={[s.compareCol, { color: currentTheme.primary }]}>{language === 'ur' ? 'آپ' : 'Yours'}</Text>
            </View>
            {[
              { f: language === 'ur' ? 'گاہک' : 'Customers', free: '25', yours: selectedIds.includes('unlimited_cust') ? '∞' : '25' },
              { f: language === 'ur' ? 'لین دین' : 'Transactions', free: '100/mo', yours: selectedIds.includes('unlimited_txn') ? '∞' : '100' },
              { f: 'AI Voice', free: '—', yours: selectedIds.includes('voice_ai') ? '✓' : '—' },
              { f: 'AI Chat', free: '—', yours: selectedIds.includes('chat_ai') ? '✓' : '—' },
              { f: 'PDF Invoice', free: '—', yours: selectedIds.includes('pdf_invoice') ? '✓' : '—' },
              { f: 'Cloud Backup', free: '—', yours: selectedIds.includes('cloud_backup') ? '✓' : '—' },
              { f: language === 'ur' ? 'زبانیں' : 'Languages', free: '8', yours: '8+' },
            ].map((r, i) => (
              <View key={i} style={[s.compareRow, i % 2 === 0 && { backgroundColor: '#FAFCFB' }]}>
                <Text style={[s.compareCol, { flex: 1.5, textAlign: 'left', fontWeight: '600', color: currentTheme.textDark }]}>{r.f}</Text>
                <Text style={[s.compareCol, { color: currentTheme.textMuted }]}>{r.free}</Text>
                <Text style={[s.compareCol, { color: currentTheme.primary, fontWeight: '700' }]}>{r.yours}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, isRTL && s.rtlText]}>
            ❓ {language === 'ur' ? 'عام سوالات' : 'FAQs'}
          </Text>
          {[
            { q: language === 'ur' ? 'کیا میں کسی وقت پلان بدل سکتا ہوں؟' : 'Can I change my plan anytime?', a: language === 'ur' ? 'ہاں، آپ کسی بھی وقت فیچرز شامل یا ہٹا سکتے ہیں۔' : 'Yes, add or remove features anytime without penalty.' },
            { q: language === 'ur' ? 'میرا ڈیٹا محفوظ ہے؟' : 'Is my data safe?', a: language === 'ur' ? 'مکمل طور پر۔ سب کچھ انکرپٹڈ ہے۔' : 'Absolutely. All data is encrypted end-to-end.' },
            { q: language === 'ur' ? 'کیا رقم واپس ہو سکتی ہے؟' : 'Refund policy?', a: language === 'ur' ? '7 دن کی ضمانت' : '7-day money back guarantee, no questions asked.' },
          ].map((faq, i) => (
            <Pressable key={i} style={s.faqCard} onPress={() => setShowFAQ(showFAQ === i ? null : i)}>
              <View style={[s.faqHead, isRTL && s.rtlRow]}>
                <Text style={[s.faqQ, isRTL && s.rtlText]}>{faq.q}</Text>
                <MaterialIcons
                  name={showFAQ === i ? 'expand-less' : 'expand-more'}
                  size={22}
                  color={currentTheme.textMuted}
                />
              </View>
              {showFAQ === i && (
                <Text style={[s.faqA, isRTL && s.rtlText]}>{faq.a}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Guarantee */}
        <View style={s.guaranteeCard}>
          <LinearGradient colors={[currentTheme.primary + '15', currentTheme.primary + '05']} style={s.guarantee}>
            <MaterialIcons name="verified-user" size={32} color={currentTheme.primary} />
            <Text style={[s.guaranteeTitle, { color: currentTheme.primary }]}>
              {language === 'ur' ? '7 دن کی مکمل ضمانت' : '7-Day Money Back Guarantee'}
            </Text>
            <Text style={s.guaranteeSub}>
              {language === 'ur' ? 'مطمئن نہیں؟ مکمل رقم واپس' : 'Not satisfied? Get 100% refund'}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Sticky Upgrade Bar */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.stickyLabel}>
            {selectedIds.length} {language === 'ur' ? 'فیچرز • مجموعی' : 'features • Total'}
          </Text>
          <Text style={[s.stickyPrice, { color: currentTheme.primary }]}>
            {formatCurrency(displayPrice)}/{billing === 'monthly' ? 'mo' : 'yr'}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={() => showAlert(
            language === 'ur' ? 'اپ گریڈ' : 'Upgrade',
            language === 'ur' ? `${formatCurrency(displayPrice)}/${billing === 'monthly' ? 'ماہ' : 'سال'} پر اپ گریڈ کریں؟\nStripe کے ذریعے محفوظ ادائیگی۔` : `Upgrade to ${formatCurrency(displayPrice)}/${billing === 'monthly' ? 'mo' : 'yr'}?\nSecure payment via Stripe.`,
          )}
          disabled={selectedIds.length === 0}
        >
          <LinearGradient
            colors={selectedIds.length === 0 ? ['#94A3B8', '#64748B'] : (currentTheme.primaryGradient as any)}
            style={s.stickyBtn}
          >
            <MaterialIcons name="rocket-launch" size={18} color="#FFF" />
            <Text style={s.stickyBtnText}>
              {language === 'ur' ? 'اپ گریڈ کریں' : 'Upgrade Now'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Price Edit Modal */}
      <Modal visible={!!editingId} transparent animationType="fade" onRequestClose={() => setEditingId(null)}>
        <Pressable style={s.modalOv} onPress={() => setEditingId(null)}>
          <Pressable style={s.editCard}>
            <Text style={s.editTitle}>
              💰 {language === 'ur' ? 'قیمت میں ترمیم' : 'Edit Feature Price'}
            </Text>
            {editingId && (
              <>
                <View style={s.editFeatureRow}>
                  <Text style={{ fontSize: 26 }}>{features.find(f => f.id === editingId)?.emoji}</Text>
                  <Text style={s.editFeatureName}>
                    {language === 'ur'
                      ? features.find(f => f.id === editingId)?.labelUr
                      : features.find(f => f.id === editingId)?.label}
                  </Text>
                </View>
                <Text style={s.editLabel}>
                  {language === 'ur' ? 'ماہانہ قیمت (Rs.)' : 'Monthly Price (Rs.)'}
                </Text>
                <View style={s.editInputRow}>
                  <Text style={s.editCurr}>Rs.</Text>
                  <TextInput
                    style={s.editInput}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="numeric"
                    autoFocus
                    placeholder="0"
                    placeholderTextColor={currentTheme.textMuted}
                  />
                  <Text style={s.editPer}>/mo</Text>
                </View>
                <View style={s.editActions}>
                  <Pressable style={s.editCancel} onPress={() => setEditingId(null)}>
                    <Text style={s.editCancelText}>{t.cancel}</Text>
                  </Pressable>
                  <Pressable style={[s.editSave, { backgroundColor: currentTheme.primary }]} onPress={saveFeaturePrice}>
                    <MaterialIcons name="check" size={16} color="#FFF" />
                    <Text style={s.editSaveText}>{t.save}</Text>
                  </Pressable>
                </View>
              </>
            )}
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

  hero: {
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },

  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: 'rgba(255,215,0,0.18)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  heroBadgeText: { fontSize: 12, fontWeight: '800', color: '#FFD700' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center', marginTop: 12, letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 6, fontWeight: '500' },

  billingToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14, padding: 4, marginTop: 18, alignSelf: 'center', gap: 4,
  },
  billBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 11 },
  billBtnActive: { backgroundColor: '#FFF' },
  billBtnText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  saveBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  saveBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  priceCard: {
    marginTop: 18, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.8 },
  pricePer: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginLeft: 4 },
  priceSavings: { fontSize: 11, color: '#86EFAC', fontWeight: '700', marginTop: 4 },
  featureCountBadge: { alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.2)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  featureCountNum: { fontSize: 22, fontWeight: '800', color: '#FFD700' },
  featureCountLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },

  section: { marginTop: 26, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },

  presetCard: {
    width: 120, backgroundColor: '#FFF', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9', position: 'relative',
  },
  presetName: { fontSize: 13, fontWeight: '800', color: '#111827', marginTop: 8 },
  presetCount: { fontSize: 10, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
  presetActiveBadge: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },

  catHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111827' },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  catBadgeText: { fontSize: 11, fontWeight: '800' },

  featRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#F1F5F9',
  },
  featToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  featCheck: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  featEmoji: { fontSize: 20 },
  featLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  freeInc: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  freeIncText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  priceEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
  priceEditText: { fontSize: 14, fontWeight: '800', color: '#4B5563' },

  compareCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  compareHead: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14 },
  compareRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  compareCol: { flex: 1, fontSize: 12, fontWeight: '700', color: '#4B5563', textAlign: 'center' },

  faqCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: 13, fontWeight: '700', color: '#111827' },
  faqA: { fontSize: 12, color: '#4B5563', lineHeight: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },

  guaranteeCard: { marginHorizontal: 16, marginTop: 24, borderRadius: 20, overflow: 'hidden' },
  guarantee: { alignItems: 'center', padding: 24 },
  guaranteeTitle: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  guaranteeSub: { fontSize: 12, color: '#4B5563', marginTop: 4, fontWeight: '600' },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 8 }, default: {},
    }),
  },
  stickyLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
  stickyPrice: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  stickyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14 },
  stickyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  modalOv: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editCard: { width: '100%', maxWidth: 340, backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  editTitle: { fontSize: 17, fontWeight: '800', color: '#111827', textAlign: 'center' },
  editFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12 },
  editFeatureName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#111827' },
  editLabel: { fontSize: 11, fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  editInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#F1F5F9' },
  editCurr: { fontSize: 15, fontWeight: '800', color: '#4B5563' },
  editInput: { flex: 1, fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  editPer: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  editCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  editCancelText: { fontSize: 13, fontWeight: '800', color: '#4B5563' },
  editSave: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  editSaveText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
});
