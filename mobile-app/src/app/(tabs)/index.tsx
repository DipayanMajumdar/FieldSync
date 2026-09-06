import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProjects, getSubmissions } from '../../services/api';
import { getPendingSubmissions } from '../../services/database';

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [projectName, setProjectName] = useState('Loading...');
  const [pendingCount, setPendingCount] = useState(0);
  const [submissionsToday, setSubmissionsToday] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    try {
      // Load user info
      try {
        const userStr = await SecureStore.getItemAsync('fs_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || user.email || 'User');
        }
      } catch (err) {
        console.warn('Failed to load user info', err);
      }

      // Fetch projects
      try {
        const response = await getProjects();
        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          setProjectName(response.data[0].name || 'Unknown Project');
        } else {
          setProjectName('No Project Assigned');
        }
      } catch (err) {
        console.warn('Failed to fetch projects', err);
        setProjectName('Offline Mode');
      }

      // Fetch pending count from local SQLite
      try {
        const pending = await getPendingSubmissions();
        setPendingCount(Array.isArray(pending) ? pending.length : 0);
      } catch (err) {
        console.warn('Failed to get pending submissions', err);
        setPendingCount(0);
      }

      // Fetch remote submissions today
      try {
        const res = await getSubmissions();
        const today = new Date().toISOString().split('T')[0];
        const rows = Array.isArray(res?.data) ? res.data : [];
        const todaySubs = rows.filter((s: any) =>
          typeof s.captured_at === 'string' && s.captured_at.startsWith(today)
        );
        setSubmissionsToday(todaySubs.length);
      } catch (err) {
        console.warn('Failed to fetch submissions', err);
        setSubmissionsToday(0);
      }
    } catch (error) {
      console.error('loadData failed', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('fs_token');
      await SecureStore.deleteItemAsync('fs_user');
    } catch (_) {}
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location-sharp" size={22} color="#007AFF" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.greeting}>Hello, {userName || 'Field Engineer'}</Text>
            <Text style={styles.project}>{projectName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#ff3b30" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, { borderLeftColor: '#ff9500' }]}>
          <Ionicons name="cloud-upload-outline" size={24} color="#ff9500" />
          <Text style={styles.cardTitle}>Pending Sync</Text>
          <Text style={[styles.cardNumber, { color: '#ff9500' }]}>{pendingCount}</Text>
        </View>
        <View style={[styles.card, { borderLeftColor: '#007AFF' }]}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Submissions Today</Text>
          <Text style={[styles.cardNumber, { color: '#007AFF' }]}>{submissionsToday}</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(tabs)/capture')}>
          <Ionicons name="camera-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Capture Progress</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(tabs)/sync')}>
          <Ionicons name="sync-outline" size={20} color="#34c759" />
          <Text style={styles.actionText}>Sync All Records</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  project: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
    maxWidth: 220,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fee',
    borderRadius: 8,
  },
  cardsContainer: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
});
