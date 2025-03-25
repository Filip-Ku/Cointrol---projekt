import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';

const SplashScreen = () => {
  // Declare the animated values for opacity
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    // Fade-in animation when the component is mounted
    Animated.timing(fadeAnim, {
      toValue: 1, // End value of opacity
      duration: 2000, // Duration of the animation in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image source={require('../assets/money_bag.png')} style={styles.image} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>Cointrol</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        Your financial journey starts here
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  imageContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: 150,
    height: 150,
  },
  title: {
    color: '#F5F5F5',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#D3D3D3',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SplashScreen;
