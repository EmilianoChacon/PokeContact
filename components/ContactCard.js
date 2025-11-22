import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { pokeApi } from '../services/pokeApi';

const ContactCard = memo(({ contact, onPress, animationDelay = 0, isSelected = false, onSelect = null, selectionMode = false, isHighlighted = false, compareWith = null }) => {
  const getTypeColor = (type) => {
    return colors.typeColors[type] || colors.metallicGray;
  };


  const getCompatibilityLevel = (compatibility) => {
    if (compatibility >= 80) return 'Excelente';
    if (compatibility >= 60) return 'Buena';
    if (compatibility >= 40) return 'Regular';
    return 'Baja';
  };

  const getCompatibilityColor = (compatibility) => {
    if (compatibility >= 80) return colors.neonGreen;
    if (compatibility >= 60) return '#4CAF50';
    if (compatibility >= 40) return '#FFC107';
    return '#FF5722';
  };

  // Calcular compatibilidad si hay un contacto para comparar
  let compatibility = null;
  if (compareWith) {
    try {
      compatibility = pokeApi.calculateCompatibility(contact, compareWith);
      // Debug temporal - descomentar si necesitas ver qué está pasando
      // console.log('Compatibilidad:', compatibility, 'Contacto:', contact.name, 'vs', compareWith.name);
    } catch (error) {
      console.error('Error calculando compatibilidad:', error);
      compatibility = null;
    }
  }

  const handlePress = () => {
    if (selectionMode && onSelect) {
      onSelect(contact.id);
    } else if (onPress) {
      onPress();
    }
  };

  // Obtener datos de Pokémon desde el contacto (directamente o desde la propiedad pokemon)
  const pokemonData = contact.pokemon || contact;
  const pokemonTypes = pokemonData.types || contact.types || ['normal'];
  const primaryType = pokemonTypes[0] || 'normal';
  const secondaryType = pokemonTypes[1] || null;
  const typeColor = getTypeColor(primaryType);
  const pokemonSprite = pokemonData.sprite || contact.sprite;
  const pokemonId = pokemonData.id || contact.pokemonId || contact.id;
  // Capitalizar nombre de Pokémon
  const rawPokemonName = pokemonData.name || contact.pokemonName || 'Desconocido';
  const pokemonName = rawPokemonName === 'Desconocido' ? 'Desconocido' : rawPokemonName.charAt(0).toUpperCase() + rawPokemonName.slice(1).toLowerCase();
  
  // Obtener nombre del contacto
  const contactName = contact.name || 'Contacto Desconocido';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.card,
          { borderLeftColor: typeColor },
          isSelected && styles.cardSelected,
          selectionMode && styles.cardSelectionMode,
          isHighlighted && styles.cardHighlighted,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: pokemonSprite }}
              style={styles.image}
              resizeMode="contain"
            />
            <View style={styles.typeBadgesContainer}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                <Text style={styles.typeText}>{primaryType.toUpperCase()}</Text>
              </View>
              {secondaryType && (
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(secondaryType), marginTop: 2 }]}>
                  <Text style={styles.typeText}>{secondaryType.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>{contactName}</Text>
            <Text style={styles.id}>
              {pokemonName} #{pokemonId.toString().padStart(3, '0')}
            </Text>
            {compatibility !== null && compatibility !== undefined && (
              <View style={styles.compatibilityContainer}>
                <Text style={styles.compatibilityLabel}>Compatibilidad:</Text>
                <Text style={[styles.compatibilityValue, { color: getCompatibilityColor(compatibility) }]}>
                  {getCompatibilityLevel(compatibility)} ({compatibility}%)
                </Text>
              </View>
            )}
          </View>

          <View style={styles.ledIndicator}>
            <View style={[styles.led, { backgroundColor: colors.neonGreen }]} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.compareWith?.id === nextProps.compareWith?.id
  );
});

ContactCard.displayName = 'ContactCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.sm + 2,
    ...shadows.card,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: colors.darkGray,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardSelectionMode: {
    opacity: 0.9,
  },
  cardHighlighted: {
    backgroundColor: 'rgba(0, 255, 100, 0.2)', // Verde difuminado con transparencia para resaltar
    borderWidth: 3,
    borderColor: colors.neonGreen,
    shadowColor: colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  checkboxContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: 85,
    height: 85,
  },
  typeBadgesContainer: {
    marginTop: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    width: '100%',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    fontSize: 18,
    color: colors.white,
    marginBottom: 3,
    fontWeight: '700',
  },
  id: {
    ...typography.small,
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: spacing.xs,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  compatibilityLabel: {
    ...typography.small,
    fontSize: 12,
    color: colors.lightGray,
    marginRight: spacing.sm,
    fontWeight: '500',
  },
  compatibilityValue: {
    ...typography.small,
    fontSize: 12,
    fontWeight: '700',
  },
  ledIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  led: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ContactCard;
