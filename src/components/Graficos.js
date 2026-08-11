import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { normalize, fontesFor } from '../theme';
import { criarEstilos } from '../estilos';

// Uma barra individual que cresce ao montar — usa o `Animated` embutido do
// React Native (sem dependência nativa nova).
function BarraHorizontalAnimada({ percentual, atraso, style }) {
  const progresso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progresso, { toValue: percentual, duration: 500, delay: atraso, useNativeDriver: false }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentual]);
  return <Animated.View style={[style, { width: progresso.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }) }]} />;
}

function BarraVerticalAnimada({ altura, atraso, style }) {
  const progresso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progresso, { toValue: altura, delay: atraso, useNativeDriver: false, speed: 14, bounciness: 6 }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [altura]);
  return <Animated.View style={[style, { height: progresso }]} />;
}

// Gráfico de barras horizontais simples — usado para "pictogramas mais usados".
// As barras crescem da esquerda pra direita ao montar a tela, em vez de
// aparecer com o tamanho final de uma vez.
export function GraficoBarrasHorizontais({ dados, chaveLabel, chaveValor, C, variante = 'adulto' }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  const F = fontesFor(variante);
  const max = Math.max(1, ...dados.map((d) => Number(d[chaveValor]) || 0));
  return (
    <View>
      {dados.map((item, i) => (
        <View key={i} style={s.barraLinha}>
          <Text style={{ width: normalize(90), color: C.texto, fontSize: normalize(13), fontFamily: F.bodyBold }} numberOfLines={1}>
            {item.emoji ? `${item.emoji} ` : ''}{item[chaveLabel]}
          </Text>
          <View style={s.barraFundo}>
            <BarraHorizontalAnimada
              percentual={(Number(item[chaveValor]) / max) * 100}
              atraso={i * 60}
              style={s.barraPreenchida}
            />
          </View>
          <Text style={{ width: normalize(28), textAlign: 'right', color: C.subtexto, fontFamily: F.bodyBold }}>{item[chaveValor]}</Text>
        </View>
      ))}
      {dados.length === 0 && <Text style={s.vazio}>Sem dados neste período ainda 📊</Text>}
    </View>
  );
}

// Gráfico de barras verticais simples — usado para "falas por dia".
export function GraficoBarrasVerticais({ dados, chaveLabel, chaveValor, C, variante = 'adulto' }) {
  const F = fontesFor(variante);
  const max = Math.max(1, ...dados.map((d) => Number(d[chaveValor]) || 0));
  const alturaMax = normalize(110);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: dados.length > 6 ? 'flex-start' : 'space-between', height: alturaMax + normalize(30), gap: normalize(10) }}>
      {dados.map((item, i) => {
        const altura = Math.max(normalize(4), (Number(item[chaveValor]) / max) * alturaMax);
        return (
          <View key={i} style={{ alignItems: 'center', width: normalize(28) }}>
            <Text style={{ fontSize: normalize(11), color: C.texto, fontFamily: F.bodyBold, marginBottom: 2 }}>{item[chaveValor]}</Text>
            <BarraVerticalAnimada
              altura={altura}
              atraso={i * 60}
              style={{ width: normalize(18), backgroundColor: C.secundaria, borderRadius: normalize(6) }}
            />
            <Text style={{ fontSize: normalize(10), color: C.subtexto, fontFamily: F.body, marginTop: 4 }}>{item[chaveLabel]}</Text>
          </View>
        );
      })}
      {dados.length === 0 && <Text style={{ color: C.subtexto, fontFamily: F.body }}>Sem dados neste período ainda 📊</Text>}
    </View>
  );
}
