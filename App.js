import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import CommunityScreen from './screens/CommunityFeedScreen';
import ProfileScreen from './screens/ProfileScreen';
import AttractionDetailsScreen from './screens/AttractionDetailsScreen';
import RouteDetailsScreen from './screens/RouteDetailsScreen';
import MapScreen from './screens/MapScreen';
import TravelerToolsScreen from './screens/TravelerToolsScreen';
import AIGuideScreen from './screens/AIGuideScreen';
import RegionalGuideScreen from './screens/RegionalGuideScreen';
import PersonalizedRouteScreen from './screens/PersonalizedRouteScreen';
import AIRouteBuilderScreen from './screens/AIRouteBuilderScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import CartScreen from './screens/CartScreen';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './screens/AuthScreen';
import { navigationRef } from './utils/navigationRef';
import analyticsService from './utils/AnalyticsService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tours') {
            iconName = focused ? 'airplane' : 'airplane-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AIChat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: isDark ? '#333' : '#2d6a4f',
        },
      })}
    >
      <Tab.Screen
        name="Tours"
        component={ExploreScreen}
        options={{ title: t('tours') || 'Туры' }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ title: t('community') }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIGuideScreen}
        options={{
          title: t('aiChat'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: t('cart') || 'Корзина' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('profile') }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocalization();
  const { colors, isDark } = useTheme();
  const routeNameRef = useRef();

  useEffect(() => {
    // Initialize analytics service
    analyticsService.initialize();
    
    // Simulate splash screen delay
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  // Handle navigation state change for screen tracking
  const onNavigationStateChange = (state) => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = analyticsService.getActiveRouteName(state);

    if (previousRouteName !== currentRouteName && currentRouteName) {
      // Track screen view
      analyticsService.logScreenView(currentRouteName);
    }

    // Save the current route name for later comparison
    routeNameRef.current = currentRouteName;
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        // Track the initial screen
        const initialRouteName = analyticsService.getActiveRouteName(navigationRef.current?.getRootState());
        routeNameRef.current = initialRouteName;
        if (initialRouteName) {
          analyticsService.logScreenView(initialRouteName);
        }
      }}
      onStateChange={onNavigationStateChange}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.headerText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AttractionDetails"
          component={AttractionDetailsScreen}
          options={{ title: t('nav_details') }}
        />
        <Stack.Screen
          name="RouteDetails"
          component={RouteDetailsScreen}
          options={{ title: t('nav_route') }}
        />
        <Stack.Screen
          name="MapScreen"
          component={MapScreen}
          options={{ title: t('nav_map') }}
        />
        <Stack.Screen
          name="TravelerTools"
          component={TravelerToolsScreen}
          options={{ title: t('nav_tools') }}
        />
        <Stack.Screen
          name="AIGuide"
          component={AIGuideScreen}
          options={{ title: t('nav_aiGuide') }}
        />
        <Stack.Screen
          name="RegionalGuide"
          component={RegionalGuideScreen}
          options={{ title: t('nav_regionalGuide') }}
        />
        <Stack.Screen
          name="PersonalizedRoute"
          component={PersonalizedRouteScreen}
          options={{ title: t('nav_personalizedRoute') }}
        />
        <Stack.Screen
          name="AIRouteBuilder"
          component={AIRouteBuilderScreen}
          options={{ title: t('nav_aiConstructor') }}
        />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ title: t('nav_achievements') }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: t('nav_leaderboard') }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('nav_settings') }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: t('nav_cart') || 'Корзина' }}
        />
        <Stack.Screen
          name="PostDetails"
          component={require('./screens/PostDetailsScreen').default}
          options={{ title: t('nav_postDetails') || 'Post' }}
        />
        <Stack.Screen
          name="CreatePost"
          component={require('./screens/CreatePostScreen').default}
          options={{ title: t('nav_createPost') || 'Create Post' }}
        />
        <Stack.Screen
          name="CommunityProfile"
          component={require('./screens/CommunityProfileScreen').default}
          options={{ title: t('nav_profile') || 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LocalizationProvider>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <RootNavigator />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

