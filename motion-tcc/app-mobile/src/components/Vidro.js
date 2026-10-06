import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { vidroFor } from '../theme';

export function FundoGradiente({ variante, escuro = false, style }) {
  const V = vidroFor(variante, escuro);
  return (
    <LinearGradient
      colors={V.gradiente}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  );
}

export function PainelVidro({ variante, escuro = false, style, children, arredondado = 0 }) {
  const V = vidroFor(variante, escuro);
  return (
    <View style={[{ borderRadius: arredondado, overflow: 'hidden' }, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: V.overlayChrome }]} pointerEvents="none" />
      <View style={{ borderWidth: 1, borderColor: V.bordaCard, borderRadius: arredondado, flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

export function estiloVidroSimulado(variante, escuro = false) {
  const V = vidroFor(variante, escuro);
  return { backgroundColor: V.overlayCard, borderWidth: 1, borderColor: V.bordaCard };
}
