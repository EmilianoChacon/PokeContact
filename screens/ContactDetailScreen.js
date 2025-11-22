import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  InteractionManager,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import PokemonStatsBar from '../components/PokemonStatsBar';
import { pokeApi } from '../services/pokeApi';
import { contactsService } from '../services/contactsService';
import { soundService } from '../services/soundService';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

const ContactDetailScreen = ({ route, navigation }) => {
  const { contact: initialContact } = route.params;
  const [contact, setContact] = useState(initialContact);
  const [allContacts, setAllContacts] = useState([]);
  const [compatibilities, setCompatibilities] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingCompatibilities, setLoadingCompatibilities] = useState(false);
  
  // Extraer datos del Pokémon del contacto
  const pokemonData = contact.pokemon || contact;
  const phoneNumber = contact.phoneNumber || contact.phoneNumbers?.[0]?.number || '';
  const contactId = useMemo(() => contact.id, [contact.id]);

  // Cargar todos los contactos y calcular compatibilidades de forma optimizada
  useEffect(() => {
    let isMounted = true;
    
    // Diferir el cálculo hasta después de la animación de navegación
    const task = InteractionManager.runAfterInteractions(() => {
      const loadContactsAndCalculateCompatibilities = async () => {
        if (!isMounted) return;
        
        setLoadingCompatibilities(true);
        try {
          const contacts = await contactsService.getContactsWithPokemon();
          if (!isMounted) return;
          
          // Filtrar el contacto actual
          const otherContacts = contacts.filter(c => c.id !== contactId);
          setAllContacts(otherContacts);
          
          // Calcular compatibilidades en lotes para no bloquear el UI
          // Usar setTimeout para diferir el cálculo y permitir que la UI se renderice primero
          setTimeout(() => {
            if (!isMounted) return;
            
            const compats = [];
            // Calcular en lotes pequeños para no bloquear el UI
            const batchSize = 10;
            let currentIndex = 0;
            
            const processBatch = () => {
              const endIndex = Math.min(currentIndex + batchSize, otherContacts.length);
              
              for (let i = currentIndex; i < endIndex; i++) {
                const otherContact = otherContacts[i];
                const compatibility = pokeApi.calculateCompatibility(contact, otherContact);
                if (compatibility !== null && compatibility >= 60) {
                  compats.push({
                    contact: otherContact,
                    compatibility: compatibility,
                  });
                }
              }
              
              currentIndex = endIndex;
              
              if (currentIndex < otherContacts.length && isMounted) {
                // Procesar siguiente lote
                setTimeout(processBatch, 0);
              } else if (isMounted) {
                // Terminado, ordenar y actualizar estado
                compats.sort((a, b) => b.compatibility - a.compatibility);
                setCompatibilities(compats);
                setLoadingCompatibilities(false);
              }
            };
            
            processBatch();
          }, 200);
        } catch (error) {
          console.error('Error cargando contactos para compatibilidad:', error);
          if (isMounted) {
            setLoadingCompatibilities(false);
          }
        }
      };
      
      loadContactsAndCalculateCompatibilities();
    });
    
    return () => {
      isMounted = false;
      if (task && task.cancel) {
        task.cancel();
      }
    };
  }, [contactId, contact]);

  const handleCall = () => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Error', 'Numero de telefono no disponible');
    }
  };

  const handleMessage = () => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    } else {
      Alert.alert('Error', 'Numero de telefono no disponible');
    }
  };


  const getTypeColor = (type) => {
    return colors.typeColors[type] || colors.metallicGray;
  };

  const primaryType = pokemonData.types?.[0] || contact.types?.[0] || 'normal';
  const typeColor = getTypeColor(primaryType);
  const pokemonStats = pokemonData.stats || contact.stats;
  const pokemonId = pokemonData.id || contact.pokemonId || contact.id;

  const getResponseTime = (attack) => {
    if (!attack) return 'Desconocido';
    if (attack >= 80) return 'Inmediata';
    if (attack >= 60) return 'Rápida';
    if (attack >= 40) return 'Normal';
    return 'Lento';
  };

  const getConfidenceLevel = (defense) => {
    if (!defense) return 'Desconocido';
    if (defense >= 80) return 'Muy Alta';
    if (defense >= 60) return 'Alta';
    if (defense >= 40) return 'Media';
    return 'Baja';
  };

  const getMessageSpeed = (speed) => {
    if (!speed) return 'Desconocido';
    if (speed >= 80) return 'Inmediata';
    if (speed >= 60) return 'Rápida';
    if (speed >= 40) return 'Normal';
    return 'Lenta';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animatable.View
        animation="fadeInDown"
        duration={500}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          disabled={isNavigating}
          onPress={async () => {
            if (isNavigating) return;
            setIsNavigating(true);
            await soundService.playButtonSound();
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
            setTimeout(() => setIsNavigating(false), 500);
          }}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>DETALLES DEL CONTACTO</Text>
      </Animatable.View>

      <View style={styles.pokemonContainer}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          duration={2000}
          style={[styles.glow, { backgroundColor: typeColor }]}
        />
        <Animatable.Image
          animation="fadeIn"
          duration={500}
          source={{ uri: pokemonData.sprite || contact.sprite }}
          style={styles.pokemonSprite}
          resizeMode="contain"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{contact.name || 'Contacto Desconocido'}</Text>
        {phoneNumber ? (
          <Text style={styles.phoneNumber}>{phoneNumber}</Text>
        ) : null}
        <Text style={styles.id}>
          {(() => {
            const pokemonNameStr = pokemonData.name || contact.pokemonName || 'Unknown';
            return pokemonNameStr.charAt(0).toUpperCase() + pokemonNameStr.slice(1).toLowerCase();
          })()} #{pokemonId.toString().padStart(3, '0')}
        </Text>

        <View style={styles.typesContainer}>
          {pokemonData.types?.map((type, index) => (
            <View
              key={index}
              style={[
                styles.typeBadge,
                { 
                  backgroundColor: colors.typeColors[type] || colors.metallicGray,
                  marginRight: index < pokemonData.types.length - 1 ? spacing.sm : 0,
                },
              ]}
            >
              <Text style={styles.typeText}>{type.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.traitsContainer}>
          <View style={styles.trait}>
            <Text style={styles.traitLabel}>Tiempo de Respuesta:</Text>
            <Text style={[styles.traitValue, { color: colors.neonGreen }]}>
              {getResponseTime(pokemonStats?.attack)}
            </Text>
          </View>
          <View style={styles.trait}>
            <Text style={styles.traitLabel}>Nivel de Confianza:</Text>
            <Text style={[styles.traitValue, { color: colors.neonGreen }]}>
              {getConfidenceLevel(pokemonStats?.defense)}
            </Text>
          </View>
          <View style={styles.trait}>
            <Text style={styles.traitLabel}>Velocidad de Mensajes:</Text>
            <Text style={[styles.traitValue, { color: colors.neonGreen }]}>
              {getMessageSpeed(pokemonStats?.speed)}
            </Text>
          </View>
        </View>

        {/* Botones de acción */}
            {phoneNumber && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { marginRight: spacing.sm }]}
                  onPress={async () => {
                    await soundService.playButtonSound();
                    handleCall();
                  }}
                >
                  <Text style={styles.actionButtonText}>¡LLAMAR!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={async () => {
                    await soundService.playButtonSound();
                    handleMessage();
                  }}
                >
                  <Text style={styles.actionButtonText}>MENSAJEAR!</Text>
                </TouchableOpacity>
              </View>
            )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>ESTADÍSTICAS</Text>
        <PokemonStatsBar
          label="HP"
          value={pokemonStats?.hp || 50}
          color={colors.primary}
          delay={0}
        />
        <PokemonStatsBar
          label="Ataque"
          value={pokemonStats?.attack || 50}
          color={colors.typeColors.fire}
          delay={100}
        />
        <PokemonStatsBar
          label="Defensa"
          value={pokemonStats?.defense || 50}
          color={colors.typeColors.water}
          delay={200}
        />
        <PokemonStatsBar
          label="Velocidad"
          value={pokemonStats?.speed || 50}
          color={colors.typeColors.electric}
          delay={300}
        />
        <PokemonStatsBar
          label="Ataque Especial"
          value={pokemonStats?.specialAttack || 50}
          color={colors.typeColors.psychic}
          delay={400}
        />
        <PokemonStatsBar
          label="Defensa Especial"
          value={pokemonStats?.specialDefense || 50}
          color={colors.typeColors.steel}
          delay={500}
        />
      </View>


          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButtonLarge, { marginRight: spacing.md }]}
              onPress={async () => {
                await soundService.playButtonSound();
                navigation.navigate('AddContact', { contact });
              }}
            >
              <Text style={styles.actionButtonText}>EDITAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonLarge}
              onPress={async () => {
                await soundService.playButtonSound();
                navigation.navigate('Trade', { contact });
              }}
            >
              <Text style={styles.actionButtonText}>COMPARTIR</Text>
            </TouchableOpacity>
          </View>

          {/* Sección de Compatibilidad */}
          <View style={styles.compatibilityContainer}>
            <Text style={styles.sectionTitle}>COMPATIBILIDAD</Text>
            {compatibilities.length > 0 ? (
              <View style={styles.compatibilityList}>
                {compatibilities.map((item, index) => {
                  const otherContact = item.contact;
                  const compatibility = item.compatibility;
                  const otherPokemon = otherContact.pokemon || otherContact;
                  const otherPokemonSprite = otherPokemon.sprite || otherContact.sprite;
                  const otherPokemonName = (otherPokemon.name || otherContact.pokemonName || 'Desconocido')
                    .charAt(0).toUpperCase() + (otherPokemon.name || otherContact.pokemonName || 'Desconocido').slice(1).toLowerCase();
                  
                  return (
                    <Animatable.View
                      key={otherContact.id}
                      animation="fadeInUp"
                      delay={index * 50}
                      style={styles.compatibilityItem}
                    >
                      <View style={styles.compatibilityItemLeft}>
                        <Image
                          source={{ uri: otherPokemonSprite }}
                          style={styles.compatibilityPokemonSprite}
                          resizeMode="contain"
                        />
                        <View style={styles.compatibilityTextContainer}>
                          <Text style={styles.compatibilityContactName}>
                            {otherContact.name || 'Contacto Desconocido'}
                          </Text>
                          <Text style={styles.compatibilityPokemonName}>
                            {otherPokemonName}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.compatibilityItemRight}>
                        <Text style={[styles.compatibilityValue, { color: getCompatibilityColor(compatibility) }]}>
                          {getCompatibilityLevel(compatibility)}
                        </Text>
                        <Text style={[styles.compatibilityPercent, { color: getCompatibilityColor(compatibility) }]}>
                          {compatibility}%
                        </Text>
                      </View>
                    </Animatable.View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.compatibilityListEmpty}>
                <Animatable.View
                  animation="pulse"
                  iterationCount="infinite"
                  duration={2000}
                  style={styles.emptyStateContainer}
                >
                  <Image
                    source={{ uri: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif' }}
                    style={styles.emptyStateSprite}
                    resizeMode="contain"
                  />
                  <Text style={styles.compatibilityNote}>
                    No hay contactos con compatibilidad mayor al 60%
                  </Text>
                </Animatable.View>
              </View>
            )}
          </View>
        </ScrollView>
      );
    };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.darkGray,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: colors.neonGreen,
    fontWeight: '600',
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  pokemonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  pokemonSprite: {
    width: 200,
    height: 200,
    zIndex: 1,
  },
  infoContainer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.title,
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  phoneNumber: {
    ...typography.subtitle,
    color: colors.neonGreen,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  id: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: spacing.md,
  },
  typesContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  typeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
  },
  traitsContainer: {
    width: '100%',
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  trait: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  traitLabel: {
    ...typography.body,
    color: colors.lightGray,
  },
  traitValue: {
    ...typography.body,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.neonGreen,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionButtonLarge: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatibilityContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  compatibilityList: {
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 200,
  },
  compatibilityListEmpty: {
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateSprite: {
    width: 120,
    height: 120,
    opacity: 0.6,
    marginBottom: spacing.md,
  },
  compatibilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
    minHeight: 80,
  },
  compatibilityItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatibilityPokemonSprite: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
  },
  compatibilityTextContainer: {
    flex: 1,
  },
  compatibilityContactName: {
    ...typography.body,
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  compatibilityPokemonName: {
    ...typography.small,
    fontSize: 13,
    color: colors.lightGray,
  },
  compatibilityItemRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  compatibilityValue: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  compatibilityPercent: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '700',
  },
  compatibilityNote: {
    ...typography.small,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});

export default ContactDetailScreen;

