import React from 'react';

import { View, StyleSheet } from 'react-native';

import { BlurView } from 'expo-blur';

import { LinearGradient } from 'expo-linear-gradient';

import { vidroFor } from '../theme';


// Preenche a tela inteira com o gradiente de fundo da variante ativa.
// É o que dá "cor" pro blur mostrar atrás dos painéis de vidro.
export function FundoGradiente({ variante, escuro = false, style }) {
  const V = vidroFor(variante, escuro);

  return (
    <LinearGradient
      colors={V.gradiente}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        StyleSheet.absoluteFill,
        style,
        { pointerEvents: 'none' },
      ]}
    />
  );
}


// Painel de vidro de verdade.
// Reservado para elementos estruturais que aparecem uma única vez por tela.
export function PainelVidro({
  variante,
  escuro = false,
  style,
  children,
  arredondado = 0,
}) {
  const V = vidroFor(variante, escuro);

  return (
    <View
      style={[
        {
          borderRadius: arredondado,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <BlurView
        intensity={V.intensidadeChrome}
        tint={V.tintBlur}
        experimentalBlurMethod="dimezisBlurView"
        style={[
          StyleSheet.absoluteFill,
          { pointerEvents: 'none' },
        ]}
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: V.overlayChrome,
            pointerEvents: 'none',
          },
        ]}
      />

      <View
        style={{
          borderWidth: 1,
          borderColor: V.bordaCard,
          borderRadius: arredondado,
          flex: 1,
        }}
      >
        {children}
      </View>
    </View>
  );
}


// "Vidro barato":
// mesma leitura visual (translúcido + borda clara)
// sem BlurView de verdade.
export function estiloVidroSimulado(
  variante,
  escuro = false
) {
  const V = vidroFor(variante, escuro);

  return {
    backgroundColor: V.overlayCard,
    borderWidth: 1,
    borderColor: V.bordaCard,
  };
}