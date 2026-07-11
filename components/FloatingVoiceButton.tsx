import React from 'react';
import { Pressable, StyleSheet, Platform, View, Text, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';

interface Props {
  bottom?: number;
  right?: number;
  hideOnRoutes?: string[];
}

export function FloatingVoiceButton({ bottom = 92, right = 16, hideOnRoutes = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentTheme, language } = useApp();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const shouldHide = [
    '/voice-control',
    '/voice-entry',
    '/chat-assistant',
    '/app-lock',
    ...hideOnRoutes,
  ].some(r => pathname === r || pathname.endsWith(r));

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (shouldHide) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom, right }, { transform: [{ scale: scaleAnim }] }]}
    >
      <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]} />
      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/voice-control')}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
        hitSlop={8}
      >
        <LinearGradient
          colors={['#6366F1', '#4338CA', '#3730A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fab, { shadowColor: currentTheme?.primary || '#4338CA' }]}
        >
          <MaterialIcons name="mic" size={26} color="#FFF" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{language === 'ur' ? 'ب' : 'AI'}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pulse: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(99,102,241,0.25)',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 10 },
      default: {},
    }),
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFF',
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
});
