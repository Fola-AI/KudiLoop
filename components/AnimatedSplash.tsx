import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const rotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in logo
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });

    // Spin the logo continuously
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Fade in text (stays static in center)
    textOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    
    // Fade in tagline
    taglineOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

    // Finish splash after animation
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Logo Container - holds both spinning arrows and static text */}
      <View style={styles.logoWrapper}>
        {/* Spinning Arrows */}
        <Animated.Image
          source={require('../assets/icon.png')}
          style={[styles.logo, logoAnimatedStyle]}
          resizeMode="contain"
        />
        
        {/* Static Text - centered inside the arrows */}
        <Animated.View style={[styles.textOverlay, textAnimatedStyle]}>
          <Text style={styles.kudiText}>Kudi</Text>
          <Text style={styles.loopText}>Loop</Text>
        </Animated.View>
      </View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineAnimatedStyle]}>
        Save Together, Succeed Together
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    position: 'absolute',
  },
  textOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Text stays in center, does NOT rotate
  },
  kudiText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loopText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  tagline: {
    marginTop: 32,
    fontSize: 16,
    color: '#9CA3AF',
  },
});
