import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius } from '../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  style?: ViewStyle;
  valueColor?: string;
}

export function StatCard({ label, value, sub, accent, style, valueColor }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accentValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
  },
  accentValue: {
    color: colors.accent,
  },
  sub: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
});
