/**
 * Lectura y escritura segura de datos en un almacenamiento web.
 *
 * Todas las funciones reciben el almacenamiento como primer parámetro (`localStorage`,
 * `sessionStorage` o, en los tests, un `AlmacenFalso`). Así este módulo no depende de ningún
 * almacenamiento concreto y se puede probar sin navegador.
 *
 * Los datos se guardan como texto JSON. Al leer, si no hay nada guardado, si el texto está
 * estropeado o si lo que hay no es del tipo esperado, se devuelve el valor por defecto en lugar
 * de lanzar un error: la página nunca se rompe por culpa de lo que haya en el almacenamiento.
 *
 * @module almacen
 */

/**
 * Comprueba si un valor leído tiene la misma forma que el valor por defecto: si se espera una
 * lista, tiene que ser una lista; si se espera un objeto, un objeto que no sea una lista ni `null`.
 * Con cualquier otro valor por defecto (un texto, un número, `null`…) se acepta lo que haya.
 *
 * @param {*} valor - Lo que se ha leído.
 * @param {*} porDefecto - Lo que se esperaba.
 * @returns {boolean} `true` si el valor sirve.
 */
function tieneLaFormaEsperada(valor, porDefecto) {
  if (Array.isArray(porDefecto)) {
    return Array.isArray(valor);
  }
  if (porDefecto !== null && typeof porDefecto === 'object') {
    return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
  }
  return true;
}

/**
 * Lee un dato guardado en JSON.
 *
 * @template T
 * @param {Storage} almacen - Dónde leer: `localStorage`, `sessionStorage` o un `AlmacenFalso`.
 * @param {string} clave - La clave del dato.
 * @param {T} porDefecto - Lo que se devuelve si no hay nada, si está estropeado o si no tiene la
 *   forma esperada.
 * @returns {T} El dato guardado o, si no sirve, el valor por defecto.
 * @example
 * leerJSON(localStorage, 'horizonte.usuarios', []); // → [] la primera vez
 */
export function leerJSON(almacen, clave, porDefecto) {
  let texto;
  try {
    texto = almacen.getItem(clave);
  } catch {
    // Algunos navegadores bloquean el almacenamiento (por ejemplo, en modo privado estricto)
    return porDefecto;
  }

  if (texto === null) {
    return porDefecto;
  }

  try {
    const valor = JSON.parse(texto);
    return tieneLaFormaEsperada(valor, porDefecto) ? valor : porDefecto;
  } catch {
    // El texto no es JSON válido: alguien lo ha cambiado a mano o se guardó mal
    return porDefecto;
  }
}

/**
 * Guarda un dato convertido a JSON.
 *
 * @param {Storage} almacen - Dónde guardar.
 * @param {string} clave - La clave del dato.
 * @param {*} valor - Lo que se guarda (objeto, lista, texto, número…).
 * @returns {boolean} `true` si se ha guardado; `false` si el almacenamiento lo ha impedido
 *   (por ejemplo, porque está lleno).
 * @example
 * guardarJSON(sessionStorage, 'horizonte.sesion', { usuario: 'ana', rol: 'administrador' }); // → true
 */
export function guardarJSON(almacen, clave, valor) {
  try {
    almacen.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

/**
 * Borra un dato.
 *
 * @param {Storage} almacen - De dónde borrar.
 * @param {string} clave - La clave del dato.
 * @returns {void}
 * @example
 * borrar(sessionStorage, 'horizonte.sesion');
 */
export function borrar(almacen, clave) {
  try {
    almacen.removeItem(clave);
  } catch {
    // Si el almacenamiento no está disponible, no hay nada que borrar
  }
}
