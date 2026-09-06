import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
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
      const userStr = await SecureStore.getItemAsync('fs_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.email || 'User');
      }

      // Fetch projects
      try {
        const response = await getProjects();
        if (response.data && response.data.length > 0) {
          setProjectName(response.data[0].name);
        } else {
          setProjectName('No Project Assigned');
        }
      } catch (err) {
        console.warn('Failed to fetch projects', err);
        setProjectName('Offline Mode');
      }

      // Fetch pending count
      const pending = await getPendingSubmissions();
      setPendingCount(pending.length);
      // Fetch submissions today
      const today = new Date().toISOString().split('T')[0];
      const allSubmissions = await getSubmissions();
      const todaySubs = allSubmissions.data.filter((s: any) => s.captured_at.startsWith(today));
      setSubmissionsToday(todaySubs.length);
    } catch (error) {
      console.error(error);
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
    await SecureStore.deleteItemAsync('fs_token');
    await SecureStore.deleteItemAsync('fs_user');
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName}</Text>
          <Text style={styles.project}>{projectName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending Sync</Text>
          <Text style={styles.cardNumber}>{pendingCount}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Submissions Today</Text>
          <Text style={styles.cardNumber}>{submissionsToday}</Text>
        </View>
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
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  project: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fee',
    borderRadius: 8,
  },
  logoutText: {
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  cardsContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

