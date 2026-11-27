/**
 * Validadores del registro de usuarios y de la captura.
 *
 * Son funciones puras: no tocan el DOM ni el almacenamiento, solo reciben un texto y dicen si
 * es válido. Cada validador devuelve el mensaje de error que verá la persona, o un texto vacío
 * (`''`) si el valor es correcto. Así los formularios podrán pasar ese mensaje directamente a
 * `setCustomValidity`, que funciona igual: un texto vacío significa «sin error».
 *
 * Los validadores de formato se reúnen al final en el objeto {@link validadores}, para que un
 * formulario elija el suyo por el atributo `data-validar` del campo.
 *
 * Que el nombre de usuario no esté ocupado no se comprueba aquí: eso necesita los usuarios
 * guardados y lo hace el módulo de usuarios. Que un campo obligatorio no quede vacío tampoco:
 * eso lo dice el navegador con `required` y `validity.valueMissing`.
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

// ---------------------------------------------------------------------------------------------
// Validadores de la captura
// ---------------------------------------------------------------------------------------------

/** Latitud máxima, en grados (los polos). */
export const LATITUD_MAXIMA = 90;

/** Longitud máxima, en grados (el antimeridiano). */
export const LONGITUD_MAXIMA = 180;

/**
 * Coordenadas GPS en grados decimales: `36.7213, -4.4214`.
 * - `(-?\d{1,3}(?:\.\d+)?)`: un signo menos opcional, de 1 a 3 cifras y, si hay decimales, un
 *   punto y al menos una cifra. Los paréntesis guardan el número para comprobar su rango después.
 * - `, ?`: una coma y, si se quiere, un espacio.
 *
 * La regex solo mira el formato: `120, 300` lo cumple. Los rangos se comprueban con código.
 */
const REGEX_GPS = /^(-?\d{1,3}(?:\.\d+)?), ?(-?\d{1,3}(?:\.\d+)?)$/u;

/**
 * URL de una imagen: `http://` o `https://`, un dominio con al menos un punto y, si se quiere,
 * una ruta. Sin espacios en ningún sitio.
 * - `https?`: la `s` es opcional.
 * - `[^\s/?#]+\.[^\s/?#]+`: el dominio (`ejemplo.es`), que acaba donde empieza la ruta.
 * - `(?:[/?#]\S*)?`: la ruta, la consulta o el fragmento, opcionales.
 * - `i`: `HTTPS://` también vale.
 */
const REGEX_URL_IMAGEN = /^https?:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/iu;

/**
 * Código de catálogo de un objeto del espacio:
 * - `M[1-9]\d{0,2}`: catálogo Messier, una M y un número sin ceros delante (`M1`, `M42`, `M110`);
 * - `(?:NGC|IC) [1-9]\d{0,3}`: New General Catalogue o Index Catalogue, un espacio y un número de
 *   hasta cuatro cifras (`NGC 1976`, `IC 434`).
 */
const REGEX_CATALOGO = /^(?:M[1-9]\d{0,2}|(?:NGC|IC) [1-9]\d{0,3})$/u;

/**
 * Ascensión recta (la «longitud» del cielo), en horas, minutos y segundos: `05h 35m 17s`.
 * - `(?:[01]\d|2[0-3])h`: las horas, de 00 a 23.
 * - `[0-5]\dm` y `[0-5]\d(?:\.\d+)?s`: minutos y segundos de 00 a 59 (los segundos admiten
 *   decimales, como `17.3s`).
 */
const REGEX_ASCENSION_RECTA = /^(?:[01]\d|2[0-3])h [0-5]\dm [0-5]\d(?:\.\d+)?s$/u;

/**
 * Declinación (la «latitud» del cielo), en grados, minutos y segundos de arco: `-05° 23′ 28″`.
 * - `[+-]?`: el signo, opcional.
 * - `[0-8]\d° [0-5]\d[′'] [0-5]\d(?:\.\d+)?[″"]`: de 00° a 89° con sus minutos y segundos;
 * - `|90° 00[′'] 00[″"]`: o exactamente 90° (un polo del cielo).
 * - `[′']` y `[″"]`: además de los símbolos de minuto y segundo, valen el apóstrofo y las comillas
 *   del teclado, que se pueden escribir sin buscar el símbolo.
 */
