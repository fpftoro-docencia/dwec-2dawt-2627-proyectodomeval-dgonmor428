// Tests de la función paginar (js/paginar.js).
// La lista de ejemplo tiene 7 capturas y se pagina de 3 en 3: páginas [1, 2, 3], [4, 5, 6] y [7].
import { describe, it, expect } from 'vitest';
import { paginar } from '../../js/paginar.js';

const SIETE = [1, 2, 3, 4, 5, 6, 7];

describe('paginar', () => {
  it('la primera página tiene los primeros elementos', () => {
    expect(paginar(SIETE, 1, 3)).toEqual({ elementos: [1, 2, 3], pagina: 1, totalPaginas: 3 });
  });

  it('una página del medio tiene los elementos siguientes', () => {
    expect(paginar(SIETE, 2, 3)).toEqual({ elementos: [4, 5, 6], pagina: 2, totalPaginas: 3 });
  });

  it('la última página tiene lo que sobra, aunque no se llene', () => {
    expect(paginar(SIETE, 3, 3)).toEqual({ elementos: [7], pagina: 3, totalPaginas: 3 });
  });

  it('si la lista llena justo las páginas, la última va llena', () => {
    expect(paginar([1, 2, 3, 4, 5, 6], 2, 3)).toEqual({
      elementos: [4, 5, 6],
      pagina: 2,
      totalPaginas: 2,
    });
  });

  it('una lista vacía tiene una página, vacía', () => {
    expect(paginar([], 1, 3)).toEqual({ elementos: [], pagina: 1, totalPaginas: 1 });
  });

  it('en una lista vacía, cualquier página se corrige a la 1', () => {
    expect(paginar([], 5, 3)).toEqual({ elementos: [], pagina: 1, totalPaginas: 1 });
  });

  it('si todo cabe en una página, solo hay una', () => {
    expect(paginar([1, 2], 1, 10)).toEqual({ elementos: [1, 2], pagina: 1, totalPaginas: 1 });
  });

  it.each([
    [9, 3, 'una página mayor que el total pasa a la última'],
    [4, 3, 'la página justo después de la última pasa a la última'],
    [0, 1, 'la página 0 pasa a la primera'],
    [-2, 1, 'una página negativa pasa a la primera'],
    [Number.NaN, 1, 'una página que no es un número (?pagina=abc) pasa a la primera'],
    [Number.POSITIVE_INFINITY, 3, 'una página infinita pasa a la última, la más cercana'],
    [2.7, 2, 'una página con decimales se queda con la parte entera'],
  ])('la página %s se corrige a la %i: %s', (pedida, corregida) => {
    const resultado = paginar(SIETE, pedida, 3);
    expect(resultado.pagina).toBe(corregida);
    expect(resultado.elementos).toEqual(paginar(SIETE, corregida, 3).elementos);
    expect(resultado.totalPaginas).toBe(3);
  });

  it('no cambia la lista que recibe', () => {
    const lista = [...SIETE];
    paginar(lista, 2, 3);
    expect(lista).toEqual(SIETE);
  });

  it('funciona con objetos y los devuelve tal cual, sin copiarlos', () => {
    const capturas = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const { elementos } = paginar(capturas, 2, 2);
    expect(elementos).toHaveLength(1);
    expect(elementos[0]).toBe(capturas[2]);
  });

  it.each([
    [0, 'es 0'],
    [-3, 'es negativo'],
    [2.5, 'tiene decimales'],
    [Number.NaN, 'no es un número'],
  ])('lanza un RangeError si porPagina %s (%s)', (porPagina) => {
    expect(() => paginar(SIETE, 1, porPagina)).toThrow(RangeError);
  });
});
