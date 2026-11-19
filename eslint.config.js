import js from '@eslint/js';
import globals from 'globals';

export default [
  // Lo que generan las herramientas no se revisa: documentación, web publicable e informes
  { ignores: ['docs/', 'dist/', 'coverage/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Reglas que ya traía la plantilla
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',

      // Reglas añadidas para Horizonte (explicadas en el README, «ESLint y Prettier»)
      'no-console': 'error', // nada de console.log olvidados: los mensajes van por el sistema de avisos
      curly: 'error', // if, else, for y while siempre con llaves
      'no-implicit-coercion': 'error', // conversiones explícitas: Number(x), no +x; Boolean(x), no !!x
      camelcase: ['error', { properties: 'never' }], // nombres en camelCase (las constantes en MAYÚSCULAS valen)
    },
  },
  // Los scripts de Node (npm run build) escriben en la terminal: ahí console es lo correcto
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
];
