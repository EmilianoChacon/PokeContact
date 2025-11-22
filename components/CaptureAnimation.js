import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

// URLs de sprites de Pokéball desde PokeAPI
const POKEBALL_SPRITES = {
  pokeball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  superball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-ball.png',
  ultraball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
  quickball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-ball.png',
  masterball: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
};

// Obtener sprite de Pokéball aleatorio
const getRandomPokeball = () => {
  const balls = ['superball', 'ultraball', 'quickball', 'masterball'];
  const randomBall = balls[Math.floor(Math.random() * balls.length)];
  return POKEBALL_SPRITES[randomBall];
};

const CaptureAnimation = ({ pokemonSprite, onComplete }) => {
  const pokeballRef = useRef(null);
  const pokemonRef = useRef(null);
  const flashRef = useRef(null);
  const [pokeballSprite, setPokeballSprite] = React.useState(getRandomPokeball());

  useEffect(() => {
    // Secuencia de animación
    const animate = async () => {
      // Pokéball lanza desde abajo
      if (pokeballRef.current) {
        await pokeballRef.current.animate({
          0: { translateY: 200, rotate: '0deg', scale: 0.5 },
          0.5: { translateY: -50, rotate: '360deg', scale: 1 },
          1: { translateY: 0, rotate: '720deg', scale: 1 },
        }).then(async () => {
          // Efecto de flash
          if (flashRef.current) {
            flashRef.current.animate({
              0: { opacity: 0, scale: 0 },
              0.3: { opacity: 1, scale: 3 },
              0.6: { opacity: 0, scale: 4 },
              1: { opacity: 0, scale: 4 },
            });
          }
          
          // Pokémon aparece con brillo
          if (pokemonRef.current) {
            await pokemonRef.current.animate({
              0: { scale: 0, opacity: 0 },
              0.5: { scale: 1.2, opacity: 1 },
              1: { scale: 1, opacity: 1 },
            });
          }

          // Esperar un poco y luego llamar a onComplete
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1000);
        });
      }
    };

    animate();
  }, []);

  return (
    <View style={styles.container}>
      {/* Efecto de flash */}
      <Animatable.View
        ref={flashRef}
        style={styles.flash}
      />

      {/* Sprite de Pokémon */}
      {pokemonSprite && (
        <Animatable.View
          ref={pokemonRef}
          style={styles.pokemonContainer}
        >
          <Image
            source={{ uri: pokemonSprite }}
            style={styles.pokemonSprite}
            resizeMode="contain"
          />
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={1000}
            style={styles.glow}
          />
        </Animatable.View>
      )}

      {/* Pokéball - Usando sprite aleatorio desde PokeAPI */}
      <Animatable.View
        ref={pokeballRef}
        style={styles.pokeballContainer}
      >
        <Image
          source={{ uri: pokeballSprite }}
          style={styles.pokeballSprite}
          resizeMode="contain"
        />
      </Animatable.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  flash: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    backgroundColor: colors.neonGreen,
    borderRadius: width,
  },
  pokemonContainer: {
    position: 'relative',
    zIndex: 10,
  },
  pokemonSprite: {
    width: 200,
    height: 200,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: colors.neonGreen,
    opacity: 0.3,
    borderRadius: 120,
  },
  pokeballContainer: {
    position: 'absolute',
    bottom: 100,
    zIndex: 5,
  },
  pokeballSprite: {
    width: 100,
    height: 100,
  },
});

export default CaptureAnimation;

