import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';

export default function AddCustomerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addCustomer, t } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={theme.textDark} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.addCustomer}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Avatar Preview */}
          <View style={styles.avatarPreview}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {name.trim() ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </Text>
            </View>
          </View>

          {/* Name Input */}
          <Text style={styles.label}>{t.name} *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ahmed Khan"
            value={name}
            onChangeText={setName}
            autoFocus
            placeholderTextColor={theme.textMuted}
          />

          {/* Phone Input */}
          <Text style={styles.label}>{t.phone}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0300-1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={theme.textMuted}
          />

          {/* Address Input */}
          <Text style={styles.label}>{t.address}</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="e.g. Shop 12, Anarkali Bazaar"
            value={address}
            onChangeText={setAddress}
            multiline
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* Save Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <MaterialIcons name="person-add" size={20} color="#FFF" />
            <Text style={styles.saveButtonText}>{t.save}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarPreview: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.primary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    fontSize: 16,
    color: theme.textDark,
    borderWidth: 1,
    borderColor: theme.border,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
