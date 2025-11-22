import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  InteractionManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import ContactCard from '../components/ContactCard';
import CustomAlert from '../components/CustomAlert';
import { contactsService } from '../services/contactsService';
import { soundService } from '../services/soundService';
import { colors, typography, spacing, borderRadius } from '../theme';

const HomeScreen = ({ navigation, route }) => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [highlightedContactId, setHighlightedContactId] = useState(null);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'info', buttons: [] });
  const flatListRef = React.useRef(null);
  const letterPositions = React.useRef({});
  const contactsLoadedRef = React.useRef(false);

  // Función helper para mostrar CustomAlert
  const showCustomAlert = (title, message, type = 'info', buttons = []) => {
    setCustomAlert({ visible: true, title, message, type, buttons });
  };

  const hideCustomAlert = () => {
    setCustomAlert({ visible: false, title: '', message: '', type: 'info', buttons: [] });
  };

  const pokemonTypes = [
    'all', 'fire', 'water', 'grass', 'electric', 'normal',
    'fighting', 'poison', 'ground', 'flying', 'psychic',
    'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'ice'
  ];

  // Mapeo de tipos a español
  const typeNames = {
    'all': 'TODOS',
    'fire': 'FUEGO',
    'water': 'AGUA',
    'grass': 'PLANTA',
    'electric': 'ELÉCTRICO',
    'normal': 'NORMAL',
    'fighting': 'LUCHA',
    'poison': 'VENENO',
    'ground': 'TIERRA',
    'flying': 'VOLADOR',
    'psychic': 'PSÍQUICO',
    'bug': 'BICHO',
    'rock': 'ROCA',
    'ghost': 'FANTASMA',
    'dragon': 'DRAGÓN',
    'dark': 'SINIESTRO',
    'steel': 'ACERO',
    'fairy': 'HADA',
    'ice': 'HIELO'
  };

  useFocusEffect(
    useCallback(() => {
      // Solo recargar contactos si realmente es necesario (primera carga o después de editar/agregar)
      const shouldReload = !contactsLoadedRef.current || route?.params?.shouldReload;
      
      if (shouldReload) {
        // Diferir la carga hasta después de la animación de navegación
        const task = InteractionManager.runAfterInteractions(() => {
          // Si ya hay contactos cargados, recargar en segundo plano sin mostrar loading
          const showLoading = contacts.length === 0;
          loadContacts(showLoading);
          contactsLoadedRef.current = true;
          // Limpiar el parámetro
          if (route?.params?.shouldReload) {
            navigation.setParams({ shouldReload: undefined });
          }
        });
        
        return () => {
          if (task && task.cancel) {
            task.cancel();
          }
        };
      }
      
      // Verificar si se debe resaltar un contacto después de editar
      const highlightId = route?.params?.highlightContactId;
      if (highlightId) {
        setHighlightedContactId(highlightId);
        // Quitar el resaltado después de 3 segundos
        setTimeout(() => {
          setHighlightedContactId(null);
        }, 3000);
        // Limpiar el parámetro para evitar el resaltado en la siguiente navegación
        navigation.setParams({ highlightContactId: undefined });
      }
    }, [navigation, route])
  );

  // Memoizar el filtrado de contactos para evitar recálculos innecesarios
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];

    // Filtrar por consulta de búsqueda
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(queryLower) ||
        contact.phoneNumber?.includes(searchQuery) ||
        contact.pokemonId?.toString().includes(searchQuery)
      );
    }

    // Filtrar por tipo
    if (selectedType && selectedType !== 'all') {
      const typeLower = selectedType.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.types?.some(type => type.toLowerCase() === typeLower) ||
        contact.pokemon?.types?.some(type => type.toLowerCase() === typeLower)
      );
    }

    // Ordenar alfabéticamente por nombre
    filtered.sort((a, b) => {
      const nameA = (a.name || 'Contacto Desconocido').toUpperCase();
      const nameB = (b.name || 'Contacto Desconocido').toUpperCase();
      return nameA.localeCompare(nameB);
    });

    // Calcular posiciones de letras para la barra de navegación
    letterPositions.current = {};
    filtered.forEach((contact, index) => {
      const firstLetter = (contact.name || 'Contacto Desconocido').charAt(0).toUpperCase();
      if (!letterPositions.current[firstLetter]) {
        letterPositions.current[firstLetter] = index;
      }
    });

    return filtered;
  }, [contacts, searchQuery, selectedType]);

  const loadContacts = async (showLoading = true) => {
    // Solo mostrar loading si es la primera carga o se solicita explícitamente
    if (showLoading && contacts.length === 0) {
      setLoading(true);
    }
    
    try {
      // Solicitar permisos
      const hasPermission = await contactsService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permiso Requerido',
          'Esta app necesita acceso a tus contactos para mostrarlos. Por favor, otorga el permiso en configuración.',
          [{ text: 'OK' }]
        );
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      // Cargar contactos con asignaciones de Pokémon
      const loadedContacts = await contactsService.getContactsWithPokemon();
      setContacts(loadedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Error al cargar los contactos');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };


  const toggleContactSelection = useCallback((contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  }, []);

  const handleContactPress = useCallback(async (contact) => {
    if (selectionMode) {
      await soundService.playButtonSound(); // Reproducir sonido del botón en modo selección
      toggleContactSelection(contact.id); // Alternar la selección del contacto
    } else {
      await soundService.playPokeballOpenSound(); // Reproducir sonido de pokeball abriéndose al ver detalles
      navigation.navigate('ContactDetail', { contact }); // Navegar a la pantalla de detalle del contacto
    }
  }, [selectionMode, navigation, toggleContactSelection]);

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedContacts.length === 0) {
      showCustomAlert('Error', 'No hay contactos seleccionados', 'error');
      return;
    }

    showCustomAlert(
      'Eliminar Contactos',
      `¿Estás seguro de que quieres eliminar ${selectedContacts.length} contacto(s)?`,
      'warning',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: hideCustomAlert,
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            hideCustomAlert();
            setLoading(true);
            try {
              await contactsService.deleteMultipleContacts(selectedContacts);
              setSelectedContacts([]);
              setSelectionMode(false);
              await loadContacts();
              showCustomAlert('Éxito', 'Contactos eliminados exitosamente', 'success');
            } catch (error) {
              console.error('Error eliminando contactos:', error);
              showCustomAlert('Error', 'Error al eliminar los contactos', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteContact = (contactId) => {
    showCustomAlert(
      'Eliminar Contacto',
      '¿Estás seguro de que quieres eliminar este contacto?',
      'warning',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: hideCustomAlert,
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            hideCustomAlert();
            setLoading(true);
            try {
              await contactsService.deleteContactAndMapping(contactId);
              await loadContacts();
              showCustomAlert('Éxito', 'Contacto eliminado exitosamente', 'success');
            } catch (error) {
              console.error('Error eliminando contacto:', error);
              showCustomAlert('Error', 'Error al eliminar el contacto', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode); // Alternar el modo de selección
    setSelectedContacts([]);
  };

  const renderTypeFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.typeFilter}
      contentContainerStyle={styles.typeFilterContent}
    >
      {pokemonTypes.map((type, index) => {
        const isSelected = selectedType === type || (type === 'all' && !selectedType);
        const typeColor = type === 'all'
          ? colors.metallicGray
          : colors.typeColors[type] || colors.metallicGray;

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              {
                backgroundColor: isSelected ? typeColor : colors.darkGray,
                borderColor: typeColor,
                marginRight: index < pokemonTypes.length - 1 ? spacing.sm : 0,
              },
            ]}
            onPress={async () => {
              await soundService.playButtonSound();
              setSelectedType(type === 'all' ? null : type);
            }}
          >
            <Text
              style={[
                styles.typeButtonText,
                { 
                  color: isSelected ? colors.white : colors.white,
                  textShadowColor: isSelected ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={false}
            >
              {typeNames[type] || type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Obtener letras disponibles para la barra de navegación
  const getAvailableLetters = () => {
    const letters = new Set();
    filteredContacts.forEach(contact => {
      const firstLetter = (contact.name || 'Contacto Desconocido').charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        letters.add(firstLetter);
      } else {
        letters.add('#');
      }
    });
    return Array.from(letters).sort();
  };

  // Scroll a la posición de una letra específica
  const scrollToLetter = async (letter) => {
    await soundService.playButtonSound();
    const position = letterPositions.current[letter];
    if (position !== undefined && flatListRef.current && position < filteredContacts.length) {
      // Usar scrollToIndex con viewPosition: 0 para posicionar el elemento en la parte superior
      // Esperar a que el FlatList esté completamente renderizado
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (flatListRef.current) {
            try {
              // Intentar primero con scrollToIndex y viewPosition
              flatListRef.current.scrollToIndex({ 
                index: position, 
                animated: true,
                viewPosition: 0 // 0 = parte superior, asegura que el item quede arriba
              });
            } catch (error) {
              // Si falla, usar scrollToOffset como fallback
              const itemHeight = 90;
              const offset = position * itemHeight;
              flatListRef.current.scrollToOffset({ 
                offset: Math.max(0, offset), 
                animated: true 
              });
            }
          }
        }, 150);
      });
    }
  };

  // Memoizar el contacto de referencia para evitar búsquedas repetidas
  const referenceContact = useMemo(() => {
    if (selectedContacts.length === 1) {
      return contacts.find(c => c.id === selectedContacts[0]) || null;
    }
    return null;
  }, [selectedContacts, contacts]);

  // Optimizar keyExtractor
  const keyExtractor = useCallback((item) => `contact-${item.id}`, []);

  const renderContact = useCallback(({ item, index }) => {
    const isHighlighted = highlightedContactId === item.id;
    // Solo calcular compatibilidad si hay un contacto de referencia y este no es el seleccionado
    const compareWith = referenceContact && !selectedContacts.includes(item.id) 
      ? referenceContact 
      : null;
    
    return (
      <ContactCard
        contact={item}
        onPress={() => handleContactPress(item)}
        onSelect={() => toggleContactSelection(item.id)}
        animationDelay={0} // Eliminar animaciones para mejor rendimiento
        selectionMode={selectionMode}
        isSelected={selectedContacts.includes(item.id)}
        isHighlighted={isHighlighted}
        compareWith={compareWith}
      />
    );
  }, [highlightedContactId, selectedContacts, selectionMode, handleContactPress, toggleContactSelection, referenceContact]);

  return (
    <View style={styles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={500}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Image 
              source={require('../assets/images/pokecontact-logo.png')} 
              style={styles.titleImage}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity
            style={styles.selectionModeButton}
            onPress={async () => {
              await soundService.playButtonSound();
              toggleSelectionMode();
            }}
          >
            <Text style={styles.selectionModeButtonText}>
              {selectionMode ? 'CANCELAR' : 'SELECCIONAR'}
            </Text>
          </TouchableOpacity>
        </View>
        {selectionMode && (
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionActionButton}
              onPress={async () => {
                await soundService.playButtonSound();
                toggleSelectAll();
              }}
            >
              <Text style={styles.selectionActionText}>
                {selectedContacts.length === filteredContacts.length ? 'DESELECCIONAR TODOS' : 'SELECCIONAR TODOS'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionActionButton, styles.deleteButton]}
              onPress={async () => {
                await soundService.playButtonSound();
                handleDeleteSelected();
              }}
              disabled={selectedContacts.length === 0}
            >
              <Text style={[styles.selectionActionText, selectedContacts.length === 0 && styles.disabledText]}>
                ELIMINAR ({selectedContacts.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.ledStrip}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1000}
            style={[styles.led, { backgroundColor: colors.primary, marginRight: spacing.sm }]}
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1200}
            delay={200}
            style={[styles.led, { backgroundColor: colors.neonGreen, marginRight: spacing.sm }]}
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1100}
            delay={400}
            style={[styles.led, { backgroundColor: colors.primary }]}
          />
        </View>
      </Animatable.View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar contactos..."
          placeholderTextColor={colors.lightGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={async () => {
            await soundService.playButtonSound();
          }}
        />
        <View style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </View>
      </View>

      {renderTypeFilter()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando contactos...</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            getItemLayout={(data, index) => ({
              length: 90, // Altura reducida de cada ContactCard (sin estadísticas)
              offset: 90 * index,
              index,
            })}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={100}
            windowSize={5}
            initialNumToRender={8}
            maintainVisibleContentPosition={null}
            disableVirtualization={false}
            onScrollToIndexFailed={(info) => {
              // Si falla el scroll, intentar con un pequeño delay y usar viewPosition
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                if (flatListRef.current) {
                  try {
                    flatListRef.current.scrollToIndex({ 
                      index: info.index, 
                      animated: true,
                      viewPosition: 0 // Asegurar que quede arriba
                    });
                  } catch (error) {
                    // Si aún falla, usar scrollToOffset
                    const itemHeight = 90;
                    const paddingTop = 16;
                    const offset = (info.index * itemHeight) - paddingTop;
                    flatListRef.current.scrollToOffset({ 
                      offset: Math.max(0, offset), 
                      animated: true 
                    });
                  }
                }
              });
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron contactos</Text>
                <Text style={styles.emptySubtext}>
                  ¡Agrega tu primer contacto Pokémon!
                </Text>
              </View>
            }
          />
          {/* Barra de navegación alfabética */}
          {filteredContacts.length > 0 && !searchQuery && (
            <View style={styles.letterBar}>
              {getAvailableLetters().map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={styles.letterItem}
                  onPress={() => scrollToLetter(letter)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.letterText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {!selectionMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={async () => {
            await soundService.playButtonSound();
            navigation.navigate('AddContact');
          }}
        >
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1500}
            style={styles.fabGlow}
          />
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* CustomAlert personalizado */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        buttons={customAlert.buttons}
        onClose={hideCustomAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.darkGray,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleImage: {
    height: typography.title.fontSize * 1.2,
    maxWidth: '100%',
  },
  selectionModeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  selectionModeButtonText: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectionActionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.metallicGray,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: colors.primary,
  },
  selectionActionText: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
  },
  disabledText: {
    opacity: 0.5,
  },
  ledStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  led: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    margin: spacing.md,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.darkGray,
    color: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.metallicGray,
    ...typography.body,
  },
  searchIcon: {
    marginLeft: spacing.sm,
  },
  searchIconText: {
    fontSize: 24,
  },
  typeFilter: {
    maxHeight: 85,
    marginBottom: spacing.sm,
  },
  typeFilterContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  typeButton: {
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    minHeight: 50,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.lightGray,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.metallicGray,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  fabGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  fabText: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  letterBar: {
    position: 'absolute',
    right: spacing.xs,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    zIndex: 10,
  },
  letterItem: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    ...typography.small,
    fontSize: 11,
    color: colors.neonGreen,
    fontWeight: '600',
  },
});

export default HomeScreen;

