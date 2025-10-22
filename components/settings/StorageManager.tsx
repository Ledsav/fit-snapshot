import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import { usePhotos } from '@/context/PhotoContext';
import { useTheme } from '@/context/ThemeContext';
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
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
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
      t('settings.cleanupTitle'),
      t('settings.cleanupMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.cleanup'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await cleanupStorage();
              await loadStorageInfo();
              Alert.alert(t('common.success'), t('settings.cleanupSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.cleanupError'));
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
            {t('settings.loadingStorageInfo')}
          </Text>
        </View>
      </View>
    );
  }

  if (!storageInfo) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          {t('settings.failedToLoadStorage')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Storage Info Items */}
      <View style={[
        styles.infoItem,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.primary + '40',
        }
      ]}>
        <View style={styles.infoLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="images-outline" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.infoLabel, { color: theme.text }]}>
            {t('settings.totalPhotos')}
          </Text>
        </View>
        <Text style={[styles.infoValue, { color: theme.text }]}>
          {storageInfo.totalPhotos}
        </Text>
      </View>

      <View style={[
        styles.infoItem,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.primary + '40',
        }
      ]}>
        <View style={styles.infoLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
            <Ionicons name="folder-outline" size={24} color={theme.accent} />
          </View>
          <Text style={[styles.infoLabel, { color: theme.text }]}>
            {t('settings.storageUsed')}
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
            {t('settings.refresh')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.error }]}
          onPress={handleCleanup}
        >
          <Ionicons name="trash" size={20} color={theme.background} />
          <Text style={[styles.buttonText, { color: theme.background }]}>
            {t('settings.cleanup')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 30,
    opacity: 0.7,
  },
});