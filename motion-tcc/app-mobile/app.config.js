// Configuração dinâmica do Expo para injetar as URLs no bundle.
// Para desenvolvimento local, use EXPO_PUBLIC_API_URL no arquivo .env.
module.exports = ({ config }) => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.APP_API_BASE_URL ||
    process.env.API_BASE_URL ||
    '';

  const hardwareBaseUrl =
    process.env.APP_HARDWARE_BASE_URL ||
    process.env.EXPO_PUBLIC_HARDWARE_URL;

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
    ],
    extra: {
      ...(config.extra || {}),
      ...(apiBaseUrl ? { API_BASE_URL: apiBaseUrl.trim() } : {}),
      ...(hardwareBaseUrl ? { HARDWARE_BASE_URL: hardwareBaseUrl.trim() } : {}),
    },
  };
};
