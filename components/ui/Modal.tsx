/**
 * Standardized Modal Component
 *
 * A reusable modal component with consistent styling and behavior.
 * Provides backdrop, header with close button, and content area.
 *
 * Usage:
 * <Modal
 *   visible={isVisible}
 *   onClose={handleClose}
 *   title="Modal Title"
 * >
 *   <Text>Modal content</Text>
 * </Modal>
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  typography,
  elevation,
  zIndex,
  iconSize,
} from '@/constants/DesignSystem';
import { IconButton } from './IconButton';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  scrollable = true,
  style,
  contentStyle,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  // Size configurations
  const sizeStyles = {
    small: {
      maxWidth: 400,
      maxHeight: '50%',
    },
    medium: {
      maxWidth: 500,
      maxHeight: '70%',
    },
    large: {
      maxWidth: 600,
      maxHeight: '85%',
    },
    fullscreen: {
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      borderRadius: 0,
    },
  };

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        bounces: false,
      }
    : {};

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.cardBackground },
              sizeStyles[size],
              size !== 'fullscreen' && elevation.lg,
              style,
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title && (
                  <Text
                    style={[
                      styles.title,
                      { color: theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <View style={styles.closeButtonContainer}>
                    <IconButton
                      icon={
                        <Ionicons
                          name="close"
                          size={iconSize.md}
                          color={theme.text}
                        />
                      }
                      onPress={onClose}
                      variant="ghost"
                      size="small"
                    />
                  </View>
                )}
              </View>
            )}

            {/* Content */}
            <ContentWrapper
              style={[styles.content, contentStyle]}
              {...contentWrapperProps}
            >
              {children}
            </ContentWrapper>
          </View>
        </TouchableOpacity>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight || 0) + spacing.md
        : spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  title: {
    ...typography.h3,
    flex: 1,
    marginRight: spacing.md,
  },
  closeButtonContainer: {
    marginLeft: 'auto',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
