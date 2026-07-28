const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix nécessaire pour Firebase JS SDK v10+ avec Expo/Metro :
// sans cette ligne, Metro résout mal les imports internes de Firebase
// et provoque l'erreur "Component auth has not been registered yet"
config.resolver.unstable_enablePackageExports = false;

module.exports = config;