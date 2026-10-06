import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MOTION] Erro de renderização:', error, info);
  }

  tentarNovamente = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const mensagem = this.state.error?.message || 'Ocorreu um erro inesperado.';
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' }}>
        <StatusBar style="dark" />
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#17324D', textAlign: 'center', marginBottom: 12 }}>
          Não foi possível abrir esta tela
        </Text>
        <Text style={{ fontSize: 15, color: '#526477', textAlign: 'center', lineHeight: 22, marginBottom: 22 }}>
          O aplicativo encontrou um erro e não será fechado. Tente novamente. Se continuar, envie esta mensagem ao suporte:\n\n{mensagem}
        </Text>
        <TouchableOpacity
          onPress={this.tentarNovamente}
          style={{ backgroundColor: '#F97968', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 13 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
