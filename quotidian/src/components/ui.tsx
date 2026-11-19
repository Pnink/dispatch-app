import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { goBack } from '../lib/nav';
import { color, font, layout, radius, space, type } from '../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Full-height page for modal screens: header with a close or back button, scrolling body. */
export function Screen({
  title,
  children,
  right,
  scroll = true,
  closeIcon = 'close',
  testID,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  scroll?: boolean;
  closeIcon?: 'close' | 'back';
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space[7] }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, { flex: 1, paddingBottom: insets.bottom + space[4] }]}>{children}</View>
  );
  return (
    <View style={styles.screen} testID={testID}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + space[2] : space[4] }]}>
        <IconButton
          icon={closeIcon === 'close' ? 'close' : 'chevron-back'}
          label={closeIcon === 'close' ? 'Close' : 'Back'}
          onPress={goBack}
          tone="surface"
        />
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerRight}>{right}</View>
      </View>
      {body}
    </View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  tone = 'glass',
  light = false,
  size = 44,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'glass' | 'surface' | 'plain';
  /** true when sitting on a light theme background */
  light?: boolean;
  size?: number;
  testID?: string;
}) {
  const fg = tone === 'glass' ? (light ? '#141414' : color.onGlass) : color.text;
  const bg =
    tone === 'glass' ? (light ? color.glassDark : color.glass) : tone === 'surface' ? color.surface2 : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={layout.hitSlop}
      testID={testID}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        styles.iconButton,
        pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
        focused && styles.focusRing,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={fg} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary' ? color.accent : variant === 'secondary' ? color.surface2 : 'transparent';
  const fg =
    variant === 'primary' ? color.onAccent : variant === 'danger' ? color.danger : variant === 'ghost' ? color.textMuted : color.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      aria-disabled={!!disabled}
      testID={testID}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.button,
        { backgroundColor: bg },
        variant === 'danger' && { borderWidth: 1, borderColor: color.border },
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.4 },
        focused && styles.focusRing,
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({
  icon,
  label,
  detail,
  onPress,
  testID,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      testID={testID}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.row,
        pressed && { backgroundColor: color.surface2 },
        focused && styles.focusRing,
      ]}
    >
      <Ionicons name={icon} size={20} color={color.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={color.textMuted} />
    </Pressable>
  );
}

export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: space[5] }}>
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      role="checkbox"
      aria-checked={selected}
      testID={testID}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && { opacity: 0.8 },
        focused && styles.focusRing,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={selected ? color.onAccent : color.text} /> : null}
      <Text style={[styles.chipLabel, selected && { color: color.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  display,
  onChange,
  min,
  max,
  step = 1,
  testID,
}: {
  label: string;
  value: number;
  display?: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  testID?: string;
}) {
  return (
    <View style={styles.stepper} testID={testID}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <IconButton
          icon="remove"
          label={`Decrease ${label.toLowerCase()}`}
          tone="surface"
          size={36}
          onPress={() => onChange(Math.max(min, value - step))}
        />
        <Text style={styles.stepperValue} accessibilityLiveRegion="polite">
          {display ?? String(value)}
        </Text>
        <IconButton
          icon="add"
          label={`Increase ${label.toLowerCase()}`}
          tone="surface"
          size={36}
          onPress={() => onChange(Math.min(max, value + step))}
        />
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={color.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}

/** A short message that fades in and out. Pass a new `message` object to show it again. */
export function Toast({ message }: { message: { text: string; key: number } | null }) {
  const opacity = useAnimatedValue(0);
  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay(1400),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [message, opacity]);
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]} accessibilityLiveRegion="polite">
      <Text style={styles.toastText} accessibilityRole="alert">
        {message?.text ?? ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingBottom: space[3],
  },
  title: { flex: 1, color: color.text, fontFamily: font.sansSemi, ...type.lg },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  body: { paddingHorizontal: space[4], paddingTop: space[2] },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  focusRing: { outlineStyle: 'solid', outlineWidth: 2, outlineColor: color.accent, outlineOffset: 2 } as ViewStyle,
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[5],
  },
  buttonLabel: { fontFamily: font.sansSemi, ...type.base },
  group: { backgroundColor: color.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 52,
    paddingHorizontal: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  rowLabel: { flex: 1, color: color.text, fontFamily: font.sansMedium, ...type.base },
  rowDetail: { color: color.textMuted, fontFamily: font.sans, ...type.sm },
  sectionTitle: {
    color: color.textMuted,
    fontFamily: font.sansSemi,
    ...type.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: space[2],
    marginTop: space[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.border,
  },
  chipSelected: { backgroundColor: color.accent, borderColor: color.accent },
  chipLabel: { color: color.text, fontFamily: font.sansMedium, ...type.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  stepperLabel: { color: color.text, fontFamily: font.sansMedium, ...type.base },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  stepperValue: {
    color: color.text,
    fontFamily: font.sansSemi,
    ...type.base,
    minWidth: 76,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  empty: { alignItems: 'center', paddingVertical: space[7], paddingHorizontal: space[5], gap: space[3] },
  emptyTitle: { color: color.text, fontFamily: font.sansSemi, ...type.lg, textAlign: 'center' },
  emptyBody: { color: color.textMuted, fontFamily: font.sans, ...type.base, textAlign: 'center' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    backgroundColor: 'rgba(20,20,22,0.92)',
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    borderRadius: radius.pill,
  },
  toastText: { color: color.text, fontFamily: font.sansMedium, ...type.sm },
});
