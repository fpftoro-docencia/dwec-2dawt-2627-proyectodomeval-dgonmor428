// Tests de js/direccion.js: la página guardada en la dirección (?pagina=N), sin navegador.
import { describe, it, expect, vi } from 'vitest';
import { leerPagina, escribirPagina } from '../../js/direccion.js';

describe('leerPagina', () => {
  it.each([
    ['un número', '?pagina=3', 3],
    ['la primera', '?pagina=1', 1],
    ['con otros parámetros', '?x=1&pagina=4&y=2', 4],
    ['sin el signo ?', 'pagina=2', 2],
    ['un decimal (no lo corrige)', '?pagina=2.7', 2.7],
    ['un número muy grande', '?pagina=99', 99],
    ['negativo (no lo corrige)', '?pagina=-4', -4],
  ])('lee %s', (_motivo, busqueda, esperado) => {
    expect(leerPagina(busqueda)).toBe(esperado);
  });

  it.each([
    ['sin el parámetro', '', 0],
    ['otro parámetro', '?id=7', 0],
    ['parámetro vacío', '?pagina=', 0],
  ])('%s devuelve 0 (paginar lo lleva a la 1)', (_motivo, busqueda, esperado) => {
    expect(leerPagina(busqueda)).toBe(esperado);
  });

  it.each([
    ['texto', '?pagina=abc'],
    ['texto con número', '?pagina=2abc'],
  ])('con %s devuelve NaN', (_motivo, busqueda) => {
    expect(leerPagina(busqueda)).toBeNaN();
  });
});

describe('escribirPagina', () => {
  it.each([
    ['listado.html', 2, 'listado.html?pagina=2'],
    ['listado.html', 10, 'listado.html?pagina=10'],
    ['usuarios.html', 3, 'usuarios.html?pagina=3'],
    ['usuarios.html', 2, 'usuarios.html?pagina=2'],
  ])('en %s, la página %i escribe «%s»', (nombrePagina, pagina, esperado) => {
    const actualizar = vi.fn();
    escribirPagina(actualizar, nombrePagina, pagina);
    expect(actualizar).toHaveBeenCalledExactlyOnceWith(esperado);
  });

  it.each([
    ['listado.html', 1],
    ['usuarios.html', 1],
    ['usuarios.html', 0],
    ['listado.html', -3],
  ])('en %s, la página %i quita el parámetro y deja solo el nombre', (nombrePagina, pagina) => {
    const actualizar = vi.fn();
    escribirPagina(actualizar, nombrePagina, pagina);
    // Nunca una dirección vacía: no quitaría el ?pagina= anterior
    expect(actualizar).toHaveBeenCalledExactlyOnceWith(nombrePagina);
  });
});
