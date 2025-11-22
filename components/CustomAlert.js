import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const CustomAlert = ({ visible, title, message, type = 'info', buttons = [], onClose }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return colors.neonGreen;
      case 'error':
        return colors.primary;
      case 'warning':
        return '#FFC107';
      default:
        return colors.secondary;
    }
  };

  const typeColor = getTypeColor();

  // Si no hay botones, agregar uno por defecto
  const alertButtons = buttons.length > 0 ? buttons : [
    {
      text: 'OK',
      onPress: onClose || (() => {}),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animatable.View
          animation="zoomIn"
          duration={300}
          style={[styles.alertContainer, { borderTopColor: typeColor }]}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: typeColor }]}>
              <Text style={styles.icon}>
                {type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}
              </Text>
            </View>
            <Text style={[styles.title, { color: typeColor }]}>{title}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.buttonContainer}>
            {alertButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index === alertButtons.length - 1 && styles.buttonLast,
                  button.style === 'destructive' && { backgroundColor: colors.primary },
                  button.style === 'cancel' && { backgroundColor: colors.darkGray },
                  !button.style && { backgroundColor: typeColor },
                ]}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
              >
                <Text style={styles.buttonText}>{button.text || 'OK'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  alertContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.lg,
    borderTopWidth: 4,
    width: '100%',
    maxWidth: 400,
    ...shadows.card,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
  },
  title: {
    ...typography.title,
    fontSize: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  message: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.black,
    paddingTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLast: {
    borderLeftWidth: 1,
    borderLeftColor: colors.black,
  },
  buttonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default CustomAlert;


