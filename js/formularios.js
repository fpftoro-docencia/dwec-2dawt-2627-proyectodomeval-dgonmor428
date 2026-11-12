/**
 * Utilidades comunes de los formularios: mostrar el estado de un campo y poner el formulario en
 * estado de envío. Las usan todas las páginas con formulario, para que se comporten igual.
 *
 * @module formularios
 */

/**
 * Muestra si un campo es válido o no:
 * - escribe el mensaje en su caja de error (con `textContent`);
 * - se lo pasa a `setCustomValidity` (un texto vacío significa «sin error»);
 * - pone `aria-invalid`, para los lectores de pantalla;
 * - pone o quita la clase `is-invalid` de Bootstrap, que pinta el campo en rojo y muestra la caja.
 *
 * @param {HTMLInputElement} campo - El campo.
 * @param {HTMLElement} caja - Su caja de error (`.invalid-feedback`).
 * @param {string} mensaje - El mensaje de error, o `''` si es válido.
 * @returns {boolean} `true` si el campo es válido.
 * @example
 * mostrarEstadoCampo(campo, caja, 'Escribe un correo válido.'); // → false
 */
export function mostrarEstadoCampo(campo, caja, mensaje) {
  const invalido = mensaje !== '';
  campo.setCustomValidity(mensaje);
  campo.classList.toggle('is-invalid', invalido);
  campo.setAttribute('aria-invalid', String(invalido));
  caja.textContent = mensaje;
  return !invalido;
}

/**
 * Pone un formulario en estado de envío, o lo saca de él: desactiva el botón, cambia su texto y
 * marca el formulario con `aria-busy`.
 *
 * @param {HTMLFormElement} formulario - El formulario.
 * @param {HTMLButtonElement} boton - Su botón de envío.
 * @param {boolean} enviando - `true` para entrar en estado de envío; `false` para salir.
 * @param {{ enviando: string, normal: string }} textos - El texto del botón en cada estado.
 * @returns {void}
 * @example
 * ponerEnviando(formulario, boton, true, { enviando: 'Entrando…', normal: 'Entrar' });
 */
export function ponerEnviando(formulario, boton, enviando, textos) {
  boton.disabled = enviando;
  boton.textContent = enviando ? textos.enviando : textos.normal;
  formulario.toggleAttribute('aria-busy', enviando);
}
