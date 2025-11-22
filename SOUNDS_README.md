# Guía para Agregar Sonidos a Pokecontact

Esta aplicación soporta sonidos personalizados para mejorar la experiencia del usuario. Sigue estas instrucciones para agregar tus propios archivos de audio(si gustas modificar el programa)

## 📁 Estructura de Carpetas


```
pokecontact/
├── assets/
│   └── sounds/
│       ├── button.mp3 (o .m4a, .wav, .ogg)
│       ├── background.mp3 (o .m4a, .wav, .ogg)
│       ├── save.mp3 (o .m4a, .wav, .ogg)
│       ├── edit.mp3 (o .m4a, .wav, .ogg)
│       └── capture.mp3 (o .m4a, .wav, .ogg)
```

##  Formatos de Audio Soportados

La aplicación soporta los siguientes formatos de audio:
- **MP3** (recomendado)
- **M4A**
- **WAV**
- **OGG**


## Archivos de Sonido Requeridos

### 1. `button.mp3` (o .m4a, .wav, .ogg)
- **Uso:** Se reproduce cuando se hace clic en cualquier botón de la aplicación
- **Recomendación:** Un sonido corto y sutil (0.1-0.3 segundos)

### 2. `background.mp3` (o .m4a, .wav, .ogg)
- **Uso:** Música de fondo que se reproduce en bucle continuamente
- **Recomendación:** Una pista musical de Pokémon o ambiente (2-5 minutos)
- **Nota:** Se repetirá automáticamente cuando termine

### 3. `save.mp3` (o .m4a, .wav, .ogg)
- **Uso:** Se reproduce cuando se guarda exitosamente un nuevo contacto
- **Recomendación:** Un sonido de éxito o confirmación (0.5-1 segundo)

### 4. `edit.mp3` (o .m4a, .wav, .ogg)
- **Uso:** Se reproduce cuando se edita exitosamente un contacto
- **Recomendación:** Un sonido de éxito o confirmación diferente al de guardar (0.5-1 segundo)

### 5. `capture.mp3` (o .m4a, .wav, .ogg)
- **Uso:** Se reproduce durante la animación de captura de Pokémon
- **Recomendación:** El sonido clásico de captura de Pokémon (1-2 segundos)


## 🎚️ Volúmenes Predeterminados

- **Música de fondo:** 20% del volumen máximo
- **Efectos de sonido (botones, guardar, editar, captura):** 70% del volumen máximo

Estos valores se pueden ajustar en `services/soundService.js` si es necesario.

## ⚠️ Notas Importantes


2. **Tamaño de archivos:** Mantén los archivos de audio pequeños para no afectar el rendimiento de la aplicación:
   - Sonidos de botones: < 100 KB
   - Sonidos de eventos: < 200 KB
   - Música de fondo: < 5 MB (comprimida)

3. **Si los sonidos no se reproducen:**
   - Verifica que los archivos estén en la carpeta correcta (`assets/sounds/`)
   - Verifica que los nombres de los archivos sean correctos
   - Verifica que los archivos estén en un formato compatible (MP3, M4A, WAV, OGG)
   - Revisa la consola para mensajes de error

4. **Música de fondo:** La música de fondo se reproducirá automáticamente cuando se inicie la aplicación y se repetirá continuamente. Si no deseas música de fondo, simplemente no agregues el archivo `background.mp3`.

##  Funcionalidades de Sonido

-  Sonidos de botones en todas las pantallas
-  Música de fondo que se repite automáticamente
-  Sonido al guardar un contacto
-  Sonido al editar un contacto
-  Sonido durante la animación de captura

##  Soporte

Si tienes problemas para agregar sonidos, verifica:
1. Que los archivos estén en la carpeta correcta
2. Que los nombres de los archivos sean correctos
3. Que los archivos estén en un formato compatible
4. Que hayas reiniciado la aplicación después de agregar los archivos



