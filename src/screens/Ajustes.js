import React, { useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize, TEMA_RESPONSAVEL, CORES_TEMA_CRIANCA, fontesFor } from '../theme';
import { criarEstilos } from '../estilos';
import { TopBar, BotaoVoltar } from '../components/TopBar';
import Interruptor from '../components/Interruptor';
import Campo from '../components/Campo';
import SeletorCor from '../components/SeletorCor';
import BannerErro from '../components/BannerErro';
import BotaoAnimado from '../components/BotaoAnimado';
import { Criancas, mensagemErro } from '../api';
import { useApp } from '../AppContext';
import { falarTexto } from '../speech';

const C = TEMA_RESPONSAVEL;
const V = 'adulto';
const F = fontesFor(V);

// Chip com "pop" de mola — reaplicado aqui porque esta tela é praticamente
// só grupos de chips (voz, velocidade, volume, tamanho, tema, tempo de
// resposta, varredura); sem feedback de toque próprio, tudo pareceria uma
// lista de rádio buttons de formulário HTML.
function ChipToque({ selecionado, onPress, children, s }) {
  const escala = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(escala, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 10 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.9} style={[s.chip, selecionado && s.chipAtivo]}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function LinhaOpcoes({ label, opcoes, valor, onSelecionar, s }) {
  return (
    <View style={{ marginBottom: normalize(16) }}>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {opcoes.map((o) => (
          <ChipToque key={o.valor} s={s} selecionado={valor === o.valor} onPress={() => onSelecionar(o.valor)}>
            <Text style={[s.chipTxt, valor === o.valor && s.chipTxtAtivo]}>{o.label}</Text>
          </ChipToque>
        ))}
      </View>
    </View>
  );
}

// Cabeçalho de seção com ícone num círculo colorido — transforma o texto
// solto de "eyebrow" numa marcação visual mais forte pra separar os blocos
// de configuração (voz, aparência, acessibilidade, saída) de verdade.
function Secao({ icone, titulo, children }) {
  return (
    <View style={{ marginBottom: normalize(22) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginBottom: normalize(14) }}>
        <View style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(10), backgroundColor: `${C.primaria}1F`, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icone} size={normalize(15)} color={C.primaria} />
        </View>
        <Text style={{ fontSize: normalize(14), fontFamily: F.bodyBold, color: C.texto }}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

export function TelaAjustesCrianca({ crianca, onVoltar }) {
  const s = useMemo(() => criarEstilos(C, V), []);
  const { usuario, atualizarCriancaAtivaLocal } = useApp();
  const [config, setConfig] = useState({ ...crianca });
  const [salvando, setSalvando] = useState(false);
  const [pin, setPin] = useState(crianca.pin_saida || '');
  const [erroPin, setErroPin] = useState(null);
  const [erroServidor, setErroServidor] = useState(null);

  const atualizarCampo = (campo, valor) => setConfig((p) => ({ ...p, [campo]: valor }));

  const HEX_VALIDO = /^#([0-9A-Fa-f]{6})$/;

  const salvar = async () => {
    setErroServidor(null);
    if (!/^\d{4,8}$/.test(pin)) { setErroPin('O PIN deve ter de 4 a 8 números'); return; }
    if (config.cor_primaria && !HEX_VALIDO.test(config.cor_primaria)) { setErroServidor('Cor principal inválida — use o formato #RRGGBB'); return; }
    if (config.cor_destaque && !HEX_VALIDO.test(config.cor_destaque)) { setErroServidor('Cor de destaque inválida — use o formato #RRGGBB'); return; }
    setSalvando(true);
    try {
      const payload = {
        id_crianca: crianca.id_crianca,
        usuario_id: usuario.id_usuario,
        tamanho_pictograma: config.tamanho_pictograma,
        tema: config.tema,
        voz: config.voz,
        velocidade_voz: config.velocidade_voz,
        volume: config.volume,
        alto_contraste: config.alto_contraste,
        alvos_gigantes: config.alvos_gigantes,
        tempo_resposta: config.tempo_resposta,
        varredura_ativa: config.varredura_ativa,
        varredura_velocidade: config.varredura_velocidade,
        pin_saida: pin,
        cor_primaria: config.cor_primaria || '',
        cor_destaque: config.cor_destaque || '',
      };
      await Criancas.atualizar(payload);
      atualizarCriancaAtivaLocal(payload);
      Alert.alert('Salvo ✅', 'Configurações atualizadas.');
    } catch (err) { setErroServidor(mensagemErro(err)); }
    finally { setSalvando(false); }
  };

  const testarVoz = () => falarTexto('Olá! Assim que eu vou soar.', config);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaria} />
      <TopBar titulo="Ajustes" onVoltar={onVoltar} C={C} variante={V} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <BannerErro mensagem={erroServidor} C={C} variante={V} onFechar={() => setErroServidor(null)} />

        <Secao icone="volume-high-outline" titulo="Voz e som">
          <LinhaOpcoes s={s} label="Tipo de voz" valor={config.voz} onSelecionar={(v) => atualizarCampo('voz', v)}
            opcoes={[{ valor: 'feminina', label: 'Feminina' }, { valor: 'masculina', label: 'Masculina' }]} />
          <LinhaOpcoes s={s} label="Velocidade da fala" valor={config.velocidade_voz} onSelecionar={(v) => atualizarCampo('velocidade_voz', v)}
            opcoes={[{ valor: 0.6, label: 'Lenta' }, { valor: 0.85, label: 'Normal' }, { valor: 1.1, label: 'Rápida' }]} />
          <LinhaOpcoes s={s} label="Volume" valor={config.volume} onSelecionar={(v) => atualizarCampo('volume', v)}
            opcoes={[{ valor: 0.4, label: 'Baixo' }, { valor: 0.7, label: 'Médio' }, { valor: 1.0, label: 'Alto' }]} />
          <BotaoAnimado onPress={testarVoz} style={s.botaoSecundario}>
            <Text style={s.botaoSecundarioTxt}>🔊 Testar voz</Text>
          </BotaoAnimado>
        </Secao>

        <Secao icone="color-palette-outline" titulo="Aparência do Modo Criança">
          <LinhaOpcoes s={s} label="Tamanho dos pictogramas" valor={config.tamanho_pictograma} onSelecionar={(v) => atualizarCampo('tamanho_pictograma', v)}
            opcoes={[{ valor: 'grande', label: 'Grande' }, { valor: 'gigante', label: 'Gigante' }]} />
          <LinhaOpcoes s={s} label="Tema" valor={config.tema} onSelecionar={(v) => atualizarCampo('tema', v)}
            opcoes={[{ valor: 'claro', label: '☀️ Claro' }, { valor: 'escuro', label: '🌙 Escuro' }]} />

          <Text style={s.label}>Cores do Modo Criança</Text>
          {config.alto_contraste ? (
            <Text style={{ color: C.subtexto, fontSize: normalize(12.5), fontFamily: F.body, marginBottom: normalize(6), lineHeight: normalize(18) }}>
              O alto contraste usa uma paleta fixa (preto/amarelo) para garantir legibilidade — desligue-o abaixo para escolher cores personalizadas.
            </Text>
          ) : (
            <>
              <SeletorCor
                label="Cor principal"
                valor={config.cor_primaria}
                onMudar={(v) => atualizarCampo('cor_primaria', v)}
                paleta={CORES_TEMA_CRIANCA}
                C={C} variante={V}
              />
              <SeletorCor
                label="Cor de destaque"
                valor={config.cor_destaque}
                onMudar={(v) => atualizarCampo('cor_destaque', v)}
                paleta={CORES_TEMA_CRIANCA}
                C={C} variante={V}
              />
              {(!!config.cor_primaria || !!config.cor_destaque) && (
                <BotaoAnimado onPress={() => { atualizarCampo('cor_primaria', ''); atualizarCampo('cor_destaque', ''); }} style={s.botaoSecundario}>
                  <Text style={s.botaoSecundarioTxt}>Restaurar cores padrão do tema</Text>
                </BotaoAnimado>
              )}
            </>
          )}
        </Secao>

        <Secao icone="accessibility-outline" titulo="Acessibilidade — Modo Criança">
          <Interruptor C={C} variante={V} label="Alto contraste" descricao="Cores fortes em fundo preto, mais fáceis de enxergar" valor={config.alto_contraste} onToggle={(v) => atualizarCampo('alto_contraste', v)} />
          <Interruptor C={C} variante={V} label="Alvos gigantes" descricao="Aumenta ainda mais a área de toque dos botões" valor={config.alvos_gigantes} onToggle={(v) => atualizarCampo('alvos_gigantes', v)} />
          <Interruptor C={C} variante={V} label="Varredura por acionador" descricao="Destaca os itens um a um automaticamente; um único toque em qualquer lugar da tela seleciona o item destacado" valor={config.varredura_ativa} onToggle={(v) => atualizarCampo('varredura_ativa', v)} />

          <Text style={[s.label, { marginTop: normalize(16) }]}>Tempo de resposta (toque mantido antes de confirmar)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: normalize(4) }}>
            {[0, 500, 1000, 2000].map((ms) => (
              <ChipToque key={ms} s={s} selecionado={config.tempo_resposta === ms} onPress={() => atualizarCampo('tempo_resposta', ms)}>
                <Text style={[s.chipTxt, config.tempo_resposta === ms && s.chipTxtAtivo]}>{ms === 0 ? 'Instantâneo' : `${ms / 1000}s`}</Text>
              </ChipToque>
            ))}
          </View>

          {config.varredura_ativa && (
            <>
              <Text style={[s.label, { marginTop: normalize(12) }]}>Velocidade da varredura</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {[1000, 2000, 3000, 4000].map((ms) => (
                  <ChipToque key={ms} s={s} selecionado={config.varredura_velocidade === ms} onPress={() => atualizarCampo('varredura_velocidade', ms)}>
                    <Text style={[s.chipTxt, config.varredura_velocidade === ms && s.chipTxtAtivo]}>{ms / 1000}s</Text>
                  </ChipToque>
                ))}
              </View>
            </>
          )}
        </Secao>

        <Secao icone="lock-closed-outline" titulo="Saída do Modo Criança">
          <Campo label="PIN de saída (4 a 8 números)" C={C} variante={V} erro={erroPin} value={pin}
            onChangeText={(t) => { setPin(t.replace(/[^0-9]/g, '')); setErroPin(null); }} keyboardType="number-pad" maxLength={8} placeholder="1234" />
        </Secao>

        <BotaoAnimado onPress={salvar} loading={salvando} style={s.botaoPrimario}>
          <Text style={s.botaoPrimarioTxt}>Salvar configurações</Text>
        </BotaoAnimado>
      </ScrollView>
      <BotaoVoltar onPress={onVoltar} C={C} variante={V} />
    </SafeAreaView>
  );
}
