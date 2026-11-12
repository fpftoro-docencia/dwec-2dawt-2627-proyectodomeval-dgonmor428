/**
 * Usuarios de Horizonte, guardados en `localStorage`.
 *
 * - De cada usuario se guarda su nombre, su correo, su rol y el **resumen** de su contraseña,
 *   nunca la contraseña.
 * - El primer usuario que se registra es administrador; los demás, usuarios.
 * - Los nombres no distinguen mayúsculas: «Ana» y «ana» son el mismo usuario.
 *
 * Como el resto de módulos de datos, recibe el almacenamiento como parámetro. Las funciones que
 * calculan el resumen también lo reciben (por defecto, `resumirClave`), para que los tests de
 * integración puedan sustituirlo, como pide el enunciado.
 *
 * @module usuarios
 */

import { leerJSON, guardarJSON } from './almacen.js';
import { resumirClave } from './clave.js';

/** Clave de `localStorage` donde se guarda la lista de usuarios. */
export const CLAVE_USUARIOS = 'horizonte.usuarios';

/** Los dos roles posibles. */
export const ROLES = Object.freeze({
  USUARIO: 'usuario',
  ADMINISTRADOR: 'administrador',
});

/**
 * Un usuario tal como se guarda.
 *
 * @typedef {object} UsuarioGuardado
 * @property {string} nombre - Nombre de usuario.
 * @property {string} correo - Correo electrónico.
 * @property {string} resumen - Resumen SHA-256 de la contraseña.
 * @property {'usuario'|'administrador'} rol - Su rol.
 */

/**
 * Un usuario tal como lo ven las páginas: sin el resumen de la contraseña.
 *
 * @typedef {object} Usuario
 * @property {string} nombre - Nombre de usuario.
 * @property {string} correo - Correo electrónico.
 * @property {'usuario'|'administrador'} rol - Su rol.
 */

/**
 * Comprueba que un elemento leído del almacenamiento tiene la forma de un usuario. Así una
 * entrada estropeada (cambiada a mano, a medias…) se descarta en lugar de romper la página.
 *
 * @param {*} dato - El elemento leído.
 * @returns {boolean} `true` si es un usuario válido.
 */
function esUsuarioValido(dato) {
  return (
    dato !== null &&
    typeof dato === 'object' &&
    typeof dato.nombre === 'string' &&
    typeof dato.correo === 'string' &&
    typeof dato.resumen === 'string' &&
    Object.values(ROLES).includes(dato.rol)
  );
}

/**
 * Prepara un nombre para compararlo sin distinguir mayúsculas.
 *
 * @param {string} nombre - El nombre.
 * @returns {string} El nombre en minúsculas.
 */
function normalizar(nombre) {
  return nombre.toLocaleLowerCase('es');
}

/**
 * Quita el resumen de la contraseña: lo que sale de este módulo no lo lleva.
 *
 * @param {UsuarioGuardado} usuario - El usuario guardado.
 * @returns {Usuario} El usuario sin el resumen.
 */
function sinResumen({ nombre, correo, rol }) {
  return { nombre, correo, rol };
}

/**
 * Lee los usuarios guardados, descartando las entradas estropeadas.
 *
 * @param {Storage} almacen - Dónde están los usuarios (normalmente, `localStorage`).
 * @returns {UsuarioGuardado[]} Los usuarios válidos.
 */
function leerUsuarios(almacen) {
  return leerJSON(almacen, CLAVE_USUARIOS, []).filter(esUsuarioValido);
}

/**
 * Busca un usuario guardado por su nombre, sin distinguir mayúsculas.
 *
 * @param {UsuarioGuardado[]} usuarios - La lista donde buscar.
 * @param {string} nombre - El nombre buscado.
 * @returns {UsuarioGuardado|undefined} El usuario, o `undefined` si no está.
 */
function buscar(usuarios, nombre) {
  const buscado = normalizar(nombre);
  return usuarios.find((usuario) => normalizar(usuario.nombre) === buscado);
}

