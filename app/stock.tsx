import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import { useAlert } from '@/template';
import type { ItemRate } from '../services/mockData';

const EMOJI_LIST = [
  '🌾', '🍯', '🍚', '🛒', '🫘', '☕', '🥛', '🌶', '🧂', '🧼',
  '🥔', '🧅', '🍞', '🍅', '🥕', '🥒', '🥬', '🧊', '🍎', '🍌',
  '🥭', '🍇', '🍊', '🥥', '🌽', '🍗', '🥩', '🐟', '🥚', '🧀',
  '🧴', '🧻', '📦', '💊', '🍬', '🍫', '🥤', '🧃', '🍪', '🍰',
];

const CATEGORIES = [
  'Flour', 'Sugar', 'Rice', 'Oil & Ghee', 'Pulses',
  'Beverages', 'Dairy', 'Spices', 'Household', 'Snacks',
  'Fruits', 'Vegetables', 'Meat', 'Bakery', 'Other',
];

const UNITS = ['kg', 'g', 'bag', 'tin', 'bottle', 'pack', 'piece', 'litre', 'dozen'];

const getItemEmoji = (item: { name: string; category?: string }): string => {
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  if (name.includes('atta') || cat.includes('flour')) return '🌾';
  if (name.includes('cheeni') || cat.includes('sugar')) return '🍯';
  if (name.includes('rice')) return '🍚';
  if (name.includes('ghee') || name.includes('oil')) return '🛒';
  if (name.includes('daal')) return '🫘';
  if (name.includes('chai')) return '☕';
  if (name.includes('doodh') || cat.includes('dairy')) return '🥛';
  if (cat.includes('spices') || name.includes('mirch') || name.includes('haldi')) return '🌶';
  if (name.includes('namak')) return '🧂';
  if (cat.includes('household') || name.includes('sabun') || name.includes('vim')) return '🧼';
  return '📦';
};

