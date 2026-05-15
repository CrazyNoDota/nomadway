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
        <View style={styles.logoCard}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
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
  logoCard: {
    width: 178,
    height: 178,
    borderRadius: 34,
    backgroundColor: '#f7f2df',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  logoImage: {
    width: 152,
    height: 152,
    borderRadius: 24,
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
