const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// O framer-motion (trazido pelo moti) importa `tslib` a partir do seu
// diretório dentro de node_modules/.pnpm — onde o metro não procura por
// padrão. Ajustamos a busca para incluir os caminhos de node_modules do
// projeto inteiro.
const extra = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'node_modules/.pnpm'),
];
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = extra;

module.exports = config;
