/**
 * La sesión de Horizonte, guardada en `sessionStorage`.
 *
 * La sesión solo guarda **quién** ha entrado y **con qué rol**: el nombre de usuario y su rol.
 * Nada de correo ni de contraseña. Se guarda en `sessionStorage` porque dura lo que dura la
 * pestaña: al cerrarla, hay que volver a entrar.
 *
 * Como el resto de módulos de datos, recibe el almacenamiento como parámetro, para poder probarlo
 * con `AlmacenFalso`.
 *
 * @module sesion
 */

import { leerJSON, guardarJSON, borrar } from './almacen.js';
import { ROLES } from './usuarios.js';

/** Clave de `sessionStorage` donde se guarda la sesión. */
export const CLAVE_SESION = 'horizonte.sesion';

/**
 * La sesión abierta.
 *
 * @typedef {object} Sesion
 * @property {string} nombre - Nombre del usuario que ha entrado.
 * @property {'usuario'|'administrador'} rol - Su rol.
 */

/**
 * Comprueba que lo leído tiene la forma de una sesión válida.
 *
 * @param {*} dato - Lo leído del almacenamiento.
 * @returns {boolean} `true` si es una sesión válida.
 */
function esSesionValida(dato) {
  return (
    dato !== null &&
    typeof dato === 'object' &&
    typeof dato.nombre === 'string' &&
    dato.nombre !== '' &&
    Object.values(ROLES).includes(dato.rol)
  );
}

/**
 * Abre la sesión de un usuario. Solo guarda su nombre y su rol, aunque el objeto traiga más datos.
 *
 * @param {Storage} almacen - Dónde se guarda la sesión (normalmente, `sessionStorage`).
 * @param {{ nombre: string, rol: 'usuario'|'administrador' }} usuario - El usuario que entra.
 * @returns {boolean} `true` si se ha guardado; `false` si el almacenamiento lo ha impedido.
 * @example
 * iniciarSesion(sessionStorage, { nombre: 'ana', rol: 'administrador' }); // → true
 */
export function iniciarSesion(almacen, { nombre, rol }) {
  return guardarJSON(almacen, CLAVE_SESION, { nombre, rol });
}

/**
 * Lee la sesión abierta.
 *
 * @param {Storage} almacen - Dónde está la sesión.
 * @returns {Sesion|null} La sesión, o `null` si no hay ninguna o si lo guardado está estropeado.
 * @example
 * leerSesion(sessionStorage); // → { nombre: 'ana', rol: 'administrador' } o null
 */
export function leerSesion(almacen) {
  const sesion = leerJSON(almacen, CLAVE_SESION, null);
  return esSesionValida(sesion) ? { nombre: sesion.nombre, rol: sesion.rol } : null;
}

/**
 * Cierra la sesión.
 *
 * @param {Storage} almacen - Dónde está la sesión.
 * @returns {void}
 * @example
 * cerrarSesion(sessionStorage);
 */
export function cerrarSesion(almacen) {
  borrar(almacen, CLAVE_SESION);
}

/**
 * Dice si una sesión es de administrador.
 *
 * @param {Sesion|null} sesion - La sesión leída con {@link leerSesion}.
 * @returns {boolean} `true` si hay sesión y su rol es administrador.
 * @example
 * esAdministrador(leerSesion(sessionStorage)); // → true o false
 */
export function esAdministrador(sesion) {
  return sesion !== null && sesion.rol === ROLES.ADMINISTRADOR;
}
