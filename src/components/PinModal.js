import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize, fontesFor, corContraste } from '../theme';
import { criarEstilos } from '../estilos';
import EntradaModal from './EntradaModal';

const FK = fontesFor('crianca');

// Teclado numérico simples para confirmar o PIN de saída do modo Criança.
// Não usa TextInput de propósito: em telas de acessibilidade, um teclado
// grande e visual é mais confiável do que o teclado do sistema.
export default function PinModal({ visivel, pinCorreto, onConfirmar, onCancelar, C, semVidro = false, escuro = false }) {
  const s = useMemo(() => criarEstilos(C, 'crianca', { semVidro, escuro }), [C, semVidro, escuro]);
  const [digitado, setDigitado] = useState('');
  const [erro, setErro] = useState(false);

  const digitos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];

  const apertar = (d) => {
    setErro(false);
    if (d === '⌫') { setDigitado((p) => p.slice(0, -1)); return; }
    if (d === 'OK') {
      if (digitado === String(pinCorreto)) {
        setDigitado('');
        onConfirmar();
      } else {
        setErro(true);
        setDigitado('');
      }
      return;
    }
    if (digitado.length < 8) setDigitado((p) => p + d);
  };

  return (
    <Modal visible={visivel} transparent animationType="none" onRequestClose={onCancelar}>
      <View style={s.modalFundo}>
        <EntradaModal visivel={visivel} style={[s.modalCard, { alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginBottom: normalize(10) }}>
            <Ionicons name="lock-closed" size={normalize(19)} color={C.texto} />
            <Text style={{ fontSize: normalize(19), fontFamily: FK.display, color: C.texto }}>
              Digite o PIN para sair
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: normalize(10), marginVertical: normalize(16) }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: normalize(22), height: normalize(22), borderRadius: normalize(11),
                  backgroundColor: digitado.length > i ? C.secundaria : C.cinza,
                  borderWidth: 2, borderColor: erro ? C.erro : C.cinzaMedio,
                }}
              />
            ))}
          </View>
          {erro && <Text style={{ color: C.erro, fontFamily: FK.bodyBold, marginBottom: 10 }}>PIN incorreto, tente de novo</Text>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: normalize(230), justifyContent: 'center' }}>
            {digitos.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => apertar(d)}
                style={{
                  width: normalize(70), height: normalize(56), margin: normalize(4), borderRadius: normalize(14),
                  backgroundColor: d === 'OK' ? C.sucesso : C.cinza, alignItems: 'center', justifyContent: 'center',
                }}
              >
                {d === '⌫' ? (
                  <Ionicons name="backspace-outline" size={normalize(20)} color={C.texto} />
                ) : (
                  <Text style={{ fontSize: normalize(20), fontFamily: FK.display, color: d === 'OK' ? corContraste(C) : C.texto }}>{d}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onCancelar} style={{ marginTop: normalize(12) }}>
            <Text style={{ color: C.subtexto, fontFamily: FK.bodyBold }}>Cancelar</Text>
          </TouchableOpacity>
        </EntradaModal>
      </View>
    </Modal>
  );
}
