/**
 * Validadores del formulario de registro.
 *
 * Son funciones puras: no tocan el DOM ni el almacenamiento, solo reciben un texto y dicen si
 * es válido. Cada validador devuelve el mensaje de error que verá la persona, o un texto vacío
 * (`''`) si el valor es correcto. Así los formularios podrán pasar ese mensaje directamente a
 * `setCustomValidity`, que funciona igual: un texto vacío significa «sin error».
 *
 * Que el nombre de usuario no esté ocupado no se comprueba aquí: eso necesita los usuarios
 * guardados y lo hace el módulo de usuarios.
 *
 * @module validadores
 */

/** Longitud mínima de la contraseña. */
export const LONGITUD_MINIMA_CLAVE = 8;

/**
 * Nombre de usuario: de 3 a 20 caracteres, cada uno una letra (con tildes y ñ incluidas),
 * una cifra o un guion bajo.
 * - `^` y `$`: la regla se aplica al texto entero, no a un trozo.
 * - `[\p{L}\d_]`: una letra de cualquier alfabeto (`\p{L}`), una cifra (`\d`) o `_`.
 * - `{3,20}`: entre 3 y 20 de esos caracteres.
 * - `u`: activa Unicode, necesario para que funcione `\p{L}`.
 */
const REGEX_NOMBRE_USUARIO = /^[\p{L}\d_]{3,20}$/u;

/**
 * Correo: algo sin espacios ni @, una @, un dominio sin espacios ni @, un punto y al menos dos
 * letras al final (`.es`, `.com`…). No pretende ser perfecto, sino detectar los errores típicos.
 */
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/u;

/** Al menos una letra minúscula de cualquier alfabeto (`\p{Ll}`: «letter, lowercase»). */
const REGEX_MINUSCULA = /\p{Ll}/u;

/** Al menos una letra mayúscula de cualquier alfabeto (`\p{Lu}`: «letter, uppercase»). */
const REGEX_MAYUSCULA = /\p{Lu}/u;

/** Al menos una cifra. */
const REGEX_CIFRA = /\d/u;

/**
 * Valida el nombre de usuario.
 *
 * @param {string} nombre - El nombre escrito.
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarNombreUsuario('ana_2026'); // → ''
 * validarNombreUsuario('a'); // → 'Usa de 3 a 20 letras, cifras o _.'
 */
export function validarNombreUsuario(nombre) {
  return REGEX_NOMBRE_USUARIO.test(nombre) ? '' : 'Usa de 3 a 20 letras, cifras o _.';
}

/**
 * Valida el correo electrónico.
 *
 * @param {string} correo - El correo escrito.
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarCorreo('ana@ejemplo.es'); // → ''
 * validarCorreo('ana@ejemplo'); // → 'Escribe un correo válido.'
 */
export function validarCorreo(correo) {
  return REGEX_CORREO.test(correo) ? '' : 'Escribe un correo válido.';
}

/**
 * Comprueba qué requisitos cumple una contraseña. Sirve para marcarlos uno a uno mientras se
 * escribe.
 *
 * @typedef {object} RequisitosClave
 * @property {boolean} longitud - Tiene al menos {@link LONGITUD_MINIMA_CLAVE} caracteres.
 * @property {boolean} minuscula - Tiene al menos una letra minúscula.
 * @property {boolean} mayuscula - Tiene al menos una letra mayúscula.
 * @property {boolean} cifra - Tiene al menos una cifra.
 *
 * @param {string} clave - La contraseña escrita.
 * @returns {RequisitosClave} Qué requisitos se cumplen.
 * @example
 * requisitosClave('Orion42');
 * // → { longitud: false, minuscula: true, mayuscula: true, cifra: true }
 */
export function requisitosClave(clave) {
  return {
    // [...clave] cuenta caracteres reales: así una «ñ» o un emoji cuentan como uno
    longitud: [...clave].length >= LONGITUD_MINIMA_CLAVE,
    minuscula: REGEX_MINUSCULA.test(clave),
    mayuscula: REGEX_MAYUSCULA.test(clave),
    cifra: REGEX_CIFRA.test(clave),
  };
}

/**
 * Valida la contraseña: tiene que cumplir todos los requisitos.
 *
 * @param {string} clave - La contraseña escrita.
 * @returns {string} El mensaje de error, o `''` si es válida.
 * @example
 * validarClave('Nebulosa42'); // → ''
 * validarClave('nebulosa'); // → 'La contraseña no cumple todos los requisitos.'
 */
export function validarClave(clave) {
  const cumplidos = Object.values(requisitosClave(clave));
  return cumplidos.every(Boolean) ? '' : 'La contraseña no cumple todos los requisitos.';
}

/**
 * Valida que la contraseña repetida coincida con la primera.
 *
 * @param {string} repetida - La contraseña escrita por segunda vez.
 * @param {string} clave - La contraseña original.
 * @returns {string} El mensaje de error, o `''` si coinciden.
 * @example
 * validarRepetirClave('Nebulosa42', 'Nebulosa42'); // → ''
 */
export function validarRepetirClave(repetida, clave) {
  return repetida === clave ? '' : 'Las contraseñas no coinciden.';
}
