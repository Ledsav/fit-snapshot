import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { usePhotos } from '@/context/PhotoContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export const StorageManager: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useLocalization();
  const { getStorageInfo, cleanupStorage } = usePhotos();
  
  const [storageInfo, setStorageInfo] = useState<{
    totalPhotos: number;
    directorySize: number;
    directoryPath: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStorageInfo = async () => {
    try {
      setIsLoading(true);
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
      Alert.alert('Error', 'Failed to load storage information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const handleCleanup = () => {
    Alert.alert(
      'Cleanup Storage',
      'This will remove any orphaned photo files. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await cleanupStorage();
              await loadStorageInfo();
              Alert.alert('Success', 'Storage cleanup completed');
            } catch (error) {
              Alert.alert('Error', 'Failed to cleanup storage');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading storage info...
          </Text>
        </View>
      </View>
    );
  }

  if (!storageInfo) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          Failed to load storage information
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Storage Info Items */}
      <View style={styles.infoItem}>
        <View style={styles.infoLeft}>
          <Ionicons name="images-outline" size={24} color={theme.text} style={styles.icon} />
          <Text style={[styles.infoLabel, { color: theme.text }]}>
            Total Photos
          </Text>
        </View>
        <Text style={[styles.infoValue, { color: theme.text }]}>
          {storageInfo.totalPhotos}
        </Text>
      </View>

      <View style={styles.infoItem}>
        <View style={styles.infoLeft}>
          <Ionicons name="folder-outline" size={24} color={theme.text} style={styles.icon} />
          <Text style={[styles.infoLabel, { color: theme.text }]}>
            Storage Used
          </Text>
        </View>
        <Text style={[styles.infoValue, { color: theme.text }]}>
          {formatBytes(storageInfo.directorySize)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={loadStorageInfo}
        >
          <Ionicons name="refresh" size={20} color={theme.background} />
          <Text style={[styles.buttonText, { color: theme.background }]}>
            Refresh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.error }]}
          onPress={handleCleanup}
        >
          <Ionicons name="trash" size={20} color={theme.background} />
          <Text style={[styles.buttonText, { color: theme.background }]}>
            Cleanup
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});