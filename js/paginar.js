/**
 * Paginación común al listado de capturas y a la zona de administración.
 *
 * `paginar` es una función pura: no toca el DOM ni la dirección, solo recibe una lista y dice qué
 * elementos van en una página. Los controles («Anterior», los números y «Siguiente») y la página
 * en `?pagina=` los pondrán las páginas con lo que devuelve.
 *
 * @module paginar
 */

/**
 * Lo que devuelve {@link paginar}.
 *
 * @typedef {object} Pagina
 * @property {Array} elementos - Los elementos de la página, en el mismo orden que en la lista.
 * @property {number} pagina - La página que se muestra de verdad, ya corregida (empieza en 1).
 * @property {number} totalPaginas - Cuántas páginas hay. Una lista vacía tiene una página, vacía.
 */

/**
 * Devuelve los elementos de una página de la lista.
 *
 * Una página que no existe se corrige a la más cercana que sí existe: la 0, una negativa o una
 * que no es un número (como `Number('abc')` al leer `?pagina=abc`) pasan a la 1, y una mayor que
 * el total pasa a la última. Una página con decimales se queda con la parte entera (`2.7` → 2).
 *
 * No cambia la lista que recibe: `slice` devuelve una copia del trozo.
 *
 * @param {Array} lista - Todos los elementos (ya filtrados por el buscador, si lo hay).
 * @param {number} pagina - La página pedida, empezando en 1.
 * @param {number} porPagina - Cuántos elementos caben en una página. Un entero mayor que 0.
 * @returns {Pagina} Los elementos de la página, la página corregida y el total de páginas.
 * @throws {RangeError} Si `porPagina` no es un entero mayor que 0: sin eso no se puede paginar.
 * @example
 * paginar(['a', 'b', 'c', 'd', 'e'], 2, 2);
 * // → { elementos: ['c', 'd'], pagina: 2, totalPaginas: 3 }
 * paginar(['a', 'b', 'c', 'd', 'e'], 9, 2);
 * // → { elementos: ['e'], pagina: 3, totalPaginas: 3 }
 */
export function paginar(lista, pagina, porPagina) {
  if (!Number.isInteger(porPagina) || porPagina < 1) {
    throw new RangeError('porPagina tiene que ser un entero mayor que 0.');
  }

  // Una lista vacía tiene una página (vacía): así la página siempre va de 1 al total
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));

  // Una página que no es un número (NaN) no está cerca de ninguna: se trata como la primera
  const pedida = Number.isNaN(pagina) ? 1 : Math.trunc(pagina);
  const corregida = Math.min(Math.max(pedida, 1), totalPaginas);

  // Página 1 → del 0 al porPagina; página 2 → del porPagina al 2·porPagina…
  const inicio = (corregida - 1) * porPagina;
  return {
    elementos: lista.slice(inicio, inicio + porPagina),
    pagina: corregida,
    totalPaginas,
  };
}
