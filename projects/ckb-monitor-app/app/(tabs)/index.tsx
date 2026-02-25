import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Network from 'expo-network';
import { colors, spacing, radius, typography } from '../../src/theme';
import { CKBNodeInfo, probeNode } from '../../src/services/ckbRpc';
import { scanSubnet, getSubnetBase, ScanProgress } from '../../src/services/networkScanner';
import { NodeCard } from '../../src/components/NodeCard';

const DEFAULT_NODE = '192.168.68.87';

export default function ScannerScreen() {
  const router = useRouter();
  const [subnet, setSubnet] = useState('192.168.68');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [foundNodes, setFoundNodes] = useState<CKBNodeInfo[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [customIP, setCustomIP] = useState(DEFAULT_NODE);
  const [addingManual, setAddingManual] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const detectSubnet = useCallback(async () => {
    try {
      const ip = await Network.getIpAddressAsync();
      if (ip && ip !== '0.0.0.0') {
        const base = getSubnetBase(ip);
        setSubnet(base);
        return base;
      }
    } catch (e) {
      console.log('Could not detect IP:', e);
    }
    return subnet;
  }, [subnet]);

  const startScan = useCallback(async () => {
    const base = await detectSubnet();
    setScanning(true);
    setHasScanned(false);
    setFoundNodes([]);
    setProgress({ total: 254, scanned: 0, found: 0, currentBatch: [] });

    abortRef.current = new AbortController();

    try {
      const nodes = await scanSubnet(
        base,
        (prog, nodes) => {
          setProgress(prog);
          setFoundNodes([...nodes]);
        },
        abortRef.current.signal
      );
      setFoundNodes(nodes);
    } catch (e) {
      console.log('Scan error:', e);
    } finally {
      setScanning(false);
      setHasScanned(true);
      setProgress(null);
    }
  }, [detectSubnet]);

  const stopScan = useCallback(() => {
    abortRef.current?.abort();
    setScanning(false);
    setHasScanned(true);
    setProgress(null);
  }, []);

  const addManualNode = useCallback(async () => {
    if (!customIP.trim()) return;
    setAddingManual(true);
    try {
      const node = await probeNode(customIP.trim());
      if (node) {
        setFoundNodes((prev) => {
          const existing = prev.find((n) => n.ip === node.ip);
          if (existing) {
            return prev.map((n) => (n.ip === node.ip ? node : n));
          }
          return [node, ...prev];
        });
        setHasScanned(true);
      } else {
        Alert.alert('Not Found', `No CKB node found at ${customIP.trim()}:8114`);
      }
    } catch (e) {
      Alert.alert('Error', `Failed to connect: ${e}`);
    } finally {
      setAddingManual(false);
    }
  }, [customIP]);

  const progressPct = progress
    ? Math.round((progress.scanned / progress.total) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Subnet row */}
      <View style={styles.subnetRow}>
        <View style={styles.subnetDisplay}>
          <Text style={styles.subnetLabel}>Subnet</Text>
          <Text style={styles.subnetValue}>{subnet}.0/24</Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, scanning && styles.btnStop]}
          onPress={scanning ? stopScan : startScan}
          activeOpacity={0.7}
        >
          {scanning ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : null}
          <Text style={styles.btnText}>{scanning ? 'Stop' : 'Scan'}</Text>
        </TouchableOpacity>
      </View>

      {/* Manual IP input */}
      <View style={styles.manualRow}>
        <TextInput
          style={styles.ipInput}
          value={customIP}
          onChangeText={setCustomIP}
          placeholder="192.168.68.87"
          placeholderTextColor={colors.textDim}
          keyboardType="numeric"
          selectTextOnFocus
          editable={!addingManual}
        />
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={addManualNode}
          disabled={addingManual}
          activeOpacity={0.7}
        >
          {addingManual ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {scanning && progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.scanned}/{progress.total} hosts · {progress.found} found
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {foundNodes.length === 0 && hasScanned && !scanning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No CKB nodes found</Text>
            <Text style={styles.emptySubtext}>
              Try adding a node manually above, or check your network
            </Text>
          </View>
        )}

        {foundNodes.length === 0 && !hasScanned && !scanning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⛏</Text>
            <Text style={styles.emptyText}>CKB Monitor</Text>
            <Text style={styles.emptySubtext}>
              Tap Scan to discover CKB nodes on your local network
            </Text>
          </View>
        )}

        {foundNodes.map((node) => (
          <NodeCard
            key={node.ip}
            node={node}
            onPress={() => {
              router.push({ pathname: '/(tabs)/monitor', params: { ip: node.ip } });
            }}
          />
        ))}
      </ScrollView>

      {foundNodes.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {foundNodes.length} node{foundNodes.length !== 1 ? 's' : ''} found · Tap to monitor
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  subnetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  subnetDisplay: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subnetLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subnetValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: typography.mono,
    marginTop: 2,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  btnStop: {
    backgroundColor: colors.error,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    minWidth: 60,
  },
  btnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 14,
  },
  btnTextSecondary: {
    color: colors.accent,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  ipInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: 14,
  },
  progressContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: typography.mono,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
