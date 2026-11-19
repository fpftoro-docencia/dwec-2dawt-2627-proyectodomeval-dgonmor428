/**
 * Utilidades del buscador, comunes al listado de capturas y a la zona de administración.
 *
 * No tocan el DOM ni la dirección: son funciones puras (salvo `retardar`, que usa un temporizador),
 * así se prueban sin página.
 *
 * @module buscar
 */

/**
 * Deja un texto listo para comparar: sin tildes y en minúsculas.
 *
 * Con `normalize('NFD')` cada letra con tilde se descompone en la letra y su marca («é» → «e» +
 * «´»); después se quitan las marcas (`\p{M}`) y se pasa a minúsculas. Así «Cámara», «CAMARA» y
 * «camara» son iguales para el buscador.
 *
 * @param {string} texto - El texto a normalizar. Un valor que no es texto (`null`, número…) se
 *   convierte antes en texto.
 * @returns {string} El texto sin marcas y en minúsculas.
 * @example
 * normalizar('Nebulosa de ÓRIÓN'); // → 'nebulosa de orion'
 */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Crea una versión de una función que espera a que pasen `ms` milisegundos sin que la llamen para
 * ejecutarse (_debounce_). Cada llamada nueva cancela la espera anterior.
 *
 * Sirve para el buscador: mientras se escribe, el evento `input` salta con cada tecla, pero solo
 * se busca cuando se hace una pausa.
 *
 * @param {function(...*): void} funcion - La función que se quiere retardar.
 * @param {number} ms - Los milisegundos de espera.
 * @returns {function(...*): void} La función retardada, que recibe los mismos argumentos.
 * @example
 * const buscarConPausa = retardar(buscar, 300);
 * buscarConPausa('a');
 * buscarConPausa('al'); // solo esta llega a ejecutarse, 300 ms después
 */
export function retardar(funcion, ms) {
  let temporizador = null;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...argumentos), ms);
  };
}
