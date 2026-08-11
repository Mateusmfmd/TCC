import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';

// Banner de erro no topo do formulário — mostra a mensagem real vinda do
// servidor (ex: "Já existe uma conta com este e-mail") em vez de um Alert
// que desaparece assim que o usuário toca em OK.
export default function BannerErro({ mensagem, C, variante, onFechar }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  if (!mensagem) return null;
  return (
    <View style={s.bannerErro}>
      <Ionicons name="alert-circle" size={18} color="#9B2C2C" style={{ marginRight: 8, marginTop: 1 }} />
      <Text style={s.bannerErroTxt}>{mensagem}</Text>
      {onFechar && (
        <TouchableOpacity onPress={onFechar} style={{ paddingLeft: 8 }}>
          <Ionicons name="close" size={18} color="#9B2C2C" />
        </TouchableOpacity>
      )}
    </View>
  );
}
