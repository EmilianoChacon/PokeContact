import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const POKEMON_LIST_URL = 'https://pokeapi.co/api/v2/pokemon?limit=10000'; // Obtener todos los Pokémon

// Cache para datos de Pokémon
const pokemonCache = {};
const typeCache = {};

// Cache de lista de Pokémon estática - cargada una vez y almacenada en memoria
let staticPokemonList = null;
let isLoadingList = false;

// Gráfico de efectividad de tipos
const typeEffectiveness = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Capitalizar nombre de Pokémon (primera letra mayúscula)
const capitalizePokemonName = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Transformar datos de Pokémon desde la respuesta de la API
const transformPokemonData = (data) => {
  return {
    id: data.id,
    name: capitalizePokemonName(data.name),
    sprite: data.sprites?.front_default || data.sprites?.other?.['official-artwork']?.front_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png',
    types: data.types?.map(type => type.type.name) || [],
    stats: {
      hp: data.stats?.find(stat => stat.stat.name === 'hp')?.base_stat || 50,
      attack: data.stats?.find(stat => stat.stat.name === 'attack')?.base_stat || 50,
      defense: data.stats?.find(stat => stat.stat.name === 'defense')?.base_stat || 50,
      speed: data.stats?.find(stat => stat.stat.name === 'speed')?.base_stat || 50,
      specialAttack: data.stats?.find(stat => stat.stat.name === 'special-attack')?.base_stat || 50,
      specialDefense: data.stats?.find(stat => stat.stat.name === 'special-defense')?.base_stat || 50,
    },
  };
};