/**
 * Devuelve todos los usuarios, sin el resumen de su contraseña.
 *
 * @param {Storage} almacen - Dónde están los usuarios.
 * @returns {Usuario[]} La lista de usuarios (vacía si no hay ninguno o si los datos están estropeados).
 * @example
 * listarUsuarios(localStorage); // → [{ nombre: 'ana', correo: 'ana@ejemplo.es', rol: 'administrador' }]
 */
export function listarUsuarios(almacen) {
  return leerUsuarios(almacen).map(sinResumen);
}

/**
 * Comprueba si un nombre de usuario ya está ocupado, sin distinguir mayúsculas.
 *
 * @param {Storage} almacen - Dónde están los usuarios.
 * @param {string} nombre - El nombre que se quiere usar.
 * @returns {boolean} `true` si ya hay un usuario con ese nombre.
 * @example
 * nombreOcupado(localStorage, 'ANA'); // → true si existe «ana»
 */
export function nombreOcupado(almacen, nombre) {
  return buscar(leerUsuarios(almacen), nombre) !== undefined;
}

/**
 * Registra un usuario nuevo. Guarda el resumen de la contraseña, nunca la contraseña. Si es el
 * primero, será administrador.
 *
 * @param {Storage} almacen - Dónde se guardan los usuarios.
 * @param {{ nombre: string, correo: string, clave: string }} datos - Los datos del formulario.
 * @param {function(string): Promise<string>} [resumir] - Cómo calcular el resumen de la
 *   contraseña. Por defecto, `resumirClave`.
 * @returns {Promise<Usuario>} El usuario registrado, sin el resumen.
 * @throws {Error} Si el nombre ya está ocupado o si no se ha podido guardar.
 * @example
 * const ana = await registrarUsuario(localStorage, {
 *   nombre: 'ana',
 *   correo: 'ana@ejemplo.es',
 *   clave: 'Nebulosa42',
 * });
 * ana.rol; // → 'administrador' si es la primera
 */
export async function registrarUsuario(almacen, { nombre, correo, clave }, resumir = resumirClave) {
  if (nombreOcupado(almacen, nombre)) {
    throw new Error('Ese nombre ya está en uso.');
  }

  const resumen = await resumir(clave);

  // Se vuelve a leer después de esperar al resumen, por si la lista ha cambiado entretanto
  const usuarios = leerUsuarios(almacen);
  if (buscar(usuarios, nombre) !== undefined) {
    throw new Error('Ese nombre ya está en uso.');
  }

  const rol = usuarios.length === 0 ? ROLES.ADMINISTRADOR : ROLES.USUARIO;
  const nuevo = { nombre, correo, resumen, rol };

  if (!guardarJSON(almacen, CLAVE_USUARIOS, [...usuarios, nuevo])) {
    throw new Error(
      'No se ha podido guardar el usuario: el almacenamiento está lleno o bloqueado.',
    );
  }
  return sinResumen(nuevo);
}

/**
 * Comprueba un nombre y una contraseña.
 *
 * @param {Storage} almacen - Dónde están los usuarios.
 * @param {string} nombre - El nombre escrito (sin distinguir mayúsculas).
 * @param {string} clave - La contraseña escrita.
 * @param {function(string): Promise<string>} [resumir] - Cómo calcular el resumen. Por defecto,
 *   `resumirClave`.
 * @returns {Promise<Usuario|null>} El usuario si la contraseña es correcta; `null` si el usuario no
 *   existe o la contraseña no coincide.
 * @example
 * await comprobarCredenciales(localStorage, 'ana', 'Nebulosa42'); // → { nombre: 'ana', … }
 * await comprobarCredenciales(localStorage, 'ana', 'otra'); // → null
 */
export async function comprobarCredenciales(almacen, nombre, clave, resumir = resumirClave) {
  const usuario = buscar(leerUsuarios(almacen), nombre);
  if (usuario === undefined) {
    return null;
  }
  const resumen = await resumir(clave);
  return resumen === usuario.resumen ? sinResumen(usuario) : null;
}
