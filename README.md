# Pokecontact

Una app de contactos con temática de Pokémon

## Características

- **Home Screen**: Busqueda de contactos con filtros y visualización de contactos, nombres, números, pokémon asignado y estadísticas
- **Add Contact**: Añadir contactos con sus pokémon mediante aleatoriedad o busqueda
- **Contact Details**: Ver detalles y estadísticas de contactos propios o con otros contactos
- **Trade Screen**: Comparte contactos mediante JSONs (en proceso)
- **Animations**: Animaciones vistozas
- **PokéAPI Integration**: Datos en tiempo real mediante la API de Pokémon

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el proyecto en Expo Go:
```bash
npm start
```

3. Abrir la app mediante la app Expo GO

## Estructura del proyecto

```
pokecontact/
├── components/
│   ├── ContactCard.js
│   ├── PokemonStatsBar.js
│   └── CaptureAnimation.js
├── screens/
│   ├── HomeScreen.js
│   ├── AddContactScreen.js
│   ├── ContactDetailScreen.js
│   └── TradeScreen.js
├── services/
│   ├── pokeApi.js
│   └── storage.js
├── assets/
│   └── (sounds and images)
├── theme.js
└── App.js
```

## Tecnologías usadas

- React Native
- Expo
- React Navigation
- React Native Animatable
- React Native Reanimated
- Expo AV (for sounds)
- Axios (for API calls)
- AsyncStorage (for local storage)
- React Native QR Code SVG

## Diseño

La app toma de inspiración una paleta de colores futurista y con estilo de Pokédex:
- Color primario: #E3350D (Pokémon red)
- Color para acentuar: #39FF14 (neon green)
- Texturas tipo metal y efectos LED
- Trancisiones simples y animaciones vistosas

## Licencias

MIT
