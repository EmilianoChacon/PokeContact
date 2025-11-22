import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Audio } from 'expo-av';
import { Share } from 'react-native';
import { pokeApi } from '../services/pokeApi';
import { contactsService } from '../services/contactsService';
import { soundService } from '../services/soundService';
import CaptureAnimation from '../components/CaptureAnimation';
import CustomAlert from '../components/CustomAlert';
import { colors, typography, spacing, borderRadius } from '../theme';

// Opciones de estadísticas
const statOptions = ['Nula', 'Baja', 'Media', 'Alta'];

// Convertir texto de estadísticas a número (0-100)
const statTextToNumber = (text) => {
  switch (text) {
    case 'Nula': return 0;
    case 'Baja': return 30;
    case 'Media': return 50;
    case 'Alta': return 80;
    default: return 50;
  }
};

// Convert number to stat text
const numberToStatText = (num) => {
  const value = parseInt(num) || 50;
  if (value === 0) return 'Nula';
  if (value < 40) return 'Baja';
  if (value < 70) return 'Media';
  return 'Alta';
};

const AddContactScreen = ({ navigation, route }) => {
  const editingContact = route?.params?.contact;
  const isEditing = !!editingContact;
  
  const [mode, setMode] = useState('random'); // 'random' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allPokemonList, setAllPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [contactName, setContactName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [responseTime, setResponseTime] = useState('Medium');
  const [confidenceLevel, setConfidenceLevel] = useState('Medium');
  const [messageSpeed, setMessageSpeed] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showStatPicker, setShowStatPicker] = useState(false);
  const [currentStatType, setCurrentStatType] = useState(null); // 'responseTime', 'confidenceLevel', or 'messageSpeed'
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveText, setReceiveText] = useState('');
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'info', buttons: [] });

  // Función helper para mostrar CustomAlert
  const showCustomAlert = (title, message, type = 'info', buttons = []) => {
    setCustomAlert({ visible: true, title, message, type, buttons });
  };

  const hideCustomAlert = () => {
    setCustomAlert({ visible: false, title: '', message: '', type: 'info', buttons: [] });
  };

  // Sounds are now handled by soundService (sonidos ahora son gestionados por soundService)
  useEffect(() => {
    // Asegurar que los sonidos estén cargados (sin recargar música de fondo si ya está cargada)
    soundService.loadButtonSound();
    soundService.loadSaveSound();
    soundService.loadEditSound();
    soundService.loadCaptureSound();
    // Asegurar que la música de fondo siga reproduciéndose
    soundService.playBackgroundMusic();
  }, []);


  // Cargar todas las listas de Pokémon cuando el modo es 'search'
  const loadAllPokemonList = async () => {
    if (allPokemonList.length > 0) {
      return; // Ya cargadas
    }
    setIsLoadingList(true);
    try {
      const list = await pokeApi.getAllPokemonList();
      setAllPokemonList(list);
      setFilteredPokemonList(list);
    } catch (error) {
      console.error('Error cargando lista de Pokémon:', error);
      setAllPokemonList([]);
      setFilteredPokemonList([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    // Inicializar el formulario si se está editando
    if (editingContact) {
      setContactName(editingContact.name || '');
      const phone = editingContact.phoneNumber || '';
      // Extraer el código de país si está presente (formato: +XX o +XXX)
      if (phone.startsWith('+')) {
        const match = phone.match(/^(\+\d{1,3})(\d{10})$/);
        if (match) {
          setCountryCode(match[1]);
          setPhoneNumber(match[2]);
        } else {
          // Intentar extraer 10 dígitos desde el final
          const digits = phone.replace(/\D/g, '');
          if (digits.length >= 10) {
            setPhoneNumber(digits.slice(-10));
            setCountryCode('+' + digits.slice(0, -10));
          } else {
            setPhoneNumber(phone);
            setCountryCode('+1');
          }
        }
      } else {
        // Extraer 10 dígitos
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 10) {
          setPhoneNumber(digits.slice(-10));
          setCountryCode('+' + (digits.slice(0, -10) || '1'));
        } else {
          setPhoneNumber(phone);
          setCountryCode('+1');
        }
      }
      setSelectedPokemon(editingContact.pokemon || editingContact);
      
      // Cargar estadísticas personalizadas si están disponibles
      if (editingContact.customStats) {
        setResponseTime(numberToStatText(editingContact.customStats.responseTime || 50));
        setConfidenceLevel(numberToStatText(editingContact.customStats.confidenceLevel || 50));
        setMessageSpeed(numberToStatText(editingContact.customStats.messageSpeed || 50));
      } else if (editingContact.stats) {
        setResponseTime(numberToStatText(editingContact.stats.attack || 50));
        setConfidenceLevel(numberToStatText(editingContact.stats.defense || 50));
        setMessageSpeed(numberToStatText(editingContact.stats.speed || 50));
      }
    }
  }, [editingContact]);

  // Cargar lista cuando el modo cambia a 'search'
  useEffect(() => {
    if (mode === 'search' && allPokemonList.length === 0) {
      loadAllPokemonList();
    }
  }, [mode]);

  // Filtrar lista de Pokémon mientras el usuario escribe
  useEffect(() => {
    // Solo filtrar si estamos en el modo de búsqueda
    if (mode !== 'search') {
      return;
    }

    if (searchQuery.trim() === '') {
      // Mostrar todos los Pokémon si la lista está expandida y no hay consulta de búsqueda
      if (isListExpanded && allPokemonList.length > 0) {
        setFilteredPokemonList(allPokemonList);
      } else {
        setFilteredPokemonList([]);
      }
      return;
    }

    // Filtrar desde la lista cacheada
    setIsSearching(true);
    const searchTimeout = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allPokemonList.filter(pokemon => 
        pokemon.name.toLowerCase().includes(query) ||
        pokemon.id.toString().includes(query)
      );
      setFilteredPokemonList(filtered);
      setIsSearching(false);
    }, 200); // 200ms de debounce

    return () => {
      clearTimeout(searchTimeout);
      setIsSearching(false);
    };
  }, [searchQuery, isListExpanded, allPokemonList, mode]);

  // Reproducir sonido del botón auxiliar
  const playButtonSound = async () => {
    await soundService.playButtonSound();
  };

  const handleRandomPokemon = async () => {
    setLoading(true);
    try {
      const pokemon = await pokeApi.getRandomPokemon();
      setSelectedPokemon(pokemon);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar un Pokémon aleatorio');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPokemon = async (pokemonResult) => {
    setLoading(true);
    try {
      const pokemon = await pokeApi.getPokemon(pokemonResult.name);
      setSelectedPokemon(pokemon);
      setSearchQuery(''); // Limpiar consulta de búsqueda
      setFilteredPokemonList([]); // Limpiar lista de resultados
      setSearchResults([]);
      setIsListExpanded(false); // Cerrar lista cuando se selecciona un Pokémon
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el Pokémon');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePokemon = async () => {
    await playButtonSound();
    setSelectedPokemon(null);
    setSearchQuery('');
    setFilteredPokemonList([]);
    setIsListExpanded(false);
    // Asegurar que la lista esté cargada si se cambia al modo de búsqueda
    if (mode === 'search' && allPokemonList.length === 0) {
      await loadAllPokemonList();
    }
  };

  const toggleListExpanded = async () => {
    await playButtonSound();
    if (!isListExpanded && allPokemonList.length === 0) {
      await loadAllPokemonList();
    }
    setIsListExpanded(!isListExpanded);
  };

  const validatePhoneNumber = (phone) => {
    // Quitar todos los caracteres no numéricos
    const digits = phone.replace(/\D/g, '');
    // Verificar si solo hay exactamente 10 dígitos
    if (digits.length !== 10) {
      return { valid: false, error: 'El número de teléfono debe tener exactamente 10 dígitos' };
    }
    // Verificar si todos los dígitos son válidos
    if (!/^\d{10}$/.test(digits)) {
      return { valid: false, error: 'El número de teléfono solo debe contener dígitos' };
    }
    return { valid: true, digits };
  };

  const handlePhoneNumberChange = (text) => {
    // Quitar todos los caracteres no numéricos
    const digits = text.replace(/\D/g, '');
    // Limitar a 10 dígitos
    if (digits.length <= 10) {
      setPhoneNumber(digits);
      if (digits.length === 10) {
        setPhoneError('');
      } else if (digits.length > 0) {
        setPhoneError(`Ingresa ${10 - digits.length} dígito(s) más`);
      } else {
        setPhoneError('');
      }
    }
  };

  const handleReceiveContact = async () => {
    await playButtonSound();
    setShowReceiveModal(true);
    setReceiveText('');
  };

  const handleImportContact = async () => {
    if (!receiveText || !receiveText.trim()) {
      Alert.alert('Error', 'Por favor, pega el texto del contacto compartido');
      return;
    }

    try {
      // Parsear los datos del contacto
      const contactData = JSON.parse(receiveText);
      
      // Validar los datos del contacto
      if (!contactData.name || !contactData.phoneNumber) {
        Alert.alert('Error', 'El texto no contiene información de contacto válida');
        return;
      }

      setShowReceiveModal(false);
      setLoading(true);

      // Obtener datos del Pokémon si están disponibles
      let pokemon = null;
      if (contactData.pokemonId || contactData.pokemon?.id) {
        const pokemonId = contactData.pokemonId || contactData.pokemon.id;
        pokemon = await pokeApi.getPokemon(pokemonId);
      } else if (contactData.pokemon?.name) {
        pokemon = await pokeApi.getPokemon(contactData.pokemon.name);
      }

      if (!pokemon) {
        setLoading(false);
        Alert.alert('Error', 'No se pudo cargar la información del Pokémon');
        return;
      }

      // Solicitar permisos
      const hasPermission = await contactsService.requestPermissions();
      if (!hasPermission) {
        setLoading(false);
        Alert.alert(
          'Permiso requerido',
          'Esta app necesita acceso a tus contactos para guardar el contacto. Por favor, otorga el permiso en configuración.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Mostrar la animación de captura
      setShowCapture(true);
      await soundService.playCaptureSound();

      // Esperar a que la animación termine
      setTimeout(async () => {
        try {
          // Extraer estadísticas personalizadas si están disponibles
          const customStats = contactData.customStats || contactData.stats || {
            responseTime: 50,
            confidenceLevel: 50,
            messageSpeed: 50,
          };

          // Crear contacto
          const contactId = await contactsService.createDeviceContact(
            contactData.name.trim(),
            contactData.phoneNumber
          );

          // Guardar asociación de Pokémon con estadísticas personalizadas
          await contactsService.saveContactPokemonMapping(
            contactId,
            pokemon,
            customStats
          );

          setShowCapture(false);
          setLoading(false);
          
          // Reproducir sonido de guardado
          await soundService.playSaveSound();
          
          Alert.alert(
            '¡Éxito!',
            `${contactData.name} ha sido agregado a tus contactos con ${pokemon.name}!`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } catch (error) {
          console.error('Error guardando contacto:', error);
          setShowCapture(false);
          setLoading(false);
          Alert.alert('Error', `Error al guardar el contacto: ${error.message}`);
        }
      }, 3000);
    } catch (error) {
      console.error('Error analizando datos del contacto:', error);
      Alert.alert('Error', 'El texto no es válido. Asegúrate de copiar todo el JSON del contacto compartido.');
    }
  };

  const handleSaveContact = async () => {
    if (!selectedPokemon) {
      Alert.alert('Error', 'Por favor, selecciona un Pokémon primero');
      return;
    }

    if (!contactName.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un nombre de contacto');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un número de teléfono');
      return;
    }

    // Validar número de teléfono (debe tener exactamente 10 dígitos)
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      Alert.alert('Error', validation.error);
      setPhoneError(validation.error);
      return;
    }

    // Validar código de país
    if (!countryCode || !countryCode.startsWith('+')) {
      Alert.alert('Error', 'Por favor, ingresa un código de país válido (ej: +1, +52, +54)');
      return;
    }

    setLoading(true);

    try {
      // Solicitar permisos primero
      const hasPermission = await contactsService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permiso requerido',
          'Esta app necesita acceso a tus contactos para guardar el contacto. Por favor, otorga el permiso en configuración.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Mostrar la animación de captura
      setShowCapture(true);
      await soundService.playCaptureSound();

      // Esperar a que la animación termine
      setTimeout(async () => {
        try {
          const customStats = {
            responseTime: statTextToNumber(responseTime),
            confidenceLevel: statTextToNumber(confidenceLevel),
            messageSpeed: statTextToNumber(messageSpeed),
          };

          // Combinar código de país y número de teléfono
          const fullPhoneNumber = `${countryCode}${validation.digits}`;

          if (isEditing) {
            // Actualizar contacto existente - obtener el ID actual devuelto
            let actualContactId = editingContact.id;
            try {
              actualContactId = await contactsService.updateDeviceContact(
                editingContact.id,
                contactName.trim(),
                fullPhoneNumber
              );
            } catch (updateError) {
              console.error('Error al actualizar contacto:', updateError);
              // Si la actualización falla, intentar eliminar el contacto antiguo y crear uno nuevo
              try {
                // Eliminar el mapeo de contacto antiguo
                await contactsService.removeContactPokemonMapping(editingContact.id);
                // Intentar eliminar el contacto antiguo (puede fallar si ya ha sido eliminado)
                try {
                  await contactsService.deleteDeviceContact(editingContact.id);
                } catch (deleteError) {
                  console.log('El contacto antiguo quizás ya ha sido eliminado:', deleteError);
                }
                // Crear nuevo contacto
                actualContactId = await contactsService.createDeviceContact(
                  contactName.trim(),
                  fullPhoneNumber
                );
              } catch (recreateError) {
                console.error('Error recreando contacto:', recreateError);
                throw new Error('No se pudo actualizar el contacto. Por favor, intenta nuevamente.');
              }
            }
            
            // Actualizar asociación de Pokémon con estadísticas personalizadas usando el ID actual
            await contactsService.updateContactPokemonMapping(
              actualContactId || editingContact.id,
              selectedPokemon,
              customStats
            );

            setShowCapture(false);
            setLoading(false);
            
            // Reproducir sonido de edición
            await soundService.playEditSound();
            
            showCustomAlert(
              'Éxito',
              `¡${contactName} ha sido actualizado!`,
              'success',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    hideCustomAlert();
                    navigation.navigate('Home', { 
                      highlightContactId: actualContactId || editingContact.id,
                      shouldReload: true
                    });
                  },
                },
              ]
            );
          } else {
            // Crear nuevo contacto
            const contactId = await contactsService.createDeviceContact(
              contactName.trim(),
              fullPhoneNumber
            );

            // Guardar asociación de Pokémon con estadísticas personalizadas
            await contactsService.saveContactPokemonMapping(
              contactId,
              selectedPokemon,
              customStats
            );

            setShowCapture(false);
            setLoading(false);
            
            // Reproducir sonido de guardado
            await soundService.playSaveSound();
            
            showCustomAlert(
              'Éxito',
              `¡${contactName} ha sido agregado a tus contactos con ${selectedPokemon.name}!`,
              'success',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    hideCustomAlert();
                    navigation.navigate('Home', { 
                      highlightContactId: contactId,
                      shouldReload: true
                    });
                  },
                },
              ]
            );
          }
        } catch (error) {
          console.error('Error guardando contacto:', error);
          setShowCapture(false);
          setLoading(false);
          showCustomAlert('Error', `Error al guardar el contacto: ${error.message}`, 'error');
        }
      }, 3000);
    } catch (error) {
      console.error('Error en handleSaveContact:', error);
      setLoading(false);
      showCustomAlert('Error', `No se pudo guardar el contacto: ${error.message}`, 'error');
    }
  };

  if (showCapture) {
    return (
      <CaptureAnimation
        pokemonSprite={selectedPokemon?.sprite}
        onComplete={() => {
          // Callback cuando la animación completa
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Animatable.View
          animation="fadeInDown"
          duration={500}
          style={styles.header}
        >
          <Text style={styles.title}>{isEditing ? 'EDITAR CONTACTO' : 'AGREGAR CONTACTO'}</Text>
        </Animatable.View>

        {/* Formulario de información del contacto */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>INFORMACIÓN DEL CONTACTO</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del Contacto"
            placeholderTextColor={colors.metallicGray}
            value={contactName}
            onChangeText={setContactName}
            autoCapitalize="words"
            onFocus={async () => {
              await playButtonSound();
            }}
          />
          <View style={styles.phoneContainer}>
            <TextInput
              style={[styles.input, styles.countryCodeInput]}
              placeholder="+1"
              placeholderTextColor={colors.metallicGray}
              value={countryCode}
              onChangeText={(text) => {
                // Solo permitir + y dígitos
                const cleaned = text.replace(/[^\d+]/g, '');
                if (cleaned.startsWith('+')) {
                  setCountryCode(cleaned);
                } else if (cleaned) {
                  setCountryCode('+' + cleaned);
                } else {
                  setCountryCode('+');
                }
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              maxLength={4}
              onFocus={async () => {
                await playButtonSound();
              }}
            />
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="1234567890"
              placeholderTextColor={colors.metallicGray}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              autoCapitalize="none"
              maxLength={10}
              onFocus={async () => {
                await playButtonSound();
              }}
            />
          </View>
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : phoneNumber.length === 10 ? (
            <Text style={styles.validText}>✓ Número de teléfono válido</Text>
          ) : phoneNumber.length > 0 ? (
            <Text style={styles.hintText}>
              {phoneNumber.length}/10 dígitos
            </Text>
          ) : null}
        </View>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'random' && styles.modeButtonActive, { marginRight: spacing.md }]}
            onPress={async () => {
              await playButtonSound();
              setMode('random');
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'random' && styles.modeButtonTextActive,
              ]}
            >
              RANDOM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'search' && styles.modeButtonActive]}
            onPress={async () => {
              await playButtonSound();
              setMode('search');
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === 'search' && styles.modeButtonTextActive,
              ]}
            >
              SEARCH
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recibir Contacto Button */}
        <TouchableOpacity
          style={styles.receiveButton}
          onPress={handleReceiveContact}
        >
          <Text style={styles.receiveButtonText}>¡RECIBIR CONTACTO!</Text>
        </TouchableOpacity>

      {mode === 'random' ? (
        <View style={styles.randomContainer}>
          <TouchableOpacity
            style={styles.randomButton}
            onPress={async () => {
              await playButtonSound();
              await handleRandomPokemon();
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.randomButtonText}>¡OBTENER POKÉMON ALEATORIO!</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o número..."
            placeholderTextColor={colors.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            onFocus={async () => {
              await playButtonSound();
              if (allPokemonList.length === 0) {
                await loadAllPokemonList();
              }
            }}
          />
          <TouchableOpacity
            style={styles.toggleListButton}
            onPress={toggleListExpanded}
          >
            <Text style={styles.toggleListButtonText}>
              {isListExpanded ? '▼ OCULTAR LISTA' : '▶ MOSTRAR LISTA COMPLETA'}
            </Text>
          </TouchableOpacity>
          {(isListExpanded || searchQuery.trim()) && (
            <ScrollView 
              style={styles.resultsContainer}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {isLoadingList ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchingText}>Cargando lista...</Text>
                </View>
              ) : isSearching ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchingText}>Buscando...</Text>
                </View>
              ) : filteredPokemonList.length > 0 ? (
                filteredPokemonList.map((result, index) => (
                  <TouchableOpacity
                    key={`${result.id}-${index}`}
                    style={styles.resultItem}
                    onPress={() => handleSelectPokemon(result)}
                  >
                    <Text style={styles.resultText}>
                      #{result.id.toString().padStart(3, '0')} - {result.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : searchQuery.trim() ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No se encontraron Pokémon</Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      )}

      {selectedPokemon && (
        <Animatable.View
          animation="fadeInUp"
          duration={500}
          style={styles.selectedContainer}
        >
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>POKÉMON SELECCIONADO</Text>
            {mode === 'search' && (
              <TouchableOpacity
                style={styles.changePokemonButton}
                onPress={handleChangePokemon}
              >
                <Text style={styles.changePokemonButtonText}>CAMBIAR</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.pokemonPreview}>
            <Animatable.Image
              animation="pulse"
              iterationCount="infinite"
              duration={2000}
              source={{ uri: selectedPokemon.sprite }}
              style={styles.pokemonSprite}
              resizeMode="contain"
            />
            <Text style={styles.pokemonName}>
              {selectedPokemon.name ? selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1) : 'Unknown'}
            </Text>
            <Text style={styles.pokemonId}>#{selectedPokemon.id.toString().padStart(3, '0')}</Text>
            <View style={styles.typesContainer}>
              {selectedPokemon.types?.map((type, index) => (
                <View
                  key={index}
                  style={[
                    styles.typeBadge,
                    { 
                      backgroundColor: colors.typeColors[type] || colors.metallicGray,
                      marginRight: index < selectedPokemon.types.length - 1 ? spacing.sm : 0,
                    },
                  ]}
                >
                  <Text style={styles.typeText}>{type.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sección de estadísticas personalizadas */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>ESTADÍSTICAS PERSONALIZADAS</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tiempo de Respuesta:</Text>
              <TouchableOpacity
                style={styles.statSelector}
                onPress={async () => {
                  await soundService.playButtonSound();
                  setCurrentStatType('responseTime');
                  setShowStatPicker(true);
                }}
              >
                <Text style={styles.statSelectorText}>{responseTime}</Text>
                <Text style={styles.statSelectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Nivel de Confianza:</Text>
              <TouchableOpacity
                style={styles.statSelector}
                onPress={async () => {
                  await soundService.playButtonSound();
                  setCurrentStatType('confidenceLevel');
                  setShowStatPicker(true);
                }}
              >
                <Text style={styles.statSelectorText}>{confidenceLevel}</Text>
                <Text style={styles.statSelectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Velocidad de Mensajes:</Text>
              <TouchableOpacity
                style={styles.statSelector}
                onPress={async () => {
                  await soundService.playButtonSound();
                  setCurrentStatType('messageSpeed');
                  setShowStatPicker(true);
                }}
              >
                <Text style={styles.statSelectorText}>{messageSpeed}</Text>
                <Text style={styles.statSelectorArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal de selección de estadística */}
          <Modal
            visible={showStatPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowStatPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Seleccionar {currentStatType === 'responseTime' ? 'Tiempo de Respuesta' : 
                          currentStatType === 'confidenceLevel' ? 'Nivel de Confianza' : 
                          'Velocidad de Mensajes'}
                </Text>
                {statOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalOption}
                    onPress={async () => {
                      await soundService.playButtonSound();
                      if (currentStatType === 'responseTime') {
                        setResponseTime(option);
                      } else if (currentStatType === 'confidenceLevel') {
                        setConfidenceLevel(option);
                      } else {
                        setMessageSpeed(option);
                      }
                      setShowStatPicker(false);
                      setCurrentStatType(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.modalOption, styles.modalCancel]}
                  onPress={async () => {
                    await soundService.playButtonSound();
                    setShowStatPicker(false);
                    setCurrentStatType(null);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            style={[styles.saveButton, (loading || !contactName.trim() || !phoneNumber.trim()) && styles.saveButtonDisabled]}
            onPress={async () => {
              await playButtonSound();
              await handleSaveContact();
            }}
            disabled={loading || !contactName.trim() || !phoneNumber.trim()}
          >
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={1500}
              style={styles.saveButtonGlow}
            />
            <Text style={styles.saveButtonText}>
              {loading ? 'GUARDANDO...' : isEditing ? 'ACTUALIZAR CONTACTO' : 'CAPTURAR Y GUARDAR'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      )}

      {/* Modulo de recepción de contacto */}
      <Modal
        visible={showReceiveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¡RECIBIR CONTACTO!</Text>
            <Text style={styles.modalSubtitle}>
              Pega el texto del contacto compartido (debe ser un JSON válido):
            </Text>
            <TextInput
              style={styles.receiveTextInput}
              placeholder="Pega el JSON del contacto aquí..."
              placeholderTextColor={colors.metallicGray}
              value={receiveText}
              onChangeText={setReceiveText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowReceiveModal(false);
                  setReceiveText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalImportButton]}
                onPress={handleImportContact}
              >
                <Text style={styles.modalButtonText}>Importar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CustomAlert personalizado */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
        buttons={customAlert.buttons}
        onClose={hideCustomAlert}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  formTitle: {
    ...typography.subtitle,
    color: colors.neonGreen,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.metallicGray,
    ...typography.body,
    marginBottom: spacing.md,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.darkGray,
    borderWidth: 2,
    borderColor: colors.metallicGray,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeButtonText: {
    ...typography.body,
    color: colors.lightGray,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  randomContainer: {
    marginVertical: spacing.xl,
  },
  randomButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  randomButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.darkGray,
    color: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.metallicGray,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  toggleListButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  toggleListButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.md,
    maxHeight: 300,
    borderWidth: 2,
    borderColor: colors.metallicGray,
  },
  resultItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.metallicGray,
  },
  resultText: {
    ...typography.body,
    color: colors.white,
    textTransform: 'capitalize',
  },
  selectedContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedTitle: {
    ...typography.subtitle,
    flex: 1,
    textAlign: 'center',
    color: colors.neonGreen,
  },
  changePokemonButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  changePokemonButtonText: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
  },
  pokemonPreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pokemonSprite: {
    width: 150,
    height: 150,
    marginBottom: spacing.md,
  },
  pokemonName: {
    ...typography.title,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  pokemonId: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: spacing.md,
  },
  typesContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  typeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    opacity: 1,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.neonGreen,
    opacity: 0.3,
  },
  saveButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.black,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statsTitle: {
    ...typography.subtitle,
    color: colors.neonGreen,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statLabel: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
  },
  statSelector: {
    backgroundColor: colors.darkGray,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.metallicGray,
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statSelectorText: {
    ...typography.body,
    color: colors.white,
  },
  statSelectorArrow: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.darkGray,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.subtitle,
    color: colors.neonGreen,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalOption: {
    backgroundColor: colors.black,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.metallicGray,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: spacing.md,
    backgroundColor: colors.metallicGray,
  },
  modalCancelText: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  countryCodeInput: {
    flex: 0.3,
    marginRight: spacing.sm,
    marginBottom: 0,
  },
  phoneInput: {
    flex: 0.7,
    marginBottom: 0,
  },
  errorText: {
    ...typography.small,
    color: colors.primary,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  validText: {
    ...typography.small,
    color: colors.secondary,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  hintText: {
    ...typography.small,
    color: colors.metallicGray,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  searchingContainer: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchingText: {
    ...typography.body,
    color: colors.lightGray,
    marginLeft: spacing.sm,
  },
  noResultsContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  noResultsText: {
    ...typography.body,
    color: colors.metallicGray,
  },
  receiveButton: {
    backgroundColor: colors.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  receiveButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: 'bold',
  },
  receiveTextInput: {
    backgroundColor: colors.black,
    color: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.metallicGray,
    ...typography.body,
    minHeight: 150,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.metallicGray,
  },
  modalImportButton: {
    backgroundColor: colors.primary,
  },
});

export default AddContactScreen;

