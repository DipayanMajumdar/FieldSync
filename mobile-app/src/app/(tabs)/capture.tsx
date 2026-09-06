import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { getProjects, getWBSTree } from '../../services/api';
import { saveSubmission } from '../../services/database';
import { syncPendingSubmissions } from '../../services/sync';

export default function CaptureScreen() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [pctComplete, setPctComplete] = useState('0');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      // Assuming project 1 for MVP as per requirements
      const projRes = await getProjects();
      if (projRes.data && projRes.data.length > 0) {
        const wbsRes = await getWBSTree(projRes.data[0].id);
        // Flatten WBS or assume the API returns an array of activities we can select
        // For MVP, just treating the response data as an array of items, filtered to L5/L6 only
        const items = (wbsRes.data || []).filter((node: any) => node.level === 5 || node.level === 6);
        setActivities(items);
        setFilteredActivities(items);
      }
    } catch (error) {
      console.warn('Could not load WBS', error);
      // Fallback for testing when offline
      const dummy = [
        { id: 1, code: 'EXC-01', name: 'Excavation Area A' },
        { id: 2, code: 'FND-01', name: 'Foundation Pouring' }
      ];
      setActivities(dummy);
      setFilteredActivities(dummy);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter(a => a.name.toLowerCase().includes(text.toLowerCase()) || a.code?.toLowerCase().includes(text.toLowerCase()))
      );
    }
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setIsLocating(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access camera was denied');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedActivity) {
      Alert.alert('Error', 'Please select an activity');
      return;
    }
    
    const pct = parseFloat(pctComplete);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Error', 'Please enter a valid percentage (0-100)');
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceId = Constants.sessionId || 'unknown_device';
      const timestamp = Date.now();
      const idempotencyKey = `${deviceId}-${timestamp}-${Math.random().toString(36).slice(2)}`;

      const submission = {
        idempotency_key: idempotencyKey,
        wbs_node_id: selectedActivity.id,
        wbs_node_name: selectedActivity.name,
        pct_complete: pct,
        qty: qty ? parseFloat(qty) : undefined,
        notes: notes,
        gps_lat: location?.coords.latitude,
        gps_lng: location?.coords.longitude,
        captured_at: new Date().toISOString(),
        device_id: deviceId
      };

      // 1. Save to SQLite
      await saveSubmission(submission);
      
      // 2. Try to sync
      const syncResult = await syncPendingSubmissions();
      
      if (syncResult.synced > 0) {
        Alert.alert('Success', 'Progress captured and synced successfully');
      } else {
        Alert.alert('Saved Locally', 'Progress saved. Will sync when online.');
      }
      
      // Reset form
      setSelectedActivity(null);
      setPctComplete('0');
      setQty('');
      setNotes('');
      setLocation(null);
      setPhotoUri(null);
      setSearch('');
      setFilteredActivities(activities);
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        {!selectedActivity ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 1 — Select Activity</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or code..."
              value={search}
              onChangeText={handleSearch}
            />
            {filteredActivities.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.activityItem}
                onPress={() => setSelectedActivity(item)}
              >
                <Text style={styles.activityCode}>{item.code}</Text>
                <Text style={styles.activityName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.section}>
              <View style={styles.selectedHeader}>
                <Text style={styles.sectionTitle}>Selected Activity</Text>
                <TouchableOpacity onPress={() => setSelectedActivity(null)}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.activityCode}>{selectedActivity.code}</Text>
              <Text style={styles.activityName}>{selectedActivity.name}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Step 2 — Enter Progress</Text>
              
              <Text style={styles.label}>% Complete (0-100)</Text>
              <TextInput
                style={styles.input}
                value={pctComplete}
                onChangeText={setPctComplete}
                keyboardType="numeric"
              />
              
              <Text style={styles.label}>Quantity (optional)</Text>
              <TextInput
                style={styles.input}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                placeholder="e.g. 50"
              />
              
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Add any remarks..."
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Step 3 — Location & Media</Text>
              
              <TouchableOpacity style={styles.mediaButton} onPress={handleGetLocation}>
                {isLocating ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <Text style={styles.mediaButtonText}>Capture GPS Location</Text>
                )}
              </TouchableOpacity>
              {location && (
                <Text style={styles.mediaInfo}>Lat: {location.coords.latitude.toFixed(5)}, Lng: {location.coords.longitude.toFixed(5)}</Text>
              )}
              
              <TouchableOpacity style={styles.mediaButton} onPress={handleTakePhoto}>
                <Text style={styles.mediaButtonText}>Take Photo</Text>
              </TouchableOpacity>
              {photoUri && (
                <Text style={styles.mediaInfo}>Photo attached</Text>
              )}
              
              <TouchableOpacity style={styles.mediaButton} onPress={() => Alert.alert('Notice', 'Audio recording not implemented in MVP')}>
                <Text style={styles.mediaButtonText}>Record Audio Remark</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Progress</Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityCode: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 16,
    color: '#333',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  changeText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mediaButton: {
    backgroundColor: '#e6f2ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  mediaButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  mediaInfo: {
    fontSize: 12,
    color: '#28a745',
    marginBottom: 15,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitDisabled: {
    backgroundColor: '#8cd99e',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

