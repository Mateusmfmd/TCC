import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { criarEstilos } from '../estilos';

// Banner de erro no topo do formulário — mostra a mensagem real vinda do
// servidor (ex: "Já existe uma conta com este e-mail") em vez de um Alert
// que desaparece assim que o usuário toca em OK.
export default function BannerErro({ mensagem, C, variante, onFechar, acaoTexto, onAcao }) {
  const s = useMemo(() => criarEstilos(C, variante), [C, variante]);
  if (!mensagem) return null;
  return (
    <View style={s.bannerErro}>
      <Ionicons name="alert-circle" size={18} color="#9B2C2C" style={{ marginRight: 8, marginTop: 1 }} />
      <Text style={[s.bannerErroTxt, acaoTexto ? { flex: 1 } : null]}>{mensagem}</Text>
      {acaoTexto && onAcao && (
        <TouchableOpacity onPress={onAcao} style={{ marginLeft: 8, alignSelf: 'center' }}>
          <Text style={{ color: '#9B2C2C', fontWeight: '700', fontSize: 13 }}>{acaoTexto}</Text>
        </TouchableOpacity>
      )}
      {onFechar && (
        <TouchableOpacity onPress={onFechar} style={{ paddingLeft: acaoTexto ? 0 : 8 }}>
          <Ionicons name="close" size={18} color="#9B2C2C" />
        </TouchableOpacity>
      )}
    </View>
  );
}
