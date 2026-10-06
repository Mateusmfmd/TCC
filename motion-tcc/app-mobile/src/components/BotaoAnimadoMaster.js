import React, { useRef } from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';

/**
 * BotaoAnimadoMaster: Componente de botão altamente polido com micro-interações de mola,
 * suporte cross-platform seguro para animações nativas e tratamento de loading.
 */
export default function BotaoAnimadoMaster({
  onPress,
  loading = false,
  disabled = false,
  style,
  children,
  activeScale = 0.96,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: activeScale,
      useNativeDriver: Platform.OS !== 'web',
      friction: 5,
      tension: 50,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 4,
      tension: 40,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={!disabled && !loading ? onPress : undefined}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.6 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          children
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
