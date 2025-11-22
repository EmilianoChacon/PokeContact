import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing contact-Pokemon mappings
const CONTACT_POKEMON_MAP_KEY = '@pokecontact:contactPokemonMap';

export const contactsService = {
  // Request permissions to access contacts
  async requestPermissions() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permissions:', error);
      return false;
    }
  },

  // Obtener todos los contactos del dispositivo
  async getDeviceContacts() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.ID,
        ],
      });

      return data || [];
    } catch (error) {
      console.error('Error obteniendo contactos del dispositivo:', error);
      return [];
    }
  },

  // Crear un nuevo contacto en el dispositivo
  async createDeviceContact(name, phoneNumber) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      // Asegurar que el nombre no esté vacío y no sea el número de teléfono
      const contactName = name && name.trim() && name !== phoneNumber ? name.trim() : 'Unknown Contact';

      // Create contact object - expo-contacts uses simple object structure
      // Use both name and firstName/lastName for better compatibility
      const contact = {
        name: contactName,
        firstName: contactName.split(' ')[0] || contactName,
        lastName: contactName.split(' ').slice(1).join(' ') || '',
        phoneNumbers: [
          {
            label: 'mobile',
            number: phoneNumber,
          },
        ],
      };

      // Agregar contacto al dispositivo - devuelve el ID del contacto
      const result = await Contacts.addContactAsync(contact);
      
      // Devolver el ID del contacto (puede ser una cadena directamente o un objeto con la propiedad id)
      const contactId = typeof result === 'string' ? result : result?.id || result;
      return contactId;
    } catch (error) {
      console.error('Error creando contacto en el dispositivo:', error);
      throw error;
    }
  },

  // Actualizar un contacto existente en el dispositivo
  async updateDeviceContact(contactId, name, phoneNumber) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      // Primero, obtener el contacto del dispositivo para verificar si existe
      // Usar la función getDeviceContacts existente que ya funciona correctamente
      const deviceContacts = await this.getDeviceContacts();

      let deviceContact = deviceContacts?.find(c => c.id === contactId);
      
      // Si no se encuentra por ID, intentar encontrar por número de teléfono como fallback
      if (!deviceContact && phoneNumber) {
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        deviceContact = deviceContacts?.find(c => {
          const contactPhone = c.phoneNumbers?.[0]?.number?.replace(/\D/g, '') || '';
          return contactPhone === phoneDigits || contactPhone.endsWith(phoneDigits) || phoneDigits.endsWith(contactPhone);
        });
      }

      if (!deviceContact) {
        throw new Error(`Contact with ID ${contactId} not found in device`);
      }

      // Asegurar que el nombre no esté vacío y no sea el número de teléfono
      const contactName = name && name.trim() && name !== phoneNumber ? name.trim() : 'Unknown Contact';

      // Construir objeto de actualización - preservar todos los campos existentes y actualizar solo lo necesario
      // Esto es importante para Android que requiere todos los campos presentes
      const contact = {
        id: deviceContact.id, // Usar el ID del contacto del dispositivo
        name: contactName,
        firstName: contactName.split(' ')[0] || contactName,
        lastName: contactName.split(' ').slice(1).join(' ') || '',
        phoneNumbers: [
          {
            label: deviceContact.phoneNumbers?.[0]?.label || 'mobile',
            number: phoneNumber,
          },
        ],
      };

      // Preservar otros campos si existen (solo agregar si tienen valores válidos)
      if (deviceContact.emailAddresses && Array.isArray(deviceContact.emailAddresses) && deviceContact.emailAddresses.length > 0) {
        contact.emailAddresses = deviceContact.emailAddresses;
      }
      if (deviceContact.addresses && Array.isArray(deviceContact.addresses) && deviceContact.addresses.length > 0) {
        contact.addresses = deviceContact.addresses;
      }
      if (deviceContact.organizationName) {
        contact.organizationName = deviceContact.organizationName;
      }
      if (deviceContact.jobTitle) {
        contact.jobTitle = deviceContact.jobTitle;
      }
      if (deviceContact.departmentName) {
        contact.departmentName = deviceContact.departmentName;
      }
      if (deviceContact.note) {
        contact.note = deviceContact.note;
      }

      await Contacts.updateContactAsync(contact);
      return deviceContact.id; // Devolver el ID utilizado
    } catch (error) {
      console.error('Error updating device contact:', error);
      throw error;
    }
  },

  // Eliminar un contacto del dispositivo
  async deleteDeviceContact(contactId) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Contacts permission not granted');
      }

      await Contacts.removeContactAsync(contactId);
      return true;
    } catch (error) {
      console.error('Error deleting device contact:', error);
      throw error;
    }
  },

  // Obtener el mapeo de contacto-Pokémon desde AsyncStorage
  async getContactPokemonMap() {
    try {
      const data = await AsyncStorage.getItem(CONTACT_POKEMON_MAP_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error obteniendo el mapeo de contacto-Pokémon:', error);
      return {};
    }
  },

  // Guardar el mapeo de contacto-Pokémon en AsyncStorage
  async saveContactPokemonMapping(contactId, pokemonData, customStats = null) {
    try {
      const map = await this.getContactPokemonMap();
      map[contactId] = {
        ...pokemonData,
        customStats: customStats || {
          responseTime: pokemonData.stats?.attack || 50,
          confidenceLevel: pokemonData.stats?.defense || 50,
          messageSpeed: pokemonData.stats?.speed || 50,
        },
      };
      await AsyncStorage.setItem(CONTACT_POKEMON_MAP_KEY, JSON.stringify(map));
      return true;
    } catch (error) {
      console.error('Error guardando el mapeo de contacto-Pokémon:', error);
      throw error;
    }
  },

  // Actualizar el mapeo de contacto-Pokémon (para edición)
  async updateContactPokemonMapping(contactId, pokemonData, customStats = null) {
    try {
      return await this.saveContactPokemonMapping(contactId, pokemonData, customStats);
    } catch (error) {
      console.error('Error actualizando el mapeo de contacto-Pokémon:', error);
      throw error;
    }
  },

  // Eliminar contacto del dispositivo y remover el mapeo
  async deleteContactAndMapping(contactId) {
    try {
      // Eliminar del dispositivo
      await this.deleteDeviceContact(contactId);
      // Eliminar el mapeo
      await this.removeContactPokemonMapping(contactId);
      return true;
    } catch (error) {
      console.error('Error eliminando contacto y mapeo:', error);
      throw error;
    }
  },

  // Eliminar múltiples contactos
  async deleteMultipleContacts(contactIds) {
    try {
      const results = await Promise.allSettled(
        contactIds.map(id => this.deleteContactAndMapping(id))
      );
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Algunos contactos fallaron al eliminar:', failed);
      }
      return results;
    } catch (error) {
      console.error('Error eliminando múltiples contactos:', error);
      throw error;
    }
  },

  // Obtener Pokémon para un contacto
  async getPokemonForContact(contactId) {
    try {
      const map = await this.getContactPokemonMap();
      return map[contactId] || null;
    } catch (error) {
      console.error('Error obteniendo Pokémon para el contacto:', error);
      return null;
    }
  },

  // Eliminar el mapeo de contacto-Pokémon
  async removeContactPokemonMapping(contactId) {
    try {
      const map = await this.getContactPokemonMap();
      delete map[contactId];
      await AsyncStorage.setItem(CONTACT_POKEMON_MAP_KEY, JSON.stringify(map));
      return true;
    } catch (error) {
      console.error('Error eliminando el mapeo de contacto-Pokémon:', error);
      throw error;
    }
  },

  // Obtener todos los contactos con su Pokémon asignado
  async getContactsWithPokemon() {
    try {
      const deviceContacts = await this.getDeviceContacts();
      const pokemonMap = await this.getContactPokemonMap();

      return deviceContacts
        .filter(contact => pokemonMap[contact.id])
        .map(contact => {
          const pokemonData = pokemonMap[contact.id];
          const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
          
          // Obtener nombre del contacto - intentar múltiples campos desde expo-contacts
          // Prioridad: name > firstName + lastName > firstName > lastName > 'Unknown'
          let contactName = '';
          if (contact.name && contact.name.trim() && contact.name !== phoneNumber) {
            contactName = contact.name.trim();
          } else if (contact.firstName || contact.lastName) {
            const firstName = contact.firstName || '';
            const lastName = contact.lastName || '';
            contactName = `${firstName} ${lastName}`.trim() || firstName || lastName;
          }
          
          // Si aún no hay nombre y no es el número de teléfono, usar 'Unknown Contact'
          if (!contactName || contactName === phoneNumber) {
            contactName = 'Unknown Contact';
          }
          
          // Usar estadísticas personalizadas si están disponibles, de lo contrario usar estadísticas de Pokémon
          const customStats = pokemonData.customStats;
          const stats = customStats ? {
            attack: customStats.responseTime,
            defense: customStats.confidenceLevel,
            speed: customStats.messageSpeed,
            hp: pokemonData.stats?.hp || 50,
            specialAttack: pokemonData.stats?.specialAttack || 50,
            specialDefense: pokemonData.stats?.specialDefense || 50,
          } : pokemonData.stats;
          
          return {
            ...contact,
            pokemon: {
              ...pokemonData,
              stats: stats,
            },
            // Siempre usar el nombre del contacto determinado (nunca el número de teléfono)
            name: contactName,
            phoneNumber: phoneNumber,
            sprite: pokemonData.sprite,
            types: pokemonData.types,
            stats: stats,
            id: contact.id,
            pokemonId: pokemonData.id,
            pokemonName: pokemonData.name,
            customStats: customStats,
          };
        });
    } catch (error) {
      console.error('Error obteniendo contactos con Pokémon:', error);
      return [];
    }
  },
};