const REGEX_DECLINACION =
  /^[+-]?(?:[0-8]\d° [0-5]\d[′'] [0-5]\d(?:\.\d+)?[″"]|90° 00[′'] 00[″"])$/u;

/**
 * Código de observatorio: `OBS-`, cuatro cifras, un guion y un dígito de control (`OBS-4821-7`).
 * Los paréntesis guardan las cuatro cifras y el dígito de control para comprobarlo con código.
 */
const REGEX_OBSERVATORIO = /^OBS-(\d{4})-(\d)$/u;

/** Pesos por los que se multiplica cada cifra del código de observatorio, en orden. */
const PESOS_OBSERVATORIO = [3, 1, 3, 1];

/**
 * Valida las coordenadas GPS: primero el formato con la regex y después, con código, que la
 * latitud esté entre −90 y 90 y la longitud entre −180 y 180.
 *
 * @param {string} coordenadas - Las coordenadas escritas.
 * @returns {string} El mensaje de error, o `''` si son válidas.
 * @example
 * validarGps('36.7213, -4.4214'); // → ''
 * validarGps('36,7213 -4,4214'); // → 'Usa el formato 36.7213, -4.4214.'
 * validarGps('91, 0'); // → 'La latitud va de −90 a 90 y la longitud de −180 a 180.'
 */
export function validarGps(coordenadas) {
  const partes = REGEX_GPS.exec(coordenadas);
  if (partes === null) {
    return 'Usa el formato 36.7213, -4.4214.';
  }
  // partes[1] y partes[2] son los textos que guardaron los paréntesis de la regex
  const latitud = Number(partes[1]);
  const longitud = Number(partes[2]);
  const dentroDeRango =
    Math.abs(latitud) <= LATITUD_MAXIMA && Math.abs(longitud) <= LONGITUD_MAXIMA;
  return dentroDeRango ? '' : 'La latitud va de −90 a 90 y la longitud de −180 a 180.';
}

/**
 * Valida la URL de una imagen.
 *
 * @param {string} url - La URL escrita.
 * @returns {string} El mensaje de error, o `''` si es válida.
 * @example
 * validarUrlImagen('https://ejemplo.es/aurora.jpg'); // → ''
 * validarUrlImagen('ejemplo.es/aurora.jpg'); // → 'Escribe una URL que empiece por http:// o https://.'
 */
export function validarUrlImagen(url) {
  return REGEX_URL_IMAGEN.test(url) ? '' : 'Escribe una URL que empiece por http:// o https://.';
}

/**
 * Valida el código de catálogo de un objeto del espacio.
 *
 * @param {string} codigo - El código escrito.
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarCatalogo('NGC 1976'); // → ''
 * validarCatalogo('NGC1976'); // → 'Usa un código como M42, NGC 1976 o IC 434.'
 */
export function validarCatalogo(codigo) {
  return REGEX_CATALOGO.test(codigo) ? '' : 'Usa un código como M42, NGC 1976 o IC 434.';
}

/**
 * Valida la ascensión recta.
 *
 * @param {string} ascension - La ascensión recta escrita.
 * @returns {string} El mensaje de error, o `''` si es válida.
 * @example
 * validarAscensionRecta('05h 35m 17s'); // → ''
 * validarAscensionRecta('24h 00m 00s'); // → 'Usa el formato 05h 35m 17s.'
 */
export function validarAscensionRecta(ascension) {
  return REGEX_ASCENSION_RECTA.test(ascension) ? '' : 'Usa el formato 05h 35m 17s.';
}

/**
 * Valida la declinación.
 *
 * @param {string} declinacion - La declinación escrita.
 * @returns {string} El mensaje de error, o `''` si es válida.
 * @example
 * validarDeclinacion('-05° 23′ 28″'); // → ''
 * validarDeclinacion('-95° 00′ 00″'); // → 'Usa el formato -05° 23′ 28″.'
 */
export function validarDeclinacion(declinacion) {
  return REGEX_DECLINACION.test(declinacion) ? '' : 'Usa el formato -05° 23′ 28″.';
}

/**
 * Calcula el dígito de control de un código de observatorio: cada cifra se multiplica por su
 * peso (3, 1, 3 y 1), se suman los resultados y se queda la última cifra (el resto de dividir
 * entre 10). Funciona como la letra del DNI: si alguien se equivoca en una cifra al copiar el
 * código, el dígito de control deja de cuadrar.
 *
 * @param {string} cifras - Las cuatro cifras del código (`'4821'`).
 * @returns {number} El dígito de control, de 0 a 9.
 * @example
 * digitoControlObservatorio('4821'); // → 7, porque 4·3 + 8·1 + 2·3 + 1·1 = 27
 */
export function digitoControlObservatorio(cifras) {
  let suma = 0;
  [...cifras].forEach((cifra, posicion) => {
    suma += Number(cifra) * PESOS_OBSERVATORIO[posicion];
  });
  return suma % 10;
}

/**
 * Valida el código de observatorio, que es opcional: vacío es válido. Si se escribe, primero se
 * comprueba el formato con la regex y después, con código, el dígito de control.
 *
 * @param {string} codigo - El código escrito.
 * @returns {string} El mensaje de error, o `''` si es válido o está vacío.
 * @example
 * validarObservatorio('OBS-4821-7'); // → ''
 * validarObservatorio('OBS-482-7'); // → 'Usa el formato OBS-4821-7.'
 * validarObservatorio('OBS-4821-3'); // → 'El dígito de control no es correcto.'
 */
export function validarObservatorio(codigo) {
  if (codigo === '') {
    return '';
  }
  const partes = REGEX_OBSERVATORIO.exec(codigo);
  if (partes === null) {
    return 'Usa el formato OBS-4821-7.';
  }
  const [, cifras, control] = partes;
  return digitoControlObservatorio(cifras) === Number(control)
    ? ''
    : 'El dígito de control no es correcto.';
}

/**
 * Todos los validadores de formato, por el nombre que llevará el atributo `data-validar` de su
 * campo. Un formulario hace `validadores[campo.dataset.validar](campo.value)` y no necesita
 * saber qué validador es: para añadir uno nuevo basta con escribirlo y ponerlo aquí.
 *
 * `validarRepetirClave` no está porque necesita el valor de otro campo además del suyo.
 *
 * @type {Object<string, function(string): string>}
 * @example
 * // <input name="gps" data-validar="gps">
 * validadores.gps('36.7213, -4.4214'); // → ''
 */
export const validadores = {
  nombreUsuario: validarNombreUsuario,
  correo: validarCorreo,
  clave: validarClave,
  gps: validarGps,
  urlImagen: validarUrlImagen,
  catalogo: validarCatalogo,
  ascensionRecta: validarAscensionRecta,
  declinacion: validarDeclinacion,
  observatorio: validarObservatorio,
};
