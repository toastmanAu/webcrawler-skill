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
import { colors, spacing, radius, typography } from '../../src/theme';
import { fetchStratumStats, formatHashrate, StratumStats, MinerStats } from '../../src/services/stratumApi';

const DEFAULT_HOST = '192.168.68.87'; // Pi5 stratum proxy
const DEFAULT_PORT = 8081;
const REFRESH_INTERVAL = 15000; // 15s for mining data

function MinerRow({ miner }: { miner: MinerStats }) {
  const acceptRate =
    miner.sharesAccepted + miner.sharesRejected > 0
      ? ((miner.sharesAccepted / (miner.sharesAccepted + miner.sharesRejected)) * 100).toFixed(1)
      : '—';

  return (
    <View style={styles.minerRow}>
      <View style={styles.minerHeader}>
        <View style={[styles.minerDot, { backgroundColor: miner.connected ? colors.success : colors.error }]} />
        <Text style={styles.minerName} numberOfLines={1}>
          {miner.name || miner.id}
        </Text>
        <Text style={styles.minerHashrate}>
          {formatHashrate(miner.hashrate, miner.hashrateUnit)}
        </Text>
      </View>
      <View style={styles.minerStats}>
        {miner.address && (
          <Text style={styles.minerAddr} numberOfLines={1}>{miner.address}</Text>
        )}
        <View style={styles.minerShareRow}>
          <Text style={styles.shareAccepted}>✓ {miner.sharesAccepted.toLocaleString()}</Text>
          <Text style={styles.shareRejected}>✗ {miner.sharesRejected.toLocaleString()}</Text>
          {acceptRate !== '—' && (
            <Text style={styles.shareRate}>{acceptRate}%</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function StratumScreen() {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [inputHost, setInputHost] = useState(DEFAULT_HOST);
  const [data, setData] = useState<StratumStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (h: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const stats = await fetchStratumStats(h, DEFAULT_PORT);
      setData(stats);
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect to stratum proxy');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const startAutoRefresh = useCallback((h: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    timerRef.current = setInterval(() => {
      fetchData(h, true);
    }, REFRESH_INTERVAL);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);
  }, [fetchData]);

  useEffect(() => {
    fetchData(host);
    startAutoRefresh(host);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [host]);

  const handleConnect = useCallback(() => {
    if (inputHost.trim()) {
      setHost(inputHost.trim());
    }
  }, [inputHost]);

  return (
    <View style={styles.container}>
      {/* Host input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.hostInput}
          value={inputHost}
          onChangeText={setInputHost}
          placeholder="192.168.68.87"
          placeholderTextColor={colors.textDim}
          keyboardType="numeric"
          returnKeyType="go"
          onSubmitEditing={handleConnect}
          selectTextOnFocus
        />
        <Text style={styles.portLabel}>:8081</Text>
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
        <View style={[styles.dot, { backgroundColor: data?.nodeHealthy ? colors.success : (error ? colors.error : colors.textDim) }]} />
        <Text style={styles.statusText}>
          {data ? `${host}:${DEFAULT_PORT}` : (loading ? 'Connecting…' : 'Disconnected')}
        </Text>
        {data && (
          <Text style={styles.countdown}>↻ {countdown}s</Text>
        )}
        {loading && !data && <ActivityIndicator size="small" color={colors.accent} />}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(host, true)}
            tintColor={colors.accent}
          />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure the stratum proxy is running on port {DEFAULT_PORT}
            </Text>
            <TouchableOpacity onPress={() => fetchData(host)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !data && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Connecting to stratum proxy…</Text>
          </View>
        )}

        {data && (
          <>
            {/* Overview cards */}
            <Text style={styles.sectionLabel}>Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Total Hashrate</Text>
                <Text style={styles.overviewValue}>
                  {formatHashrate(data.totalHashrate, data.totalHashrateUnit)}
                </Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>Miners</Text>
                <Text style={[styles.overviewValue, { color: colors.accent }]}>
                  {data.connectedMiners}
                </Text>
              </View>
            </View>

            {/* CKB Node status */}
            <View style={styles.nodeStatusCard}>
              <View style={styles.nodeStatusRow}>
                <Text style={styles.nodeStatusLabel}>CKB Node</Text>
                <View style={[styles.badge, {
                  backgroundColor: data.nodeHealthy ? colors.success + '22' : colors.error + '22',
                }]}>
                  <Text style={[styles.badgeText, { color: data.nodeHealthy ? colors.success : colors.error }]}>
                    {data.nodeHealthy ? '✓ Healthy' : '✗ Unhealthy'}
                  </Text>
                </View>
              </View>
              {data.node && data.node !== 'unknown' && (
                <Text style={styles.nodeUrl} numberOfLines={1}>{data.node}</Text>
              )}
            </View>

            {/* Miners list */}
            <Text style={styles.sectionLabel}>
              Miners ({data.miners.length})
            </Text>

            {data.miners.length === 0 ? (
              <View style={styles.noMinersCard}>
                <Text style={styles.noMinersIcon}>⛏</Text>
                <Text style={styles.noMinersText}>No miners connected</Text>
                <Text style={styles.noMinersSubtext}>
                  Point your miner at {host}:{DEFAULT_PORT}
                </Text>
              </View>
            ) : (
              <View style={styles.minersList}>
                {data.miners.map((miner, idx) => (
                  <MinerRow key={miner.id || idx} miner={miner} />
                ))}
              </View>
            )}

            <Text style={styles.lastUpdate}>
              Updated: {data.lastUpdated.toLocaleTimeString()} · Auto-refreshes every 15s
            </Text>
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
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  hostInput: {
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
  portLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: typography.mono,
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
  countdown: {
    fontSize: 11,
    color: colors.textDim,
  },
  scroll: { flex: 1 },
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
  overviewGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: typography.mono,
  },
  nodeStatusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  nodeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeStatusLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  nodeUrl: {
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.mono,
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
  minersList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  minerRow: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  minerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  minerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  minerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.mono,
  },
  minerHashrate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: typography.mono,
  },
  minerStats: {
    paddingLeft: 16 + spacing.sm,
    gap: 4,
  },
  minerAddr: {
    fontSize: 11,
    color: colors.textDim,
    fontFamily: typography.mono,
  },
  minerShareRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareAccepted: {
    fontSize: 12,
    color: colors.success,
  },
  shareRejected: {
    fontSize: 12,
    color: colors.error,
  },
  shareRate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  noMinersCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  noMinersIcon: {
    fontSize: 36,
  },
  noMinersText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  noMinersSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: typography.mono,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '55',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.error + '22',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '55',
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
  lastUpdate: {
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
