/**
 * Validación en tiempo real, común a los tres formularios (inicio de sesión, registro y ficha).
 *
 * **Cuándo** se valida cada campo:
 * - por primera vez, al **salir** de él (`blur`). Así no sale un error mientras alguien empieza a
 *   escribir;
 * - desde entonces, con **cada cambio** (`input` y `change`), para que el error desaparezca en
 *   cuanto se corrige;
 * - las reglas que dependen de otro campo (repetir la contraseña) se revalidan cuando cambia ese
 *   otro campo;
 * - al enviar, todos: si hay errores, se avisa y el foco va al primero.
 *
 * **De dónde** sale el mensaje de cada campo, en este orden (el primero que falla gana):
 * 1. `validity`, la validación del propio navegador con los atributos del HTML (`required`,
 *    `type="email"`, `min`, `max`…). El texto lo pone el HTML: `data-vacio` para un campo
 *    obligatorio vacío y `data-invalido` para lo demás;
 * 2. el validador de formato que dice su atributo `data-validar`, del objeto `validadores`;
 * 3. una regla propia de la página (un nombre ya ocupado, dos contraseñas que no coinciden).
 *
 * **Qué se ve:** el mensaje va a la caja de error del campo (la que tiene la clase
 * `invalid-feedback` entre las de su `aria-describedby`) y a `setCustomValidity`, y el campo
 * recibe `aria-invalid` y la clase `is-invalid` de Bootstrap (con `mostrarEstadoCampo`).
 *
 * **Los oyentes**, todos en el formulario y no en cada campo (delegación): así sirven también
 * para los campos que se creen después, como las imágenes de la ficha. `blur` no sube por el
 * árbol, así que el formulario lo escucha en la fase de **captura**, que baja desde `document`
 * hasta el campo y sí pasa por él.
 *
 * Los campos desactivados (`disabled`) no se validan ni se envían: el navegador los deja fuera
 * (`willValidate` es `false`), como el campo condicional de la ficha cuando no se ve.
 *
 * @module validacion
 */

import { validadores } from './validadores.js';
import { mostrarEstadoCampo } from './formularios.js';
import { lanzarAviso } from './avisos.js';

/** Las propiedades de `validity` que indican un error que no es «vacío». */
const ERRORES_DEL_NAVEGADOR = [
  'badInput',
  'typeMismatch',
  'patternMismatch',
  'tooShort',
  'tooLong',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
];

/** Mensajes si al HTML le falta `data-vacio` o `data-invalido`. */
const MENSAJE_VACIO = 'Rellena este campo.';

/**
 * Comprueba si un elemento es un campo que se valida: un `input`, `select` o `textarea` con
 * nombre que el navegador validaría (no desactivado).
 *
 * @param {Element} elemento - El elemento.
 * @returns {boolean} `true` si hay que validarlo.
 */
function esValidable(elemento) {
  return (
    elemento.matches('input, select, textarea') && elemento.name !== '' && elemento.willValidate
  );
}

/**
 * Busca la caja de error de un campo entre las de su `aria-describedby`: la que tiene la clase
 * `invalid-feedback`. Un campo puede estar descrito por más cosas (una ayuda, una lista de
 * requisitos), y por eso no basta con la primera.
 *
 * @param {HTMLInputElement} campo - El campo.
 * @returns {HTMLElement} Su caja de error.
 * @throws {Error} Si el campo no tiene caja de error: es un fallo del HTML.
 */
function cajaDeError(campo) {
  const ids = (campo.getAttribute('aria-describedby') ?? '').split(/\s+/u);
  const caja = ids
    .map((id) => campo.ownerDocument.getElementById(id))
    .find((elemento) => elemento?.classList.contains('invalid-feedback'));
  if (caja === undefined) {
    throw new Error(`El campo «${campo.name}» no tiene una caja de error en su aria-describedby.`);
  }
  return caja;
}

/**
 * Calcula el mensaje de error de un campo: primero `validity`, después `data-validar` y por
 * último la regla de la página.
 *
 * @param {HTMLInputElement} campo - El campo.
 * @param {Object<string, function(HTMLInputElement): string>} reglas - Las reglas de la página.
 * @returns {string} El mensaje, o `''` si el campo es válido.
 * @throws {Error} Si `data-validar` nombra un validador que no existe.
 */
export function mensajeDeError(campo, reglas = {}) {
  // Sin esto, el error que se le puso la vez anterior seguiría marcando el campo como inválido
  campo.setCustomValidity('');

  if (campo.validity.valueMissing) {
    return campo.dataset.vacio ?? MENSAJE_VACIO;
  }
  if (ERRORES_DEL_NAVEGADOR.some((error) => campo.validity[error])) {
    return campo.dataset.invalido ?? campo.validationMessage;
  }

  // Un campo opcional vacío no se comprueba: el formato solo importa si se escribe algo
  const nombreValidador = campo.dataset.validar;
  if (nombreValidador !== undefined && campo.value !== '') {
    const validador = validadores[nombreValidador];
    if (validador === undefined) {
      throw new Error(`No hay ningún validador «${nombreValidador}» (data-validar).`);
    }
    const error = validador(campo.value);
    if (error !== '') {
      return error;
    }
  }

  const regla = reglas[campo.name];
  return regla === undefined ? '' : regla(campo);
}

