import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, borderRadius } from '../theme';

const PokemonStatsBar = ({ label, value, maxValue = 100, color = colors.primary, delay = 0 }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barBackground, { backgroundColor: colors.darkGray }]}>
          <Animatable.View
            animation="slideInLeft"
            delay={delay}
            duration={800}
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          >
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={1500}
              style={[styles.barGlow, { backgroundColor: color }]}
            />
          </Animatable.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body,
    color: colors.lightGray,
    textTransform: 'capitalize',
  },
  value: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  barContainer: {
    height: 20,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barBackground: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
    position: 'relative',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
});

export default PokemonStatsBar;



