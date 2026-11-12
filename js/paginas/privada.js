/**
 * Lo común de las páginas privadas (`listado.html`, `ficha.html` y `usuarios.html`): la protección
 * por sesión y por rol, y la cabecera compartida.
 *
 * HTML que necesita (la cabecera común):
 * - `#sesion-nombre` y `#sesion-rol`, donde se escriben el usuario y su rol;
 * - el enlace del menú a `usuarios.html`, dentro de un `<li>` que se oculta (`hidden`) si el usuario
 *   no es administrador;
 * - el botón `#cerrar-sesion`;
 * - la región de avisos `#avisos`.
 *
 * Qué hace:
 * - **sin sesión**, lleva a `index.html` con `location.replace` (así el botón «Atrás» no devuelve a
 *   la página privada);
 * - en una página **solo para administradores**, si el usuario no lo es, lo lleva al listado con un
 *   aviso de error;
 * - si puede quedarse, muestra su nombre y su rol, enseña «Usuarios» solo a los administradores y
 *   muestra el aviso que haya dejado la página anterior («Te has registrado»…);
 * - «Cerrar sesión» borra la sesión y vuelve a `index.html` con un aviso.
 *
 * @module paginas/privada
 */

import { leerSesion, cerrarSesion, esAdministrador } from '../sesion.js';
import { escucharAvisos, guardarAvisoPendiente, mostrarAvisoPendiente } from '../avisos.js';
import { ROLES } from '../usuarios.js';

/** Página a la que se va sin sesión o al cerrarla. */
export const PAGINA_DE_ENTRADA = 'index.html';

/** Página a la que se va si no se tiene permiso para estar en una página de administradores. */
export const PAGINA_SIN_PERMISO = 'listado.html';

/** Cómo se muestra cada rol en la cabecera. */
const NOMBRES_ROL = Object.freeze({
  [ROLES.USUARIO]: 'Usuario',
  [ROLES.ADMINISTRADOR]: 'Administrador',
});

/**
 * Protege una página privada y prepara su cabecera.
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {Storage} dependencias.almacenSesion - Dónde están la sesión y los avisos pendientes
 *   (`sessionStorage`).
 * @param {function(string): void} dependencias.reemplazar - Cómo ir a otra página sustituyendo la
 *   actual en el historial (`location.replace`).
 * @param {boolean} [dependencias.soloAdministradores] - `true` en las páginas solo para
 *   administradores. Por defecto, `false`.
 * @returns {module:sesion~Sesion|null} La sesión si la persona puede quedarse en la página;
 *   `null` si se la ha llevado a otra.
 * @listens click
 * @fires aviso
 * @example
 * const sesion = iniciarPaginaPrivada({
 *   documento: document,
 *   almacenSesion: sessionStorage,
 *   reemplazar: (url) => location.replace(url),
 * });
 */
export function iniciarPaginaPrivada({
  documento,
  almacenSesion,
  reemplazar,
  soloAdministradores = false,
}) {
  const sesion = leerSesion(almacenSesion);

  if (sesion === null) {
    reemplazar(PAGINA_DE_ENTRADA);
    return null;
  }

  const administrador = esAdministrador(sesion);

  if (soloAdministradores && !administrador) {
    guardarAvisoPendiente(
      almacenSesion,
      'La página de usuarios es solo para administradores.',
      'error',
    );
    reemplazar(PAGINA_SIN_PERMISO);
    return null;
  }

  // La cabecera: quién ha entrado, con qué rol y, si es administrador, el enlace a «Usuarios»
  documento.querySelector('#sesion-nombre').textContent = sesion.nombre;
  documento.querySelector('#sesion-rol').textContent = NOMBRES_ROL[sesion.rol];
  documento.querySelector('a[href="usuarios.html"]').closest('li').hidden = !administrador;

  escucharAvisos(documento, documento.querySelector('#avisos'));
  mostrarAvisoPendiente(almacenSesion, documento);

  documento.querySelector('#cerrar-sesion').addEventListener('click', () => {
    cerrarSesion(almacenSesion);
    guardarAvisoPendiente(
      almacenSesion,
      'Has cerrado la sesión. ¡Hasta la próxima salida!',
      'info',
    );
    reemplazar(PAGINA_DE_ENTRADA);
  });

  return sesion;
}
