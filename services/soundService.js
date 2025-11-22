import { Audio } from 'expo-av';

// Sound service for managing all app sounds
// Coloca tus archivos FLAC en la carpeta assets/sounds/:
// - button.flac (para clics de botón)
// - background.flac (para música de fondo - se reproducirá en bucle continuamente)
// - save.flac (para guardar contacto exitosamente)
// - edit.flac (para editar contacto exitosamente)
// - capture.flac (para animación de captura de Pokémon)
class SoundService {
  constructor() {
    this.buttonSound = null;
    this.backgroundMusic = null; // Mantener para compatibilidad
    this.backgroundMusicTracks = []; // Array de tracks de música de fondo
    this.currentTrackIndex = 0; // Índice del track actual
    this.saveSound = null;
    this.editSound = null;
    this.captureSound = null;
    this.pokeballOpenSound = null;
    this.isBackgroundMusicPlaying = false;
    this.backgroundMusicVolume = 0.3; // 30% de volumen para música de fondo
    this.soundEffectsVolume = 0.7; // 70% de volumen para efectos de sonido
    this.isChangingTrack = false; // Flag para prevenir cambios simultáneos de track
    this.playbackStatusListeners = []; // Array para almacenar referencias a los listeners
  }

  // Inicializar todos los sonidos
  async initialize() {
    try {
      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  // Cargar sonido desde el módulo de asset
  // Formatos soportados: MP3
  async loadSoundFromAsset(assetModule, options = {}) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        assetModule,
        {
          volume: options.volume || this.soundEffectsVolume,
          shouldPlay: false,
          isLooping: options.isLooping || false,
        }
      );
      return sound;
    } catch (error) {
      console.log(`Error cargando sonido: ${error.message}`);
      return null;
    }
  }

  // Cargar sonido de botón
  // Place your button sound file in assets/sounds/ as button.mp3
  async loadButtonSound() {
    try {
      const asset = require('../assets/sounds/button.mp3');
      this.buttonSound = await this.loadSoundFromAsset(asset, {
        volume: this.soundEffectsVolume,
      });
    } catch (error) {
      console.log('Button sound not found - place button.mp3 in assets/sounds/');
      this.buttonSound = null;
    }
  }

  // Cargar música de fondo
  // Coloca tus archivos de música de fondo en la carpeta assets/sounds/ como:
  // - background1.mp3 (obligatorio)
  // - background2.mp3 (opcional)
  // - background3.mp3 (opcional)
  // Si solo existe background1.mp3, se reproducirá en bucle
  // Si existen múltiples archivos, se reproducirán en secuencia
  async loadBackgroundMusic() {
    // Si ya hay tracks cargados, no recargar (evitar detener la música)
    if (this.backgroundMusicTracks.length > 0) {
      // Verificar si la música está reproduciéndose y reanudarla si se detuvo
      if (this.isBackgroundMusicPlaying) {
        // Verificar el estado actual del track
        try {
          const currentTrack = this.backgroundMusicTracks[this.currentTrackIndex];
          if (currentTrack) {
            const status = await currentTrack.getStatusAsync();
            if (!status.isPlaying && status.isLoaded) {
              // Si el track está cargado pero no reproduciéndose, reanudarlo
              await currentTrack.playAsync();
            }
          }
        } catch (error) {
          // Si hay error, intentar reproducir desde el inicio
          await this.playBackgroundMusic();
        }
      }
      return; // Ya está cargado, no recargar
    }
    
    // Solo limpiar si no hay tracks cargados
    this.backgroundMusicTracks = [];
    this.playbackStatusListeners = [];
    this.currentTrackIndex = 0;
    this.isChangingTrack = false;
    
    // Función auxiliar para cargar un track individual
    const loadTrack = async (asset, trackNumber) => {
      try {
        const track = await this.loadSoundFromAsset(asset, {
          volume: this.backgroundMusicVolume,
          isLooping: false, // No hacer loop individual, manejaremos la secuencia
        });
        
        if (track) {
          // Configurar listener para cuando termine el track
          track.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish && !status.isLooping) {
              // Cuando termine, reproducir el siguiente track (solo si no estamos ya cambiando)
              if (!this.isChangingTrack) {
                this.playNextBackgroundTrack();
              }
            }
          });
          
          // Guardar referencia al track para poder limpiarlo después
          this.playbackStatusListeners.push({ track });
          this.backgroundMusicTracks.push(track);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    };

    // Intentar cargar background1.mp3 (require debe ser estático, no dinámico)
    try {
      const asset1 = require('../assets/sounds/background1.mp3');
      const track1Loaded = await loadTrack(asset1, 1);
      
      if (track1Loaded) {
        // Si background1.mp3 se cargó, intentar cargar los siguientes tracks opcionales
        try {
          const asset2 = require('../assets/sounds/background2.mp3');
          await loadTrack(asset2, 2);
        } catch (error) {
          // background2.mp3 no existe, continuar
        }
        
        try {
          const asset3 = require('../assets/sounds/background3.mp3');
          await loadTrack(asset3, 3);
        } catch (error) {
          // background3.mp3 no existe, continuar
        }
        
      }
    } catch (error) {
      // Si background1.mp3 no existe, intentar con background.mp3 (compatibilidad)
      try {
        const fallbackAsset = require('../assets/sounds/background.mp3');
        const fallbackTrack = await this.loadSoundFromAsset(fallbackAsset, {
          volume: this.backgroundMusicVolume,
          isLooping: true, // Bucle para el archivo único
        });
        if (fallbackTrack) {
          this.backgroundMusicTracks.push(fallbackTrack);
          this.backgroundMusic = fallbackTrack; // Compatibilidad
          return;
        }
      } catch (fallbackError) {
        console.log('Música de fondo no encontrada - coloca background1.mp3 o background.mp3 en assets/sounds/');
        this.backgroundMusic = null;
        return;
      }
    }

    // Si solo hay un track, configurarlo para que haga loop
    if (this.backgroundMusicTracks.length === 1) {
      try {
        await this.backgroundMusicTracks[0].setIsLoopingAsync(true);
      } catch (error) {
        // Si falla, el listener manejará el loop manualmente
      }
    }

    // Para compatibilidad, establecer el primer track como backgroundMusic
    if (this.backgroundMusicTracks.length > 0) {
      this.backgroundMusic = this.backgroundMusicTracks[0];
    } else {
      this.backgroundMusic = null;
    }
  }

  // Reproducir el siguiente track de música de fondo
  async playNextBackgroundTrack() {
    // Prevenir múltiples llamadas simultáneas
    if (this.isChangingTrack || this.backgroundMusicTracks.length === 0) return;
    
    this.isChangingTrack = true;
    
    try {
      // Detener el track actual
      const currentTrack = this.backgroundMusicTracks[this.currentTrackIndex];
      if (currentTrack) {
        try {
          await currentTrack.stopAsync();
        } catch (error) {
          // Ignorar errores al detener
        }
      }

      // Si solo hay un track, reproducirlo de nuevo (bucle)
      if (this.backgroundMusicTracks.length === 1) {
        const track = this.backgroundMusicTracks[0];
        await track.setPositionAsync(0);
        await track.playAsync();
        this.isChangingTrack = false;
        return;
      }

      // Avanzar al siguiente track
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.backgroundMusicTracks.length;
      const nextTrack = this.backgroundMusicTracks[this.currentTrackIndex];
      
      // Reproducir el siguiente track
      await nextTrack.setPositionAsync(0);
      await nextTrack.playAsync();
    } catch (error) {
      console.log('Error reproduciendo siguiente track:', error);
    } finally {
      // Resetear el flag después de un pequeño delay para evitar llamadas rápidas
      setTimeout(() => {
        this.isChangingTrack = false;
      }, 100);
    }
  }

  // Limpiar música de fondo (tracks y listeners)
  async cleanupBackgroundMusic() {
    try {
      // Detener todos los tracks
      for (const track of this.backgroundMusicTracks) {
        try {
          await track.stopAsync();
          await track.unloadAsync();
        } catch (error) {
          // Continuar con el siguiente si uno falla
        }
      }

      // Limpiar listeners (setOnPlaybackStatusUpdate se limpia automáticamente al unload)
      // Solo necesitamos limpiar el array de referencias

      this.backgroundMusicTracks = [];
      this.playbackStatusListeners = [];
      this.currentTrackIndex = 0;
      this.isBackgroundMusicPlaying = false;
      this.isChangingTrack = false;
    } catch (error) {
      console.log('Error limpiando música de fondo:', error);
    }
  }

  // Cargar sonido de guardado
  // Coloca tu archivo de sonido de guardado en la carpeta assets/sounds/ como save.mp3
  async loadSaveSound() {
    try {
      const asset = require('../assets/sounds/save.mp3');
      this.saveSound = await this.loadSoundFromAsset(asset, {
        volume: this.soundEffectsVolume,
      });
    } catch (error) {
      console.log('Sonido de guardado no encontrado - coloca save.mp3 en assets/sounds/');
      this.saveSound = null;
    }
  }

  // Cargar sonido de edición
  // Coloca tu archivo de sonido de edición en la carpeta assets/sounds/ como edit.mp3
  async loadEditSound() {
    try {
      const asset = require('../assets/sounds/edit.mp3');
      this.editSound = await this.loadSoundFromAsset(asset, {
        volume: this.soundEffectsVolume,
      });
    } catch (error) {
      console.log('Sonido de edición no encontrado - coloca edit.mp3 en assets/sounds/');
      this.editSound = null;
    }
  }

  // Cargar sonido de captura
  // Coloca tu archivo de sonido de captura en la carpeta assets/sounds/ como capture.mp3
  async loadCaptureSound() {
    try {
      const asset = require('../assets/sounds/capture.mp3');
      this.captureSound = await this.loadSoundFromAsset(asset, {
        volume: this.soundEffectsVolume,
      });
    } catch (error) {
      console.log('Sonido de captura no encontrado - coloca capture.mp3 en assets/sounds/');
      this.captureSound = null;
    }
  }

  // Cargar sonido de pokeball abriéndose
  // Coloca tu archivo de sonido de pokeball en la carpeta assets/sounds/ como pokeball.mp3
  async loadPokeballOpenSound() {
    try {
      const asset = require('../assets/sounds/pokeball.mp3');
      this.pokeballOpenSound = await this.loadSoundFromAsset(asset, {
        volume: this.soundEffectsVolume,
      });
    } catch (error) {
      console.log('Sonido de pokeball no encontrado - coloca pokeball.mp3 en assets/sounds/');
      this.pokeballOpenSound = null;
    }
  }

    // Cargar todos los sonidos
  async loadAllSounds() {
    await this.initialize();
    await Promise.all([
      this.loadButtonSound(),
      this.loadBackgroundMusic(),
      this.loadSaveSound(),
      this.loadEditSound(),
      this.loadCaptureSound(),
      this.loadPokeballOpenSound(),
    ]);
  }

  // Reproducir sonido de botón
  async playButtonSound() {
    try {
      if (this.buttonSound) {
        try {
          await this.buttonSound.replayAsync();
        } catch (replayError) {
          // Si la reproducción falla, intentar reproducir en su lugar
          try {
            await this.buttonSound.playAsync();
          } catch (playError) {
            // Silenciosamente fallar si ambos métodos fallan
          }
        }
      }
    } catch (error) {
      // Silenciosamente fallar si el sonido no existe o no puede reproducirse
    }
  }

  // Reproducir música de fondo
  async playBackgroundMusic() {
    try {
      if (this.backgroundMusicTracks.length > 0) {
        const trackToPlay = this.backgroundMusicTracks[this.currentTrackIndex];
        
        // Verificar el estado actual del track
        try {
          const status = await trackToPlay.getStatusAsync();
          
          if (status.isLoaded) {
            if (!status.isPlaying) {
              // Si el track está cargado pero no reproduciéndose, reproducirlo
              if (status.didJustFinish || status.positionMillis === 0) {
                // Si terminó o está al inicio, reproducir desde el inicio
                await trackToPlay.setPositionAsync(0);
              }
              await trackToPlay.playAsync();
              this.isBackgroundMusicPlaying = true;
            } else {
              // Ya está reproduciéndose, solo actualizar el flag
              this.isBackgroundMusicPlaying = true;
            }
          } else {
            // Si no está cargado, cargar y reproducir
            await trackToPlay.setPositionAsync(0);
            await trackToPlay.playAsync();
            this.isBackgroundMusicPlaying = true;
          }
        } catch (statusError) {
          // Si hay error al obtener el estado, intentar reproducir de todas formas
          await trackToPlay.setPositionAsync(0);
          await trackToPlay.playAsync();
          this.isBackgroundMusicPlaying = true;
        }
      } else if (this.backgroundMusic) {
        // Compatibilidad: si solo existe background.mp3
        try {
          const status = await this.backgroundMusic.getStatusAsync();
          if (!status.isPlaying) {
            await this.backgroundMusic.playAsync();
          }
          this.isBackgroundMusicPlaying = true;
        } catch (error) {
          await this.backgroundMusic.playAsync();
          this.isBackgroundMusicPlaying = true;
        }
      }
    } catch (error) {
      console.log('Error reproduciendo música de fondo:', error);
    }
  }

  // Detener música de fondo
  async stopBackgroundMusic() {
    try {
      if (this.backgroundMusicTracks.length > 0 && this.isBackgroundMusicPlaying) {
        // Pausar todos los tracks
        for (const track of this.backgroundMusicTracks) {
          try {
            await track.pauseAsync();
          } catch (error) {
            // Continuar con el siguiente si uno falla
          }
        }
        this.isBackgroundMusicPlaying = false;
      } else if (this.backgroundMusic && this.isBackgroundMusicPlaying) {
        // Compatibilidad: si solo existe background.mp3
        await this.backgroundMusic.pauseAsync();
        this.isBackgroundMusicPlaying = false;
      }
    } catch (error) {
      console.log('Error deteniendo música de fondo:', error);
    }
  }

  // Reproducir sonido de guardado
  async playSaveSound() {
    try {
      if (this.saveSound) {
        try {
          await this.saveSound.replayAsync();
        } catch (replayError) {
          try {
            await this.saveSound.playAsync();
          } catch (playError) {
            // Silenciosamente fallar
          }
        }
      }
    } catch (error) {
      // Silenciosamente fallar si el sonido no existe o no puede reproducirse
    }
  }

    // Reproducir sonido de edición
  async playEditSound() {
    try {
      if (this.editSound) {
        try {
          await this.editSound.replayAsync();
        } catch (replayError) {
          try {
            await this.editSound.playAsync();
          } catch (playError) {
            // Silenciosamente fallar
          }
        }
      }
    } catch (error) {
      // Silenciosamente fallar si el sonido no existe o no puede reproducirse
    }
  }

  // Reproducir sonido de captura
  async playCaptureSound() {
    try {
      if (this.captureSound) {
        try {
          await this.captureSound.replayAsync();
        } catch (replayError) {
          try {
            await this.captureSound.playAsync();
          } catch (playError) {
            // Silenciosamente fallar
          }
        }
      }
    } catch (error) {
      // Silenciosamente fallar si el sonido no existe o no puede reproducirse
    }
  }

  // Reproducir sonido de pokeball abriéndose
  async playPokeballOpenSound() {
    try {
      if (this.pokeballOpenSound) {
        try {
          await this.pokeballOpenSound.replayAsync();
        } catch (replayError) {
          try {
            await this.pokeballOpenSound.playAsync();
          } catch (playError) {
            // Silenciosamente fallar
          }
        }
      }
    } catch (error) {
      // Silenciosamente fallar si el sonido no existe o no puede reproducirse
    }
  }

  // Configurar volumen de música de fondo
  async setBackgroundMusicVolume(volume) {
    try {
      this.backgroundMusicVolume = volume;
      // Actualizar volumen de todos los tracks
      if (this.backgroundMusicTracks.length > 0) {
        for (const track of this.backgroundMusicTracks) {
          try {
            await track.setVolumeAsync(volume);
          } catch (error) {
            // Continuar con el siguiente si uno falla
          }
        }
      } else if (this.backgroundMusic) {
        // Compatibilidad: si solo existe background.mp3
        await this.backgroundMusic.setVolumeAsync(volume);
      }
    } catch (error) {
      console.log('Error configurando volumen de música de fondo:', error);
    }
  }

  // Configurar volumen de efectos de sonido
  async setSoundEffectsVolume(volume) {
    try {
      this.soundEffectsVolume = volume;
      // Actualizar todos los volumnes de efectos de sonido
      if (this.buttonSound) {
        await this.buttonSound.setVolumeAsync(volume);
      }
      if (this.saveSound) {
        await this.saveSound.setVolumeAsync(volume);
      }
      if (this.editSound) {
        await this.editSound.setVolumeAsync(volume);
      }
      if (this.captureSound) {
        await this.captureSound.setVolumeAsync(volume);
      }
      if (this.pokeballOpenSound) {
        await this.pokeballOpenSound.setVolumeAsync(volume);
      }
    } catch (error) {
      console.log('Error configurando volumen de efectos de sonido:', error);
    }
  }

  // Limpiar todos los sonidos
  async cleanup() {
    try {
      if (this.buttonSound) {
        await this.buttonSound.unloadAsync();
        this.buttonSound = null;
      }
      // Limpiar música de fondo usando el método dedicado
      await this.cleanupBackgroundMusic();
      
      if (this.backgroundMusic) {
        // Compatibilidad: si solo existe background.mp3
        try {
          await this.backgroundMusic.unloadAsync();
        } catch (error) {
          // Ignorar errores
        }
        this.backgroundMusic = null;
      }
      if (this.saveSound) {
        await this.saveSound.unloadAsync();
        this.saveSound = null;
      }
      if (this.editSound) {
        await this.editSound.unloadAsync();
        this.editSound = null;
      }
      if (this.captureSound) {
        await this.captureSound.unloadAsync();
        this.captureSound = null;
      }
      if (this.pokeballOpenSound) {
        await this.pokeballOpenSound.unloadAsync();
        this.pokeballOpenSound = null;
      }
      this.isBackgroundMusicPlaying = false;
    } catch (error) {
      console.log('Error limpiando todos los sonidos:', error);
    }
  }
}

// Exportar instancia singleton
export const soundService = new SoundService();

