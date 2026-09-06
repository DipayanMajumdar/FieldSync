import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { getAllSubmissions, type LocalSubmission } from '../../services/database';
import { syncPendingSubmissions } from '../../services/sync';

export default function SyncScreen() {
  const [submissions, setSubmissions] = useState<LocalSubmission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ pending: 0, synced: 0, failed: 0 });

  const loadSubmissions = async () => {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data);
      
      const pending = data.filter(s => s.sync_status === 'pending').length;
      const synced = data.filter(s => s.sync_status === 'synced').length;
      const failed = data.filter(s => s.sync_status === 'failed').length;
      setStats({ pending, synced, failed });
    } catch (error) {
      console.error('Error loading submissions', error);
    }
  };

  useEffect(() => {
    loadSubmissions();
    // Auto-sync on mount if there are pending items
    handleSync();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingSubmissions();
      await loadSubmissions();
    } catch (error) {
      console.error('Sync error', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const renderItem = ({ item }: { item: LocalSubmission }) => {
    let statusColor = '#ffc107'; // pending
    if (item.sync_status === 'synced') statusColor = '#28a745';
    if (item.sync_status === 'failed') statusColor = '#dc3545';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.activityName}>{item.wbs_node_name || `Node ${item.wbs_node_id}`}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{item.sync_status?.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.detailText}>Progress: {item.pct_complete}%</Text>
          <Text style={styles.detailText}>
            Captured: {new Date(item.captured_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        
        {item.sync_status === 'failed' && item.error_message && (
          <Text style={styles.errorText}>Error: {item.error_message}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Queue</Text>
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} 
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#ffc107' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#28a745' }]}>{stats.synced}</Text>
          <Text style={styles.statLabel}>Synced</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#dc3545' }]}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={item => item.idempotency_key}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No submissions found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  syncButtonDisabled: {
    backgroundColor: '#99c9ff',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  }
});

