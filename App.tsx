import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CreateWalletScreen } from './src/screens/CreateWalletScreen';
// import { SendScreen } from './src/screens/SendScreen';
// import { ReceiveScreen } from './src/screens/ReceiveScreen';
// import { SwapScreen } from './src/screens/SwapScreen';
// import { TransactionHistoryScreen } from './src/screens/TransactionHistoryScreen';
// import { WalletDetailScreen } from './src/screens/WalletDetailScreen';
import { authService } from './src/services/authService';
import { COLORS } from './src/constants/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator with proper screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundSecondary,
          borderTopColor: COLORS.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize auth service to check for existing session
      await authService.initialize();
      const authState = authService.getAuthState();
      setIsAuthenticated(authState.isAuthenticated);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Listen for logout events from other components
  useEffect(() => {
    const checkAuthStatus = () => {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated && isAuthenticated) {
        setIsAuthenticated(false);
      }
    };

    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>Loading CryptoWallet...</Text>
        <Text style={{ color: '#CCCCCC', fontSize: 16, marginTop: 10 }}>Please wait...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={handleLoginSuccess}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => (
                <RegisterScreen
                  {...props}
                  onRegisterSuccess={handleLoginSuccess}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          // Main app screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
            {/* Temporarily commented out until screen imports are fixed
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Receive" component={ReceiveScreen} />
            <Stack.Screen name="WalletDetail" component={WalletDetailScreen} />
            */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
