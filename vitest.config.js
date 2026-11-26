import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    // las pruebas de e2e/ son de Playwright; .claude/ tiene las copias de trabajo (worktrees) de los
    // subagentes, que repiten todo el proyecto
    exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**'],
    // `npm run coverage` mide la cobertura (requisito 21 del enunciado)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'], // `text` en la terminal y `html` en coverage/, que sube el workflow
      // Las funciones puras: los validadores (registro y captura) y la paginación
      include: ['js/validadores.js', 'js/paginar.js'],
      // El enunciado pide al menos el 90 % de líneas; aquí se exige el 100 % de líneas, ramas,
      // funciones y sentencias, que lo cumple y es más estricto. Si no se llega, `npm run coverage`
      // termina con error y el trabajo `Tests` se pone en rojo. Ojo: la cobertura cuenta todos los
      // tests juntos, y los de integración también ejecutan estos validadores, así que quitar un
      // caso de los tests unitarios solo la baja si nadie más pasa por esa línea o rama
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
