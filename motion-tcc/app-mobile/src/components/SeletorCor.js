import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { normalize, fontesFor } from '../theme';
import Campo from './Campo';

const HEX_VALIDO = /^#([0-9A-Fa-f]{6})$/;

// Seletor de cor usado tanto no Editor de conteúdo (cor da categoria) quanto
// em Ajustes (cores do Modo Criança): uma paleta de atalhos + um campo de
// código hex para o responsável poder escolher literalmente qualquer cor,
// não só as pré-definidas.
export default function SeletorCor({ label, valor, onMudar, paleta, C, variante }) {
  const F = fontesFor(variante);
  return (
    <View style={{ marginBottom: normalize(15) }}>
      {label ? <Text style={{ fontSize: normalize(11), fontFamily: F.bodyBold, color: C.subtexto, marginBottom: normalize(8) }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(10) }}>
        {paleta.map((cx) => (
          <TouchableOpacity
            key={cx}
            onPress={() => onMudar(cx)}
            style={{
              width: normalize(34), height: normalize(34), borderRadius: normalize(9), backgroundColor: cx,
              margin: normalize(4), borderWidth: valor?.toUpperCase() === cx.toUpperCase() ? 3 : 0, borderColor: C.primaria,
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: normalize(11), fontFamily: F.bodySemi, color: C.subtexto, marginBottom: normalize(6) }}>Ou qualquer cor (código hex)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
        <View style={{
          width: normalize(38), height: normalize(38), borderRadius: normalize(9),
          backgroundColor: HEX_VALIDO.test(valor || '') ? valor : C.cinza,
          borderWidth: 1, borderColor: C.borda || C.cinzaMedio,
        }} />
        <Campo
          C={C} variante={variante} style={{ flex: 1, textAlign: 'center', letterSpacing: 1 }}
          value={valor || ''} onChangeText={(t) => {
            let v = t.trim();
            if (v && !v.startsWith('#')) v = '#' + v;
            onMudar(v.slice(0, 7));
          }}
          placeholder="#RRGGBB" autoCapitalize="characters" maxLength={7}
        />
      </View>
      {!!valor && !HEX_VALIDO.test(valor) && (
        <Text style={{ color: C.erro, fontFamily: F.bodyBold, fontSize: normalize(12), marginTop: normalize(6) }}>⚠ Código inválido — use o formato #RRGGBB</Text>
      )}
    </View>
  );
}