const daysAgo = (dateStr: string | undefined, lang: string): string => {
  if (!dateStr) return lang === 'ur' ? 'ابھی' : 'Just now';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return lang === 'ur' ? 'آج' : 'Today';
  if (days === 1) return lang === 'ur' ? 'کل' : 'Yesterday';
  if (lang === 'ur') return `${days} دن پہلے`;
  return `${days}d ago`;
};

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itemRates, addItemRate, updateItemRate, deleteItemRate, formatCurrency, language, isRTL } = useApp();
  const { showAlert } = useAlert();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<ItemRate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ItemRate | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formCategory, setFormCategory] = useState('Other');
  const [formEmoji, setFormEmoji] = useState('📦');
  const [formImage, setFormImage] = useState<string | undefined>(undefined);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    itemRates.forEach(item => cats.add(item.category));
    return ['all', ...Array.from(cats).sort()];
  }, [itemRates]);

  const filteredItems = useMemo(() => {
    return itemRates
      .filter(item => selectedCat === 'all' || item.category === selectedCat)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [itemRates, selectedCat, searchQuery]);

  const stats = useMemo(() => {
    const totalValue = itemRates.reduce((s, r) => s + r.rate, 0);
    const priceUp = itemRates.filter(r => r.previousRate && r.rate > r.previousRate).length;
    const priceDown = itemRates.filter(r => r.previousRate && r.rate < r.previousRate).length;
    return { total: itemRates.length, totalValue, priceUp, priceDown, categories: categories.length - 1 };
  }, [itemRates, categories]);

  const openEdit = (item: ItemRate) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormRate(String(item.rate));
    setFormUnit(item.unit);
    setFormCategory(item.category);
    setFormEmoji(getItemEmoji(item));
    setFormImage(item.image);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormRate('');
    setFormUnit('kg');
    setFormCategory('Other');
    setFormEmoji('📦');
    setFormImage(undefined);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setShowEmojiPicker(false);
    setShowImageOptions(false);
    setFormImage(undefined);
  };

  const pickFromCamera = async () => {
    setShowImageOptions(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert(
          language === 'ur' ? 'اجازت درکار' : 'Permission required',
          language === 'ur' ? 'کیمرہ استعمال کرنے کی اجازت درکار ہے' : 'Camera access is needed to take photos'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]) {
        setFormImage(result.assets[0].uri);
      }
    } catch (err: any) {
      showAlert(language === 'ur' ? 'خرابی' : 'Error', err?.message || 'Camera unavailable');
    }
  };

  const pickFromGallery = async () => {
    setShowImageOptions(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert(
          language === 'ur' ? 'اجازت درکار' : 'Permission required',
          language === 'ur' ? 'گیلری تک رسائی درکار ہے' : 'Gallery access needed'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled && result.assets?.[0]) {
        setFormImage(result.assets[0].uri);
      }
    } catch (err: any) {
      showAlert(language === 'ur' ? 'خرابی' : 'Error', err?.message || 'Gallery unavailable');
    }
  };

  const removeImage = () => {
    setShowImageOptions(false);
    setFormImage(undefined);
  };

  const handleSave = () => {
    const rate = parseFloat(formRate);
    if (!formName.trim() || !rate || rate <= 0) {
      showAlert(
        language === 'ur' ? 'خرابی' : 'Missing Info',
        language === 'ur' ? 'نام اور صحیح ریٹ درکار ہے' : 'Name and a valid rate are required'
      );
      return;
    }

    if (editingItem) {
      updateItemRate(editingItem.id, {
        name: formName.trim(),
        rate,
        unit: formUnit,
        category: formCategory,
        image: formImage,
      });
    } else {
      addItemRate({
        name: formName.trim(),
        rate,
        unit: formUnit,
        category: formCategory,
        image: formImage,
      });
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    deleteItemRate(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
  };

  const quickAdjust = (item: ItemRate, deltaPct: number) => {
    const newRate = Math.max(1, Math.round(item.rate * (1 + deltaPct / 100)));
    updateItemRate(item.id, { rate: newRate });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#0A6B3F', '#0D7C4A', '#065F37']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={[styles.headerRow, isRTL && styles.rtlRow]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
            <MaterialIcons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {language === 'ur' ? 'ریٹ بک' : 'Rate Book'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {language === 'ur'
                ? `${stats.total} اشیاء • ${stats.categories} زمرے`
                : `${stats.total} items • ${stats.categories} categories`}
            </Text>
          </View>
          <Pressable onPress={openAdd} style={styles.headerAddBtn} hitSlop={8}>
            <MaterialIcons name="add" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* Mini Stat Row */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <MaterialIcons name="inventory-2" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.miniStatValue}>{stats.total}</Text>
            <Text style={styles.miniStatLabel}>
              {language === 'ur' ? 'کل اشیاء' : 'Items'}
            </Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <MaterialIcons name="arrow-upward" size={16} color="#FCA5A5" />
            <Text style={styles.miniStatValue}>{stats.priceUp}</Text>
            <Text style={styles.miniStatLabel}>
              {language === 'ur' ? 'ریٹ اوپر' : 'Price Up'}
            </Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <MaterialIcons name="arrow-downward" size={16} color="#86EFAC" />
            <Text style={styles.miniStatValue}>{stats.priceDown}</Text>
            <Text style={styles.miniStatLabel}>
              {language === 'ur' ? 'ریٹ نیچے' : 'Price Down'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, isRTL && styles.rtlText]}
            placeholder={language === 'ur' ? 'اشیاء تلاش کریں...' : 'Search items...'}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map(cat => {
            const isActive = selectedCat === cat;
            const label = cat === 'all' ? (language === 'ur' ? 'تمام' : 'All') : cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCat(cat)}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && styles.chipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Item List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏷️</Text>
            <Text style={[styles.emptyTitle, isRTL && styles.rtlText]}>
              {searchQuery
                ? language === 'ur' ? 'کوئی نتیجہ نہیں' : 'No results found'
                : language === 'ur' ? 'کوئی ریٹ نہیں' : 'No rates added yet'}
            </Text>
            <Text style={[styles.emptySubtitle, isRTL && styles.rtlText]}>
              {language === 'ur'
                ? 'پہلا آئٹم شامل کرنے کے لیے + دبائیں'
                : 'Tap + to add your first item'}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={openAdd}>
              <MaterialIcons name="add" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>
                {language === 'ur' ? 'نیا آئٹم' : 'Add Item'}
              </Text>
            </Pressable>
          </View>
        ) : (
          filteredItems.map(item => {
            const emoji = getItemEmoji(item);
            const hasChange = item.previousRate && item.previousRate !== item.rate;
            const isUp = hasChange && item.rate > (item.previousRate || 0);
            const pct = hasChange ? Math.abs(((item.rate - (item.previousRate || 0)) / (item.previousRate || 1)) * 100) : 0;

            return (
              <View key={item.id} style={styles.rateCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.rateMain,
                    pressed && { backgroundColor: theme.background },
                    isRTL && styles.rtlRow,
                  ]}
                  onPress={() => openEdit(item)}
                >
                  <View style={styles.emojiCircle}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" transition={150} />
                    ) : (
                      <Text style={styles.emojiText}>{emoji}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[styles.itemName, isRTL && styles.rtlText]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.itemMeta, isRTL && styles.rtlRow]}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.category}</Text>
                      </View>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>{daysAgo(item.lastUpdated, language)}</Text>
                    </View>
                  </View>
                  <View style={styles.rateCol}>
                    <Text style={styles.priceText}>{formatCurrency(item.rate)}</Text>
                    <Text style={styles.unitText}>/{item.unit}</Text>
                    {hasChange ? (
                      <View
                        style={[
                          styles.changeBadge,
                          { backgroundColor: isUp ? '#FEE2E2' : '#DCFCE7' },
                        ]}
                      >
                        <MaterialIcons
                          name={isUp ? 'arrow-upward' : 'arrow-downward'}
                          size={10}
                          color={isUp ? '#DC2626' : '#16A34A'}
                        />
                        <Text
                          style={[
                            styles.changeText,
                            { color: isUp ? '#DC2626' : '#16A34A' },
                          ]}
                        >
                          {pct.toFixed(1)}%
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                {/* Quick Actions Row */}
                <View style={[styles.actionsRow, isRTL && styles.rtlRow]}>
                  <Pressable
                    style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => quickAdjust(item, -5)}
                  >
                    <MaterialIcons name="remove" size={14} color="#16A34A" />
                    <Text style={[styles.quickBtnText, { color: '#16A34A' }]}>5%</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => quickAdjust(item, 5)}
                  >
                    <MaterialIcons name="add" size={14} color="#DC2626" />
                    <Text style={[styles.quickBtnText, { color: '#DC2626' }]}>5%</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.primary + '15' }, pressed && { opacity: 0.7 }]}
                    onPress={() => openEdit(item)}
                  >
                    <MaterialIcons name="edit" size={15} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                      {language === 'ur' ? 'ترمیم' : 'Edit'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.creditLight }, pressed && { opacity: 0.7 }]}
                    onPress={() => setShowDeleteConfirm(item)}
                  >
                    <MaterialIcons name="delete-outline" size={15} color={theme.credit} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        onPress={openAdd}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 20 },
          pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
        ]}
      >
        <LinearGradient colors={['#0D7C4A', '#065F37']} style={styles.fabGradient}>
          <MaterialIcons name="add" size={26} color="#FFF" />
        </LinearGradient>
      </Pressable>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <LinearGradient
              colors={[theme.primary, '#065F37']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalHeaderTitle}>
                {editingItem
                  ? language === 'ur' ? 'ریٹ ترمیم' : 'Edit Rate'
                  : language === 'ur' ? 'نیا آئٹم' : 'Add New Item'}
              </Text>
              <Pressable onPress={closeModal} style={styles.modalClose} hitSlop={8}>
                <MaterialIcons name="close" size={22} color="#FFF" />
              </Pressable>
            </LinearGradient>

            <ScrollView
              style={{ maxHeight: 500 }}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Image / Emoji Picker Trigger */}
              <View style={styles.emojiRow}>
                <Pressable
                  style={styles.emojiPreview}
                  onPress={() => setShowImageOptions(true)}
                >
                  {formImage ? (
                    <Image source={{ uri: formImage }} style={styles.emojiPreviewImg} contentFit="cover" transition={150} />
                  ) : (
                    <Text style={styles.emojiPreviewText}>{formEmoji}</Text>
                  )}
                  <View style={styles.emojiEditIcon}>
                    <MaterialIcons name="camera-alt" size={12} color="#FFF" />
                  </View>
                </Pressable>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.fieldLabel}>
                    {language === 'ur' ? 'آئٹم کا نام' : 'Item Name'}
                  </Text>
                  <TextInput
                    style={[styles.input, isRTL && styles.rtlText]}
                    placeholder={language === 'ur' ? 'مثال: آٹا 10 کلو' : 'e.g. Atta (10kg)'}
                    placeholderTextColor={theme.textMuted}
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>
              </View>

              {/* Image / Emoji option chooser */}
              <View style={styles.imgOptRow}>
                <Pressable style={styles.imgOptBtn} onPress={pickFromCamera}>
                  <MaterialIcons name="camera-alt" size={16} color={theme.primary} />
                  <Text style={styles.imgOptBtnText}>
                    {language === 'ur' ? 'کیمرہ' : 'Camera'}
                  </Text>
                </Pressable>
                <Pressable style={styles.imgOptBtn} onPress={pickFromGallery}>
                  <MaterialIcons name="photo-library" size={16} color={theme.primary} />
                  <Text style={styles.imgOptBtnText}>
                    {language === 'ur' ? 'گیلری' : 'Gallery'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.imgOptBtn}
                  onPress={() => { setShowEmojiPicker(!showEmojiPicker); setShowImageOptions(false); }}
                >
                  <MaterialIcons name="emoji-emotions" size={16} color={theme.primary} />
                  <Text style={styles.imgOptBtnText}>
                    {language === 'ur' ? 'ایموجی' : 'Emoji'}
                  </Text>
                </Pressable>
                {formImage ? (
                  <Pressable style={[styles.imgOptBtn, { backgroundColor: theme.creditLight }]} onPress={removeImage}>
                    <MaterialIcons name="delete-outline" size={16} color={theme.credit} />
                  </Pressable>
                ) : null}
              </View>

              {/* Emoji Grid */}
              {showEmojiPicker ? (
                <View style={styles.emojiGrid}>
                  {EMOJI_LIST.map(em => (
                    <Pressable
                      key={em}
                      style={[
                        styles.emojiOption,
                        formEmoji === em && styles.emojiOptionActive,
                      ]}
                      onPress={() => {
                        setFormEmoji(em);
                        setShowEmojiPicker(false);
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{em}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {/* Rate + Unit Row */}
              <View style={[styles.rateRow, isRTL && styles.rtlRow]}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.fieldLabel}>
                    {language === 'ur' ? 'ریٹ (روپے)' : 'Rate (Rs.)'}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.inputLarge, isRTL && styles.rtlText]}
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    value={formRate}
                    onChangeText={setFormRate}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                  <Text style={styles.fieldLabel}>
                    {language === 'ur' ? 'یونٹ' : 'Unit'}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {UNITS.map(u => (
                      <Pressable
                        key={u}
                        style={[styles.unitChip, formUnit === u && styles.unitChipActive]}
                        onPress={() => setFormUnit(u)}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            formUnit === u && styles.unitChipTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Preview Card */}
              {formRate ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>
                    {language === 'ur' ? 'پیش نظارہ' : 'Preview'}
                  </Text>
                  <Text style={styles.previewPrice}>
                    {formatCurrency(parseFloat(formRate) || 0)}/{formUnit}
                  </Text>
                  {editingItem && editingItem.rate !== parseFloat(formRate) ? (
                    <Text style={styles.previewPrev}>
                      {language === 'ur' ? 'پہلے:' : 'Previous:'} {formatCurrency(editingItem.rate)}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* Category */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                {language === 'ur' ? 'زمرہ' : 'Category'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.catChip, formCategory === c && styles.catChipActive]}
                    onPress={() => setFormCategory(c)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        formCategory === c && styles.catChipTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {editingItem ? (
                <Pressable
                  style={({ pressed }) => [styles.modalDeleteBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => {
                    setShowModal(false);
                    setShowDeleteConfirm(editingItem);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={20} color={theme.credit} />
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
                onPress={closeModal}
              >
                <Text style={styles.modalCancelText}>
                  {language === 'ur' ? 'منسوخ' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalSaveBtn, pressed && { opacity: 0.9 }]}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={[theme.primary, '#065F37']}
                  style={styles.modalSaveGradient}
                >
                  <MaterialIcons name="check" size={18} color="#FFF" />
                  <Text style={styles.modalSaveText}>
                    {editingItem
                      ? language === 'ur' ? 'اپ ڈیٹ' : 'Update'
                      : language === 'ur' ? 'محفوظ کریں' : 'Save Item'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <MaterialIcons name="warning-amber" size={32} color={theme.credit} />
            </View>
            <Text style={styles.confirmTitle}>
              {language === 'ur' ? 'حذف کریں؟' : 'Delete Item?'}
            </Text>
            <Text style={styles.confirmDesc}>
              {language === 'ur'
                ? `کیا آپ واقعی "${showDeleteConfirm?.name}" کو حذف کرنا چاہتے ہیں؟`
                : `Are you sure you want to delete "${showDeleteConfirm?.name}"?`}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmCancel}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <Text style={styles.confirmCancelText}>
                  {language === 'ur' ? 'منسوخ' : 'Cancel'}
                </Text>
              </Pressable>
              <Pressable style={styles.confirmDelete} onPress={confirmDelete}>
                <MaterialIcons name="delete" size={16} color="#FFF" />
                <Text style={styles.confirmDeleteText}>
                  {language === 'ur' ? 'حذف' : 'Delete'}
                </Text>
              </Pressable>
            </View>
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

  // Gradient header
  gradientHeader: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Mini stats
  miniStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  miniStat: { flex: 1, alignItems: 'center', gap: 3 },
  miniStatValue: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  miniStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  miniStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },

  // Search
  searchBar: { paddingHorizontal: 16, marginTop: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.textDark },

  // Filter chips
  filterWrap: { marginTop: 14 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  chipTextActive: { color: '#FFF' },

  // Rate cards
  rateCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#0D7C4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  rateMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  emojiText: { fontSize: 24 },
  itemImage: { width: 48, height: 48, borderRadius: 16 },
  itemName: { fontSize: 15, fontWeight: '700', color: theme.textDark },
  itemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  catBadge: {
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catBadgeText: { fontSize: 10, fontWeight: '700', color: theme.primary },
  metaDot: { color: theme.textMuted, fontSize: 12 },
  metaText: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
  rateCol: { alignItems: 'flex-end' },
  priceText: { fontSize: 17, fontWeight: '800', color: theme.payment, letterSpacing: -0.3 },
  unitText: { fontSize: 11, color: theme.textMuted, marginTop: -1, fontWeight: '600' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  changeText: { fontSize: 10, fontWeight: '700' },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickBtnText: { fontSize: 11, fontWeight: '800' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Empty
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  emptySubtitle: { fontSize: 13, color: theme.textMuted, marginTop: 6, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: theme.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    fontWeight: '600',
  },
  inputLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
  },

  emojiRow: { flexDirection: 'row', alignItems: 'flex-end' },
  emojiPreview: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.primary + '30',
    position: 'relative',
  },
  emojiPreviewText: { fontSize: 32 },
  emojiPreviewImg: { width: 68, height: 68, borderRadius: 20 },
  imgOptRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  imgOptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.primary + '15',
    borderWidth: 1,
    borderColor: theme.primary + '25',
  },
  imgOptBtnText: { fontSize: 12, fontWeight: '700', color: theme.primary },
  emojiEditIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  emojiOption: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  emojiOptionActive: {
    backgroundColor: theme.primary + '20',
    borderColor: theme.primary,
  },

  rateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.borderLight,
    minWidth: 44,
    alignItems: 'center',
  },
  unitChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  unitChipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  unitChipTextActive: { color: '#FFF' },

  previewCard: {
    backgroundColor: theme.paymentLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.payment + '30',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.payment,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  previewPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.payment,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  previewPrev: { fontSize: 11, color: theme.textMuted, marginTop: 4 },

  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  catChipActive: { backgroundColor: theme.primary + '15', borderColor: theme.primary },
  catChipText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  catChipTextActive: { color: theme.primary, fontWeight: '700' },

  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  modalDeleteBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.creditLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  modalSaveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  modalSaveText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Confirm modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.creditLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textDark,
    marginTop: 14,
  },
  confirmDesc: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.background,
    alignItems: 'center',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  confirmDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.credit,
  },
  confirmDeleteText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
