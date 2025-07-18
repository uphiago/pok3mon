import eslintPluginImport from 'eslint-plugin-import';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],

    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: { import: eslintPluginImport },
    rules: {
      //rules
    },
  },
];
