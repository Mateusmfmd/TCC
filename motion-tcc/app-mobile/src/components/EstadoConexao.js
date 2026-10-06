import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize, fontesFor } from '../theme';

const FK = fontesFor('crianca');

// Estado amigável mostrado no Modo Criança quando uma lista (categorias,
// pictogramas, rotina, favoritos) falha ao carregar por causa da rede — em
// vez de deixar a tela em branco (o que pra uma criança não-verbal significa
// "o app não tem nada pra eu falar", um problema sério), mostra algo simples
// de entender com um botão grande pra tentar de novo.
export default function EstadoConexao({ C, onTentarNovamente }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: normalize(32) }}>
      <View style={{ width: normalize(84), height: normalize(84), borderRadius: normalize(42), backgroundColor: C.cinza, alignItems: 'center', justifyContent: 'center', marginBottom: normalize(20) }}>
        <Ionicons name="cloud-offline-outline" size={normalize(40)} color={C.subtexto} />
      </View>
      <Text style={{ fontSize: normalize(18), fontFamily: FK.display, color: C.texto, textAlign: 'center', marginBottom: normalize(8) }}>
        Não consegui carregar
      </Text>
      <Text style={{ fontSize: normalize(13), fontFamily: FK.body, color: C.subtexto, textAlign: 'center', marginBottom: normalize(24) }}>
        Confira se a internet está funcionando
      </Text>
      <TouchableOpacity
        onPress={onTentarNovamente}
        style={{ backgroundColor: C.secundaria, borderRadius: normalize(20), paddingVertical: normalize(14), paddingHorizontal: normalize(28), flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}
      >
        <Ionicons name="refresh" size={normalize(18)} color="#FFF" />
        <Text style={{ color: '#FFF', fontFamily: FK.displaySemi, fontSize: normalize(15) }}>Tentar de novo</Text>
      </TouchableOpacity>
    </View>
  );
}
