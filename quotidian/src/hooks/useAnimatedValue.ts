import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * One Animated.Value for the life of the component. React Native has a
 * built-in hook for this, but react-native-web does not export it.
 */
export function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}
