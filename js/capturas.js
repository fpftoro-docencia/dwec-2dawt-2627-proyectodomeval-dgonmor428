/**
 * Capturas de cada usuario, guardadas en `localStorage`.
 *
 * - Cada usuario tiene su propia clave (`horizonte.capturas.ana`), así cada uno ve solo las suyas
 *   y no hace falta filtrar una lista de todos.
 * - Los nombres no distinguen mayúsculas, como en el módulo de usuarios: «Ana» y «ana» comparten
 *   las mismas capturas.
 * - Cada captura tiene un `id` único, que usan el enlace «Editar» (`ficha.html?id=…`) y «Borrar».
 * - Las lecturas no fallan: si lo guardado está estropeado, se descarta lo que no sirve.
 *
 * Como el resto de módulos de datos, recibe el almacenamiento como parámetro. La función que crea
 * los `id` también se puede recibir, para que los tests sepan qué `id` saldrá.
 *
 * @module capturas
 */

import { leerJSON, guardarJSON } from './almacen.js';

/** Principio de la clave de `localStorage` de las capturas; detrás va el nombre del usuario. */
export const PREFIJO_CAPTURAS = 'horizonte.capturas.';

/** Mensaje del error que se lanza si el almacenamiento no deja guardar. */
const MENSAJE_SIN_GUARDAR =
  'No se ha podido guardar la captura: el almacenamiento está lleno o bloqueado.';

/**
 * Una captura tal como se guarda: su `id` y los campos de la ficha (título, categoría, fecha,
 * lugar, coordenadas…), que son cosa de la ficha y este módulo guarda tal cual.
 *
 * @typedef {object} Captura
 * @property {string} id - Identificador único.
 */

/**
 * Crea un `id` único con `crypto.randomUUID()`, que da textos como
 * `'3b241101-e2bb-4255-8caf-4136c566a962'`: hay tantos posibles que dos iguales son prácticamente
 * imposibles.
 *
 * @returns {string} El `id` nuevo.
 */
function crearIdAleatorio() {
  return crypto.randomUUID();
}

/**
 * Devuelve la clave de `localStorage` de las capturas de un usuario.
 *
 * @param {string} usuario - El nombre del usuario (el de la sesión).
 * @returns {string} La clave, con el nombre en minúsculas.
 * @example
 * claveCapturas('Ana'); // → 'horizonte.capturas.ana'
 */
export function claveCapturas(usuario) {
  return PREFIJO_CAPTURAS + usuario.toLocaleLowerCase('es');
}

/**
 * Comprueba que un elemento leído tiene la forma de una captura: un objeto con un `id` de texto.
 * Sin `id` no se podría editar ni borrar, así que una entrada sin él se descarta.
 *
 * @param {*} dato - El elemento leído.
 * @returns {boolean} `true` si es una captura válida.
 */
function esCapturaValida(dato) {
  return (
    dato !== null &&
    typeof dato === 'object' &&
    !Array.isArray(dato) &&
    typeof dato.id === 'string' &&
    dato.id !== ''
  );
}

/**
 * Guarda la lista de capturas de un usuario.
 *
 * @param {Storage} almacen - Dónde se guardan.
 * @param {string} usuario - El nombre del usuario.
 * @param {Captura[]} capturas - La lista completa.
 * @returns {void}
 * @throws {Error} Si el almacenamiento no deja guardar (lleno o bloqueado).
 */
function guardarCapturas(almacen, usuario, capturas) {
  if (!guardarJSON(almacen, claveCapturas(usuario), capturas)) {
    throw new Error(MENSAJE_SIN_GUARDAR);
  }
}

/**
 * Devuelve las capturas de un usuario, en el orden en que se crearon.
 *
 * @param {Storage} almacen - Dónde están (normalmente, `localStorage`).
 * @param {string} usuario - El nombre del usuario.
 * @returns {Captura[]} Sus capturas válidas: una lista vacía si no tiene o si lo guardado está
 *   estropeado.
 * @example
 * listarCapturas(localStorage, 'ana'); // → [{ id: '…', titulo: 'Vía Láctea en el Teide', … }]
 */
