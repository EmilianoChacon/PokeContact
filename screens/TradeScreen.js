import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { soundService } from '../services/soundService';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

// Urls de los sprites de las pokebolas
const POKEBALL_SPRITES = {
  pokeball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  superball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-ball.png',
  ultraball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  quickball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png',
  masterball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
};

// Obtener sprite de pokebola aleatoria
const getRandomPokeball = () => {
  const balls = ['superball', 'ultraball', 'quickball', 'masterball'];
  const randomBall = balls[Math.floor(Math.random() * balls.length)];
  return POKEBALL_SPRITES[randomBall];
};

const TradeScreen = ({ route, navigation }) => {
  const { contact } = route.params;
  const [tradeMode, setTradeMode] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false); 
  const pokeball1Ref = useRef(null);
  const pokeball2Ref = useRef(null);
  const [pokeball1Sprite, setPokeball1Sprite] = useState(getRandomPokeball());
  const [pokeball2Sprite, setPokeball2Sprite] = useState(getRandomPokeball());

  useEffect(() => {
    if (tradeMode) {
      animateTrade();
    }
  }, [tradeMode]);

  const animateTrade = async () => {
    // Animar dos pokebolas cruzando
    if (pokeball1Ref.current && pokeball2Ref.current) {
      // Pokebola 1 se mueve de izquierda a derecha
      pokeball1Ref.current.animate({
        0: { translateX: -width / 2, rotate: '0deg' },
        0.5: { translateX: 0, rotate: '360deg' },
        1: { translateX: width / 2, rotate: '720deg' },
      });

      // Pokebola 2 se mueve de derecha a izquierda
      pokeball2Ref.current.animate({
        0: { translateX: width / 2, rotate: '0deg' },
        0.5: { translateX: 0, rotate: '-360deg' },
        1: { translateX: -width / 2, rotate: '-720deg' },
      });
    }
  };

  const handleQRShare = () => {
    setTradeMode('qr');
  };

  const handleShare = async () => {
    try {
      const contactData = JSON.stringify(contact, null, 2);
      await Share.share({
        message: `Mira este contacto Pokémon: ${contact.name} (ID: ${contact.id})\n\n${contactData}`,
        title: `Compartir ${contact.name}`,
      });
      setTradeMode('share');
    } catch (error) {
      Alert.alert('Error', 'Error al compartir el contacto');
    }
  };

  // Formatear datos del contacto para el QR code - asegurar que todos los campos necesarios estén incluidos
  const contactDataForQR = {
    name: contact.name,
    phoneNumber: contact.phoneNumber || contact.phoneNumbers?.[0]?.number || '',
    pokemonId: contact.pokemon?.id || contact.pokemonId || contact.id,
    pokemon: contact.pokemon || contact,
    customStats: contact.customStats || contact.stats || {
      responseTime: contact.stats?.attack || 50,
      confidenceLevel: contact.stats?.defense || 50,
      messageSpeed: contact.stats?.speed || 50,
    },
  };
  const contactDataString = JSON.stringify(contactDataForQR);

  return (
    <View style={styles.container}>
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
          <Text style={styles.backButtonText}>← ATRÁS</Text>
        </TouchableOpacity>
        <Text style={styles.title}>COMPARTIR CONTACTO</Text>
      </Animatable.View>

      <View style={styles.content}>
        <View style={styles.pokemonInfo}>
          <Text style={styles.pokemonName}>{contact.name}</Text>
          <Text style={styles.pokemonId}>#{contact.id.toString().padStart(3, '0')}</Text>
        </View>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, tradeMode === 'qr' && styles.modeButtonActive, { marginRight: spacing.md }]}
            onPress={async () => {
              await soundService.playButtonSound();
              handleQRShare();
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                tradeMode === 'qr' && styles.modeButtonTextActive,
              ]}
            >
              CÓDIGO QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, tradeMode === 'share' && styles.modeButtonActive]}
            onPress={async () => {
              await soundService.playButtonSound();
              handleShare();
            }}
          >
            <Text
              style={[
                styles.modeButtonText,
                tradeMode === 'share' && styles.modeButtonTextActive,
              ]}
            >
              COMPARTIR
            </Text>
          </TouchableOpacity>
        </View>

        {tradeMode === 'qr' && (
          <Animatable.View
            animation="fadeInUp"
            duration={500}
            style={styles.qrContainer}
          >
            <View style={styles.qrWrapper}>
              <QRCode
                value={contactDataString}
                size={width * 0.7}
                color={colors.white}
                backgroundColor={colors.black}
              />
              <View style={styles.qrGlow} />
            </View>
            <Text style={styles.qrText}>
              Escanea este código QR para agregar {contact.name} a tus contactos
            </Text>
          </Animatable.View>
        )}

        {/* Animación de intercambio - Usando sprites de pokebolas de la API */}
        <View style={styles.animationContainer}>
          <Animatable.View
            ref={pokeball1Ref}
            style={styles.pokeballContainer}
          >
            <Image
              source={{ uri: pokeball1Sprite }}
              style={styles.pokeballSprite}
              resizeMode="contain"
            />
          </Animatable.View>

          <Animatable.View
            ref={pokeball2Ref}
            style={[styles.pokeballContainer, styles.pokeballRight]}
          >
            <Image
              source={{ uri: pokeball2Sprite }}
              style={styles.pokeballSprite}
              resizeMode="contain"
            />
          </Animatable.View>
        </View>

        {tradeMode && (
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1500}
            style={styles.statusContainer}
          >
            <View style={styles.statusLed} />
            <Text style={styles.statusText}>INTERCAMBIANDO...</Text>
          </Animatable.View>
        )}
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  pokemonInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pokemonName: {
    ...typography.title,
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  pokemonId: {
    ...typography.body,
    color: colors.lightGray,
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    width: '100%',
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
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  qrWrapper: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    position: 'relative',
  },
  qrGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: colors.neonGreen,
    opacity: 0.3,
    borderRadius: borderRadius.md,
    zIndex: -1,
  },
  qrText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  animationContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: 200,
  },
  pokeballContainer: {
    width: 80,
    height: 80,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeballRight: {
    right: 0,
  },
  pokeballSprite: {
    width: 80,
    height: 80,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  statusLed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neonGreen,
    marginRight: spacing.sm,
  },
  statusText: {
    ...typography.body,
    color: colors.neonGreen,
    fontWeight: '600',
  },
});

export default TradeScreen;

