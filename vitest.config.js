import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, 'e2e/**'], // las pruebas de e2e/ son de Playwright
    // `npm run coverage` mide la cobertura (requisito 21 del enunciado)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'], // `text` en la terminal y `html` en coverage/, que sube el workflow
      // Las funciones puras: los validadores (registro y captura) y la paginación
      include: ['js/validadores.js', 'js/paginar.js'],
      // El umbral que pide el enunciado: al menos el 90 % de líneas. Si no se llega, `npm run
      // coverage` termina con error y la integración continua se pone en rojo
      thresholds: { lines: 90 },
    },
  },
});