export function listarCapturas(almacen, usuario) {
  return leerJSON(almacen, claveCapturas(usuario), []).filter(esCapturaValida);
}

/**
 * Busca una captura de un usuario por su `id`. Solo busca entre las suyas: con el `id` de una
 * captura de otro usuario no la encuentra.
 *
 * @param {Storage} almacen - Dónde están.
 * @param {string} usuario - El nombre del usuario.
 * @param {string} id - El `id` buscado (el de `ficha.html?id=…`).
 * @returns {Captura|null} La captura, o `null` si no existe.
 * @example
 * buscarCaptura(localStorage, 'ana', 'no-existe'); // → null
 */
export function buscarCaptura(almacen, usuario, id) {
  return listarCapturas(almacen, usuario).find((captura) => captura.id === id) ?? null;
}

/**
 * Da de alta una captura con un `id` nuevo. Si los datos traen un `id`, se ignora: el `id` lo
 * pone siempre este módulo. Si el `id` creado ya existiera, se crea otro, así nunca se repite.
 *
 * @param {Storage} almacen - Dónde se guardan.
 * @param {string} usuario - El nombre del usuario.
 * @param {object} datos - Los campos de la ficha, ya normalizados.
 * @param {function(): string} [crearId] - Cómo crear el `id`. Por defecto, `crypto.randomUUID()`.
 * @returns {Captura} La captura guardada, con su `id`.
 * @throws {Error} Si el almacenamiento no deja guardar.
 * @example
 * const captura = crearCaptura(localStorage, 'ana', { titulo: 'Aurora en Tromsø' });
 * captura.id; // → '3b241101-e2bb-4255-8caf-4136c566a962'
 */
export function crearCaptura(almacen, usuario, datos, crearId = crearIdAleatorio) {
  const capturas = listarCapturas(almacen, usuario);
  const usados = new Set(capturas.map((captura) => captura.id));

  let id = crearId();
  while (usados.has(id)) {
    id = crearId();
  }

  // El id va el último para que gane al que pudiera venir en los datos
  const nueva = { ...datos, id };
  guardarCapturas(almacen, usuario, [...capturas, nueva]);
  return nueva;
}

/**
 * Cambia los datos de una captura existente. Conserva su `id` y su posición en la lista.
 *
 * @param {Storage} almacen - Dónde se guardan.
 * @param {string} usuario - El nombre del usuario.
 * @param {string} id - El `id` de la captura que se edita.
 * @param {object} datos - Los campos nuevos, que sustituyen a los anteriores.
 * @returns {Captura|null} La captura guardada, o `null` si no existe ese `id`.
 * @throws {Error} Si el almacenamiento no deja guardar.
 * @example
 * actualizarCaptura(localStorage, 'ana', captura.id, { titulo: 'Aurora boreal en Tromsø' });
 */
export function actualizarCaptura(almacen, usuario, id, datos) {
  const capturas = listarCapturas(almacen, usuario);
  const posicion = capturas.findIndex((captura) => captura.id === id);
  if (posicion === -1) {
    return null;
  }

  const actualizada = { ...datos, id };
  capturas[posicion] = actualizada;
  guardarCapturas(almacen, usuario, capturas);
  return actualizada;
}

/**
 * Borra una captura.
 *
 * @param {Storage} almacen - Dónde se guardan.
 * @param {string} usuario - El nombre del usuario.
 * @param {string} id - El `id` de la captura que se borra.
 * @returns {boolean} `true` si se ha borrado; `false` si no existía.
 * @throws {Error} Si el almacenamiento no deja guardar la lista sin ella.
 * @example
 * borrarCaptura(localStorage, 'ana', captura.id); // → true
 */
export function borrarCaptura(almacen, usuario, id) {
  const capturas = listarCapturas(almacen, usuario);
  const restantes = capturas.filter((captura) => captura.id !== id);
  if (restantes.length === capturas.length) {
    return false;
  }
  guardarCapturas(almacen, usuario, restantes);
  return true;
}
