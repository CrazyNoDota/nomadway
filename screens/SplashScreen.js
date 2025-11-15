import React from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

export default function SplashScreen() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image 
          source={{ uri: 'https://raw.githubusercontent.com/CrazyNoDota/danik/21bad4af7ac400b27c470851e9968c5860b06407/photo_2025-11-15_23-14-57-removebg-preview.png' }}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logo}>NomadWay</Text>
        <Text style={styles.tagline}>Почувствуй дух степи</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4d3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 20,
    color: '#fff',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});

