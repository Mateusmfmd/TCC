import React from 'react';
import { View, StyleSheet } from 'react-native';
import { vidroFor } from '../theme';

export function FundoGradienteMaster({ variante, escuro = false, style }) {
  const V = vidroFor(variante, escuro);
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: V.gradiente?.[0] }, style]} pointerEvents="none" />;
}

export function PainelVidroMaster({ variante, escuro = false, style, children, arredondado = 0 }) {
  const V = vidroFor(variante, escuro);
  return (
    <View style={[{ borderRadius: arredondado, overflow: 'hidden', elevation: 2 }, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: V.overlayChrome }]} pointerEvents="none" />
      <View style={{ borderWidth: 1, borderColor: V.bordaCard, borderRadius: arredondado, flex: 1 }}>
        {children}
      </View>
    </View>
  );
}
