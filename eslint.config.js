import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: "readonly"
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_'}]
    }
  }
]);
