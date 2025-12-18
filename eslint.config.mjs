import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['**/dist']
  },
  {
    rules: {
      ...js.configs.recommended.rules
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
        ...globals.serviceworker,
        ...globals.node,
        globalThis: true,
        importScripts: true,
        crossOriginIsolated: true
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  }
];
