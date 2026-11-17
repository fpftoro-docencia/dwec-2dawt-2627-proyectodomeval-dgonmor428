/**
 * La página de una lista guardada en la dirección (`?pagina=2`), común al listado de capturas y a
 * la zona de administración.
 *
 * No usa `location` ni `history`: recibe el texto de la dirección y la función que la cambia, como
 * las páginas, así se prueba sin navegador.
 *
 * @module direccion
 */

/**
 * Lee la página de la parte `?…` de la dirección.
 *
 * No la corrige: `Number(null)` es 0 y `Number('abc')` es `NaN`, y `paginar` convierte los dos a la
 * página 1 (y una página pasada del total, a la última).
 *
 * @param {string} busqueda - La parte `?…` de la dirección (`location.search`).
 * @returns {number} El número leído (puede ser 0 o `NaN`).
 * @example
 * leerPagina('?pagina=3'); // → 3
 */
export function leerPagina(busqueda) {
  return Number(new URLSearchParams(busqueda).get('pagina'));
}

/**
 * Escribe la página en la dirección sin añadir una entrada al historial. En la página 1 se quita
 * el parámetro para que la dirección quede limpia.
 *
 * @param {function(string): void} actualizarDireccion - Cambia la dirección
 *   (`(url) => history.replaceState(null, '', url)`).
 * @param {string} nombrePagina - El nombre de la página HTML (`'listado.html'`).
 * @param {number} pagina - La página que se está viendo.
 * @returns {void}
 * @example
 * escribirPagina(actualizarDireccion, 'listado.html', 2); // escribe «listado.html?pagina=2»
 */
export function escribirPagina(actualizarDireccion, nombrePagina, pagina) {
  const parametros = new URLSearchParams();
  if (pagina > 1) {
    parametros.set('pagina', String(pagina));
  }
  const consulta = parametros.toString();
  // Una dirección vacía ('') no quitaría el `?pagina=` anterior: se escribe el nombre de la página
  actualizarDireccion(consulta === '' ? nombrePagina : `${nombrePagina}?${consulta}`);
}