/**
 * Lo que devuelve {@link activarValidacion}.
 *
 * @typedef {object} Validacion
 * @property {function(HTMLInputElement): boolean} validarCampo - Valida un campo y muestra su
 *   estado. Devuelve `true` si es válido.
 * @property {function(): boolean} validarFormulario - Valida todos los campos. Si hay errores,
 *   avisa, lleva el foco al primero y devuelve `false`.
 */

/**
 * Activa la validación en tiempo real de un formulario.
 *
 * @param {HTMLFormElement} formulario - El formulario.
 * @param {object} [opciones] - Lo propio de cada formulario.
 * @param {Object<string, function(HTMLInputElement): string>} [opciones.reglas] - Reglas propias
 *   de la página, por el nombre del campo. Reciben el campo y devuelven el mensaje o `''`.
 * @param {Object<string, string[]>} [opciones.dependencias] - Qué campos se revalidan cuando
 *   cambia otro: `{ clave: ['repetir'] }`.
 * @param {string} [opciones.avisoErrores] - El aviso al enviar con errores.
 * @returns {Validacion} Para validar un campo o todo el formulario desde la página.
 * @listens blur
 * @listens input
 * @listens change
 * @fires aviso
 * @example
 * const validacion = activarValidacion(formulario, {
 *   reglas: { repetir: (campo) => validarRepetirClave(campo.value, campos.clave.value) },
 *   dependencias: { clave: ['repetir'] },
 * });
 * formulario.addEventListener('submit', (evento) => {
 *   evento.preventDefault();
 *   if (!validacion.validarFormulario()) {
 *     return;
 *   }
 *   // …guardar
 * });
 */
export function activarValidacion(
  formulario,
  { reglas = {}, dependencias = {}, avisoErrores = 'Revisa los campos marcados en rojo.' } = {},
) {
  // El navegador no enseña sus propios globos de error: los mensajes los pone este módulo
  formulario.noValidate = true;

  // Los campos que ya se han validado alguna vez (al salir o al enviar): desde entonces, con
  // cada cambio. Un WeakSet no impide que se borre un campo que se quita del formulario.
  const tocados = new WeakSet();

  /**
   * Los campos que van juntos: todos los botones de opción con el mismo nombre, o solo el campo.
   *
   * @param {HTMLInputElement} campo - El campo.
   * @returns {HTMLInputElement[]} El grupo.
   */
  function grupoDe(campo) {
    if (campo.type !== 'radio') {
      return [campo];
    }
    return [...formulario.elements].filter(
      (elemento) => elemento.type === 'radio' && elemento.name === campo.name,
    );
  }

  /**
   * Valida un campo (o su grupo de botones de opción) y muestra su estado.
   *
   * @param {HTMLInputElement} campo - El campo.
   * @returns {boolean} `true` si es válido.
   */
  function validarCampo(campo) {
    const grupo = grupoDe(campo);
    // En un grupo de botones de opción basta con que uno lleve `required` y sus mensajes: se
    // valida con ese, sea cual sea el botón del que se ha salido
    const referencia = grupo.find((miembro) => miembro.required) ?? campo;
    const mensaje = mensajeDeError(referencia, reglas);
    const caja = cajaDeError(referencia);
    for (const miembro of grupo) {
      tocados.add(miembro);
      mostrarEstadoCampo(miembro, caja, mensaje);
    }
    return mensaje === '';
  }

  function validarFormulario() {
    let primeroConError = null;
    const radiosVistos = new Set();
    for (const campo of [...formulario.elements].filter(esValidable)) {
      // Un grupo de botones de opción se valida una vez, no una por botón
      if (campo.type === 'radio') {
        if (radiosVistos.has(campo.name)) {
          continue;
        }
        radiosVistos.add(campo.name);
      }
      if (!validarCampo(campo) && primeroConError === null) {
        primeroConError = campo;
      }
    }

    if (primeroConError === null) {
      return true;
    }
    lanzarAviso(formulario, avisoErrores, 'error');
    primeroConError.focus();
    return false;
  }

  // Captura (tercer argumento `true`): `blur` no sube, pero sí baja hasta el campo
  formulario.addEventListener(
    'blur',
    (evento) => {
      if (esValidable(evento.target)) {
        validarCampo(evento.target);
      }
    },
    true,
  );

  /**
   * Con cada cambio: revalida el campo si ya se había tocado y los que dependen de él.
   *
   * @param {Event} evento - El `input` o el `change`.
   */
  function alCambiar(evento) {
    const campo = evento.target;
    if (!esValidable(campo)) {
      return;
    }
    if (tocados.has(campo)) {
      validarCampo(campo);
    }
    for (const nombre of dependencias[campo.name] ?? []) {
      const dependiente = formulario.elements.namedItem(nombre);
      if (dependiente !== null && tocados.has(dependiente) && esValidable(dependiente)) {
        validarCampo(dependiente);
      }
    }
  }
  formulario.addEventListener('input', alCambiar);
  formulario.addEventListener('change', alCambiar);

  return { validarCampo, validarFormulario };
}
