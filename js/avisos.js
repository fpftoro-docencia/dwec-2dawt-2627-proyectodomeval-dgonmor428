/**
 * Sistema de avisos: los mensajes que la aplicación le da a la persona («Te has registrado»,
 * «Contraseña incorrecta»…).
 *
 * Funciona con un **evento propio** llamado `aviso`:
 * 1. Cualquier parte de la página lanza el evento desde el elemento que quiera, con
 *    {@link lanzarAviso}. El evento tiene `bubbles: true`, así que **sube** por el árbol del DOM.
 * 2. Un **único oyente** en `document` ({@link escucharAvisos}) lo recoge, venga de donde venga, y
 *    lo muestra en la región de avisos de la página (la que tiene `role="status"`).
 *
 * Así quien avisa no necesita saber dónde ni cómo se muestran los avisos.
 *
 * También se puede dejar un aviso **guardado para la página siguiente** (por ejemplo, «Te has
 * registrado» al llegar al listado) con {@link guardarAvisoPendiente} y
 * {@link mostrarAvisoPendiente}.
 *
 * @module avisos
 */

import { leerJSON, guardarJSON, borrar } from './almacen.js';

/** Nombre del evento propio. */
export const EVENTO_AVISO = 'aviso';

/** Clave de `sessionStorage` donde espera el aviso para la página siguiente. */
export const CLAVE_AVISO_PENDIENTE = 'horizonte.aviso';

/**
 * Los tipos de aviso y la clase de alerta de Bootstrap que le corresponde a cada uno.
 * Cualquier otro tipo se muestra como `info`.
 */
export const TIPOS_AVISO = Object.freeze({
  exito: 'alert-success',
  error: 'alert-danger',
  advertencia: 'alert-warning',
  info: 'alert-info',
});

/**
 * Lo que lleva el evento `aviso` en su `detail`.
 *
 * @typedef {object} DetalleAviso
 * @property {string} mensaje - El texto del aviso.
 * @property {'exito'|'error'|'advertencia'|'info'} tipo - Su tipo.
 */

/**
 * Lanza el evento `aviso` desde un elemento. Sube hasta `document`, donde lo recoge
 * {@link escucharAvisos}.
 *
 * @param {EventTarget} elemento - Desde dónde se lanza (un formulario, un botón, `document`…).
 * @param {string} mensaje - El texto del aviso.
 * @param {'exito'|'error'|'advertencia'|'info'} [tipo] - Su tipo. Por defecto, `info`.
 * @returns {void}
 * @fires aviso
 * @example
 * lanzarAviso(formulario, 'La contraseña no es correcta.', 'error');
 */
export function lanzarAviso(elemento, mensaje, tipo = 'info') {
  elemento.dispatchEvent(
    new CustomEvent(EVENTO_AVISO, {
      bubbles: true,
      detail: { mensaje, tipo },
    }),
  );
}

/**
 * Crea el elemento de un aviso con métodos del DOM: el mensaje entra con `textContent`, nunca
 * como HTML, y las clases son las de alerta de Bootstrap.
 *
 * @param {Document} documento - El documento donde se crea.
 * @param {DetalleAviso} detalle - El mensaje y el tipo.
 * @returns {HTMLElement} El aviso, listo para añadirlo a la región.
 */
function crearAviso(documento, { mensaje, tipo }) {
  const claseTipo = TIPOS_AVISO[tipo] ?? TIPOS_AVISO.info;

  const aviso = documento.createElement('div');
  aviso.className = `alert ${claseTipo} aviso`;

  const texto = documento.createElement('p');
  texto.className = 'aviso__texto';
  texto.textContent = mensaje;

  const cerrar = documento.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'aviso__cerrar';
  cerrar.textContent = 'Cerrar';
  cerrar.setAttribute('aria-label', 'Cerrar el aviso');

  aviso.append(texto, cerrar);
  return aviso;
}

/**
 * Pone el **único oyente** del evento `aviso` en el documento. Cada aviso sustituye al anterior
 * en la región. El botón «Cerrar» de cada aviso funciona por **delegación**: un solo oyente en
 * la región sirve para todos los avisos que se creen después.
 *
 * @param {Document} documento - El documento de la página.
 * @param {HTMLElement} region - La región de avisos (con `role="status"`).
 * @returns {() => void} Una función que quita los oyentes (útil en los tests).
 * @listens aviso
 * @listens click
 * @example
 * escucharAvisos(document, document.querySelector('#avisos'));
 */
export function escucharAvisos(documento, region) {
  const alAvisar = (evento) => {
    region.replaceChildren(crearAviso(documento, evento.detail));
  };

  const alPulsar = (evento) => {
    if (evento.target.closest('.aviso__cerrar')) {
      region.replaceChildren();
    }
  };

  documento.addEventListener(EVENTO_AVISO, alAvisar);
  region.addEventListener('click', alPulsar);

  return () => {
    documento.removeEventListener(EVENTO_AVISO, alAvisar);
    region.removeEventListener('click', alPulsar);
  };
}

/**
 * Deja un aviso guardado para mostrarlo en la página siguiente.
 *
 * @param {Storage} almacen - Dónde se guarda (normalmente, `sessionStorage`).
 * @param {string} mensaje - El texto del aviso.
 * @param {'exito'|'error'|'advertencia'|'info'} [tipo] - Su tipo. Por defecto, `info`.
 * @returns {boolean} `true` si se ha guardado.
 * @example
 * guardarAvisoPendiente(sessionStorage, 'Te has registrado. ¡Bienvenida!', 'exito');
 */
export function guardarAvisoPendiente(almacen, mensaje, tipo = 'info') {
  return guardarJSON(almacen, CLAVE_AVISO_PENDIENTE, { mensaje, tipo });
}

/**
 * Si hay un aviso guardado, lo lanza desde el elemento indicado y lo borra, para que no se repita
 * al recargar. Si lo guardado está estropeado, lo borra sin mostrar nada.
 *
 * @param {Storage} almacen - Dónde está el aviso guardado.
 * @param {EventTarget} elemento - Desde dónde se lanza (normalmente, `document`).
 * @returns {boolean} `true` si había un aviso y se ha mostrado.
 * @fires aviso
 * @example
 * mostrarAvisoPendiente(sessionStorage, document);
 */
export function mostrarAvisoPendiente(almacen, elemento) {
  const pendiente = leerJSON(almacen, CLAVE_AVISO_PENDIENTE, {});
  borrar(almacen, CLAVE_AVISO_PENDIENTE);

  if (typeof pendiente.mensaje !== 'string' || pendiente.mensaje === '') {
    return false;
  }
  lanzarAviso(elemento, pendiente.mensaje, pendiente.tipo);
  return true;
}
