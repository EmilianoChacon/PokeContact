// Colores y constantes de estilo del tema
export const colors = {
  primary: '#DF3B23', // Rojo
  secondary: '#35C2B0', // Teal/Cyan
  black: '#000000',
  darkGray: '#383C40', // Gris oscuro
  metallicGray: '#C9CFCF', // Gris claro
  lightGray: '#84B4B9', // Gris claro azulado
  neonGreen: '#35C2B0', // Using secondary as accent
  white: '#FFFFFF',
  typeColors: {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  },
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  body: {
    fontSize: 16,
    color: colors.metallicGray,
  },
  small: {
    fontSize: 14,
    color: colors.metallicGray,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

export const shadows = {
  card: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

