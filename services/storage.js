import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = '@pokecontact:contacts';

export const storage = {
  // Obtener todos los contactos
  async getContacts() {
    try {
      const data = await AsyncStorage.getItem(CONTACTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error obteniendo contactos:', error);
      return [];
    }
  },

  // Guardar un contacto
  async saveContact(contact) {
    try {
      const contacts = await storage.getContacts();
      const newContact = {
        ...contact,
        id: contact.id || Date.now().toString(),
        createdAt: contact.createdAt || new Date().toISOString(),
      };
      contacts.push(newContact);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
      return newContact;
    } catch (error) {
      console.error('Error guardando contacto:', error);
      throw error;
    }
  },

  // Actualizar un contacto
  async updateContact(contactId, updates) {
    try {
      const contacts = await storage.getContacts();
      const index = contacts.findIndex(c => c.id === contactId);
      if (index !== -1) {
        contacts[index] = { ...contacts[index], ...updates };
        await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
        return contacts[index];
      }
      return null;
    } catch (error) {
      console.error('Error actualizando contacto:', error);
      throw error;
    }
  },

  // Eliminar un contacto
  async deleteContact(contactId) {
    try {
      const contacts = await storage.getContacts();
      const filtered = contacts.filter(c => c.id !== contactId);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error eliminando contacto:', error);
      return false;
    }
  },

  // Obtener un contacto
  async getContact(contactId) {
    try {
      const contacts = await storage.getContacts();
      return contacts.find(c => c.id === contactId);
    } catch (error) {
      console.error('Error obteniendo contacto:', error);
      return null;
    }
  },
};

