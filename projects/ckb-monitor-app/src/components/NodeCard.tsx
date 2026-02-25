import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { CKBNodeInfo } from '../services/ckbRpc';

interface NodeCardProps {
  node: CKBNodeInfo;
  onPress?: () => void;
  selected?: boolean;
}

export function NodeCard({ node, onPress, selected }: NodeCardProps) {
  const syncColor = node.isIBD ? colors.warning : colors.success;
  const syncLabel = node.isIBD ? 'Syncing' : 'Synced';

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.ip}>{node.ip}</Text>
        <View style={[styles.statusDot, { backgroundColor: syncColor }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Block</Text>
          <Text style={styles.statValue}>{node.blockNumber.toLocaleString()}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Peers</Text>
          <Text style={styles.statValue}>{node.peerCount}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, { color: syncColor, fontSize: 12 }]}>{syncLabel}</Text>
        </View>
        {node.latencyMs !== undefined && (
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Ping</Text>
            <Text style={styles.statValue}>{node.latencyMs}ms</Text>
          </View>
        )}
      </View>

      {node.chain && (
        <Text style={styles.chain}>{node.chain}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  ip: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  chain: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: spacing.xs,
    fontFamily: 'monospace',
  },
});
