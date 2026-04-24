const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// isomorphic-git ships a CJS entry (index.cjs) that requires Node's `crypto` module,
// which doesn't exist in React Native. The ESM entry (index.js) uses Web Crypto
// with a pure-JS sha.js fallback, which works fine in RN. Force Metro to resolve
// the ESM build so bundling succeeds inside Expo.
const isogitMain = path.resolve(__dirname, 'node_modules/isomorphic-git/index.js');
const isogitHttpWeb = path.resolve(
  __dirname,
  'node_modules/isomorphic-git/http/web/index.js',
);

const baseResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'isomorphic-git') {
    return { type: 'sourceFile', filePath: isogitMain };
  }
  if (moduleName === 'isomorphic-git/http/web') {
    return { type: 'sourceFile', filePath: isogitHttpWeb };
  }
  if (baseResolveRequest) {
    return baseResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