// Obtener Pokémon por nombre o ID
export const pokeApi = {
  async getPokemon(nameOrId) {
    try {
      const key = nameOrId.toString().toLowerCase();
      
      // Verificar cache primero
      if (pokemonCache[key]) {
        return pokemonCache[key];
      }

      // Obtener desde la API
      const response = await axios.get(`${BASE_URL}/${key}`);
      const transformed = transformPokemonData(response.data);
      
      // Cachear el resultado
      pokemonCache[key] = transformed;
      
      return transformed;
    } catch (error) {
      console.error('Error obteniendo Pokémon:', error);
      throw new Error(`Failed to fetch Pokemon: ${nameOrId}`);
    }
  },

  // Obtener Pokémon aleatorio (1-1025)
  async getRandomPokemon() {
    try {
      const randomId = Math.floor(Math.random() * 1025) + 1;
      return await this.getPokemon(randomId);
    } catch (error) {
      console.error('Error obteniendo Pokémon aleatorio:', error);
      throw new Error('Failed to fetch random Pokemon');
    }
  },

  // Obtener lista de todos los Pokémon (nombres y IDs solo) - cacheada en memoria
  async getAllPokemonList() {
    // Devolver lista cacheada si está disponible
    if (staticPokemonList) {
      return staticPokemonList;
    }

    // Si ya se está cargando, esperar un poco y devolver la lista cacheada si está disponible
    if (isLoadingList) {
      // Esperar hasta 5 segundos para que la lista se cargue
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (staticPokemonList) {
          return staticPokemonList;
        }
      }
      return [];
    }

    // Cargar la lista una vez
    isLoadingList = true;
    try {
      const response = await axios.get(POKEMON_LIST_URL);
      staticPokemonList = response.data.results.map((pokemon) => {
        // Extraer ID de la URL (por ejemplo, "https://pokeapi.co/api/v2/pokemon/25/" -> 25)
        const urlParts = pokemon.url.split('/');
        const id = parseInt(urlParts[urlParts.length - 2]) || 0;
        return {
          name: capitalizePokemonName(pokemon.name),
          id: id,
          url: pokemon.url,
        };
      });
      isLoadingList = false;
      return staticPokemonList;
    } catch (error) {
      console.error('Error obteniendo lista de Pokémon:', error);
      isLoadingList = false;
      return [];
    }
  },

  // Buscar Pokémon por nombre o número - filtra desde la lista cacheada estática
  async searchPokemon(query) {
    try {
      const searchQuery = query.toLowerCase().trim();
      if (!searchQuery) return [];
      
      // Si es un número, devolver ese Pokémon específico desde la lista cacheada
      if (!isNaN(searchQuery)) {
        const num = parseInt(searchQuery);
        if (num >= 1 && num <= 1025) {
          // Obtener la lista cacheada primero
          const allPokemon = await this.getAllPokemonList();
          const found = allPokemon.find(p => p.id === num);
          return found ? [found] : [];
        }
        return [];
      }

      // Para búsqueda de texto, filtrar desde la lista cacheada estática (mucho más rápido!)
      const allPokemon = await this.getAllPokemonList();
      
      const filtered = allPokemon.filter(pokemon => 
        pokemon.name.toLowerCase().includes(searchQuery) ||
        pokemon.id.toString().includes(searchQuery)
      );

      // Limitar a 50 resultados para mejor rendimiento
      return filtered.slice(0, 50);
    } catch (error) {
      console.error('Error buscando Pokémon:', error);
      return [];
    }
  },

  // Obtener efectividad de tipo entre dos tipos
  getTypeEffectiveness(type1, type2) {
    const type1Lower = type1.toLowerCase();
    const type2Lower = type2.toLowerCase();

    if (!typeEffectiveness[type1Lower] || !typeEffectiveness[type1Lower][type2Lower]) {
      return 100; // Efectividad neutral
    }

    const effectiveness = typeEffectiveness[type1Lower][type2Lower];
    
    // Convertir a porcentaje (0.5 = 50%, 2 = 200%, etc.)
    return Math.round(effectiveness * 100);
  },

  // Calcular compatibilidad entre dos contactos basándose en sus tipos de Pokémon
  calculateCompatibility(contact1, contact2) {
    if (!contact1 || !contact2) return null;

    // Obtener datos de Pokémon de cada contacto
    const pokemon1 = contact1.pokemon || contact1;
    const pokemon2 = contact2.pokemon || contact2;

    // Obtener tipos de cada Pokémon
    const types1 = pokemon1.types || contact1.types || ['normal'];
    const types2 = pokemon2.types || contact2.types || ['normal'];

    // Calcular efectividades bidireccionales
    let totalEffectiveness = 0;
    let count = 0;

    // Para cada tipo del primer Pokémon contra cada tipo del segundo
    types1.forEach(type1 => {
      types2.forEach(type2 => {
        const effectiveness1 = this.getTypeEffectiveness(type1, type2);
        const effectiveness2 = this.getTypeEffectiveness(type2, type1);
        
        // Promediar ambas direcciones para obtener compatibilidad mutua
        const avgEffectiveness = (effectiveness1 + effectiveness2) / 2;
        totalEffectiveness += avgEffectiveness;
        count++;
      });
    });

    if (count === 0) return null;

    // Calcular promedio de compatibilidad
    const compatibility = totalEffectiveness / count;

    // Normalizar a un rango de 0-100 donde:
    // - 100% efectividad = neutral (50% compatibilidad)
    // - >100% efectividad = más compatible (hasta 100%)
    // - <100% efectividad = menos compatible (hasta 0%)
    // La idea es que si ambos tipos son super efectivos entre sí, tienen alta compatibilidad
    let compatibilityPercent;
    
    if (compatibility >= 100) {
      // Compatible: neutral o super efectivo
      // Mapear 100-200% efectividad a 50-100% compatibilidad
      const excess = compatibility - 100;
      compatibilityPercent = 50 + Math.min(50, (excess / 100) * 50);
    } else {
      // Menos compatible: no muy efectivo
      // Mapear 0-100% efectividad a 0-50% compatibilidad
      compatibilityPercent = (compatibility / 100) * 50;
    }

    return Math.round(Math.max(0, Math.min(100, compatibilityPercent)));
  },

  // Limpiar cache
  clearCache() {
    Object.keys(pokemonCache).forEach(key => delete pokemonCache[key]);
    Object.keys(typeCache).forEach(key => delete typeCache[key]);
  },
};
