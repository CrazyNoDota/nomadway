import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import RoutesScreen from './screens/RoutesScreen';
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
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { t } = useLocalization();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AIChat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: '#8e8e93',
        headerStyle: {
          backgroundColor: '#1a4d3a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#1a4d3a',
          borderTopColor: '#2d6a4f',
        },
      })}
    >
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{ title: t('explore') }}
      />
      <Tab.Screen 
        name="Routes" 
        component={RoutesScreen}
        options={{ title: t('routes') }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{ title: t('community') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: t('profile') }}
      />
      <Tab.Screen 
        name="AIChat" 
        component={AIGuideScreen}
        options={{ 
          title: t('aiChat'),
          headerShown: false, // Hide default header since AIGuideScreen has custom header
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocalization();

  useEffect(() => {
    // Simulate splash screen delay
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a4d3a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={TabNavigator}
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
      <RootNavigator />
    </LocalizationProvider>
  );
}

