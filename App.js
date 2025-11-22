import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import AddContactScreen from './screens/AddContactScreen';
import ContactDetailScreen from './screens/ContactDetailScreen';
import TradeScreen from './screens/TradeScreen';
import { colors } from './theme';
import { soundService } from './services/soundService';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Inicializar y cargar todos los sonidos
    soundService.loadAllSounds().then(() => {
      // Iniciar la música de fondo
      soundService.playBackgroundMusic();
    });

    // Limpiar al desmontar la pantalla
    return () => {
      soundService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: colors.black },
            animationEnabled: true,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddContact" component={AddContactScreen} />
          <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
          <Stack.Screen name="Trade" component={TradeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

