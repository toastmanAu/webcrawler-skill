import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, typography } from '../../src/theme';
import { CKBNodeInfo, getNodeDetails, parseEpoch } from '../../src/services/ckbRpc';
import { StatCard } from '../../src/components/StatCard';

const DEFAULT_IP = '192.168.68.87';
const REFRESH_INTERVAL = 30000; // 30 seconds

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

function formatNodeId(nodeId?: string): string {
  if (!nodeId) return 'unknown';
  // Show first 8 and last 8 chars
  if (nodeId.length > 20) {
    return `${nodeId.slice(0, 10)}…${nodeId.slice(-8)}`;
  }
  return nodeId;
}

export default function MonitorScreen() {
  const params = useLocalSearchParams<{ ip?: string }>();
  const [nodeIP, setNodeIP] = useState(params.ip || DEFAULT_IP);
  const [inputIP, setInputIP] = useState(params.ip || DEFAULT_IP);
  const [nodeData, setNodeData] = useState<CKBNodeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNodeData = useCallback(async (ip: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getNodeDetails(ip);
      if (data) {
        setNodeData(data);
        setLastRefresh(new Date());
        setCountdown(REFRESH_INTERVAL / 1000);
      } else {
        setError(`Cannot reach CKB node at ${ip}:8114`);
      }
    } catch (e: any) {
      setError(e?.message || 'Connection failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh timer
  const startAutoRefresh = useCallback((ip: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    timerRef.current = setInterval(() => {
      fetchNodeData(ip, true);
    }, REFRESH_INTERVAL);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);
  }, [fetchNodeData]);

  useEffect(() => {
    fetchNodeData(nodeIP);
    startAutoRefresh(nodeIP);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [nodeIP]);

  // Update IP from params when navigating from Scanner
  useEffect(() => {
    if (params.ip && params.ip !== nodeIP) {
      setNodeIP(params.ip);
      setInputIP(params.ip);
    }
  }, [params.ip]);

  const handleConnect = useCallback(() => {
    if (inputIP.trim()) {
      setNodeIP(inputIP.trim());
    }
  }, [inputIP]);

  const epochInfo = nodeData?.epoch ? parseEpoch(nodeData.epoch) : null;

  return (
    <View style={styles.container}>
      {/* IP Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.ipInput}
          value={inputIP}
          onChangeText={setInputIP}
          placeholder="192.168.68.87"
          placeholderTextColor={colors.textDim}
          keyboardType="numeric"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
          selectTextOnFocus
        />
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={handleConnect}
          activeOpacity={0.7}
        >
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={[styles.dot, { backgroundColor: nodeData ? colors.success : colors.error }]} />
        <Text style={styles.statusText}>
          {nodeData ? `${nodeIP}:8114` : (loading ? 'Connecting…' : 'Disconnected')}
        </Text>
        {nodeData && !loading && (
          <Text style={styles.refreshCountdown}>↻ {countdown}s</Text>
        )}
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNodeData(nodeIP, true)}
            tintColor={colors.accent}
          />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchNodeData(nodeIP)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !nodeData && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Connecting to node…</Text>
          </View>
        )}

        {nodeData && (
          <>
            {/* Primary stats */}
            <Text style={styles.sectionLabel}>Block Info</Text>
            <View style={styles.statsRow}>
              <StatCard
                label="Block Height"
                value={nodeData.blockNumber.toLocaleString()}
                accent
                style={styles.statFlex}
              />
              <StatCard
                label="Last Seen"
                value={formatTimeSince(nodeData.lastSeen)}
                sub="updated"
                style={styles.statFlex}
              />
            </View>

            {/* Network stats */}
            <Text style={styles.sectionLabel}>Network</Text>
            <View style={styles.statsRow}>
              <StatCard
                label="Peers"
                value={nodeData.peerCount}
                valueColor={nodeData.peerCount === 0 ? colors.error : colors.success}
                style={styles.statFlex}
              />
              <StatCard
                label="Latency"
                value={nodeData.latencyMs !== undefined ? `${nodeData.latencyMs}ms` : '—'}
                style={styles.statFlex}
              />
            </View>

            {/* Sync status */}
            <Text style={styles.sectionLabel}>Sync Status</Text>
            <View style={styles.syncCard}>
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>Status</Text>
                <View style={[styles.badge, { backgroundColor: nodeData.isIBD ? colors.warning + '33' : colors.success + '33' }]}>
                  <Text style={[styles.badgeText, { color: nodeData.isIBD ? colors.warning : colors.success }]}>
                    {nodeData.isIBD ? '⟳ Initial Sync' : '✓ Synced'}
                  </Text>
                </View>
              </View>

              {nodeData.chain && (
                <View style={styles.syncRow}>
                  <Text style={styles.syncLabel}>Chain</Text>
                  <Text style={styles.syncValue}>{nodeData.chain}</Text>
                </View>
              )}

              {epochInfo && (
                <View style={styles.syncRow}>
                  <Text style={styles.syncLabel}>Epoch</Text>
                  <Text style={styles.syncValue}>
                    {epochInfo.number} ({epochInfo.index}/{epochInfo.length})
                  </Text>
                </View>
              )}

              {nodeData.nodeId && (
                <View style={styles.syncRow}>
                  <Text style={styles.syncLabel}>Node ID</Text>
                  <Text style={[styles.syncValue, styles.mono]}>{formatNodeId(nodeData.nodeId)}</Text>
                </View>
              )}
            </View>

            {lastRefresh && (
              <Text style={styles.lastRefreshText}>
                Last refreshed: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.sm,
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
  connectBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  connectBtnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: typography.mono,
  },
  refreshCountdown: {
    fontSize: 11,
    color: colors.textDim,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statFlex: {
    flex: 1,
  },
  syncCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  syncValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  mono: {
    fontFamily: typography.mono,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '66',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  errorIcon: {
    fontSize: 32,
    color: colors.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.error + '22',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '66',
  },
  retryText: {
    color: colors.error,
    fontWeight: '600',
  },
  loadingState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  lastRefreshText: {
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
