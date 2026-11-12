/**
 * Página de inicio de sesión (`index.html`).
 *
 * HTML que necesita:
 * - un formulario `#form-entrar` con los campos `usuario` y `clave` y un botón de envío;
 * - para cada campo, su caja de error `#entrar-<campo>-error`, enlazada con `aria-describedby`,
 *   y su mensaje de campo vacío en `data-vacio`;
 * - la región de avisos `#avisos`.
 *
 * Qué hace:
 * - si ya hay una sesión abierta, va directamente al listado;
 * - valida cada campo al salir de él y desde entonces con cada cambio (`js/validacion.js`);
 * - al enviar, comprueba que los dos campos estén rellenos;
 * - con la contraseña incorrecta (o un usuario que no existe), avisa, vacía la contraseña y le da
 *   el foco; el mensaje no dice cuál de los dos falla, para no dar pistas a quien pruebe nombres;
 * - con los datos correctos, abre la sesión, deja un aviso de bienvenida y va al listado;
 * - mientras se calcula el resumen de la contraseña, el formulario está «enviando» y un segundo
 *   envío (otro clic o Intro) no hace nada.
 *
 * @module paginas/entrar
 */

import { comprobarCredenciales } from '../usuarios.js';
import { iniciarSesion, leerSesion } from '../sesion.js';
import {
  escucharAvisos,
  lanzarAviso,
  guardarAvisoPendiente,
  mostrarAvisoPendiente,
} from '../avisos.js';
import { ponerEnviando } from '../formularios.js';
import { activarValidacion } from '../validacion.js';
import { resumirClave } from '../clave.js';

/** Adónde se va después de entrar (o si ya había sesión). */
export const PAGINA_TRAS_ENTRAR = 'listado.html';

/** Mensaje cuando el usuario o la contraseña no son correctos. */
export const MENSAJE_CREDENCIALES = 'El usuario o la contraseña no son correctos.';

/**
 * Inicia la página de inicio de sesión.
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {Storage} dependencias.almacenUsuarios - Dónde están los usuarios (`localStorage`).
 * @param {Storage} dependencias.almacenSesion - Dónde van la sesión y los avisos pendientes
 *   (`sessionStorage`).
 * @param {function(string): void} dependencias.navegar - Cómo ir a otra página.
 * @param {function(string): Promise<string>} [dependencias.resumir] - Cómo calcular el resumen de
 *   la contraseña. Por defecto, `resumirClave`.
 * @returns {boolean} `false` si ya había sesión y se ha ido al listado; `true` si la página se ha
 *   preparado para entrar.
 * @listens submit
 * @fires aviso
 */
export function iniciarEntrar({
  documento,
  almacenUsuarios,
  almacenSesion,
  navegar,
  resumir = resumirClave,
}) {
  // Con una sesión abierta no tiene sentido volver a entrar
  if (leerSesion(almacenSesion) !== null) {
    navegar(PAGINA_TRAS_ENTRAR);
    return false;
  }

  const formulario = documento.querySelector('#form-entrar');
  const campos = formulario.elements;
  const boton = formulario.querySelector('button[type="submit"]');
  const textosBoton = { enviando: 'Entrando…', normal: boton.textContent };

  escucharAvisos(documento, documento.querySelector('#avisos'));
  mostrarAvisoPendiente(almacenSesion, documento);

  // Que no estén vacíos lo dicen `required` y `data-vacio`; `required` da por relleno un nombre
  // de solo espacios, así que eso lo comprueba una regla
  const validacion = activarValidacion(formulario, {
    reglas: {
      usuario: (campo) => (campo.value.trim() === '' ? campo.dataset.vacio : ''),
    },
    avisoErrores: 'Rellena los campos marcados en rojo.',
  });

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando) {
      return; // un segundo envío mientras se calcula el resumen no hace nada
    }

    // Valida los dos campos; si hay errores, avisa y lleva el foco al primero
    if (!validacion.validarFormulario()) {
      return;
    }

    enviando = true;
    ponerEnviando(formulario, boton, true, textosBoton);
    const usuario = await comprobarCredenciales(
      almacenUsuarios,
      campos.usuario.value.trim(),
      campos.clave.value,
      resumir,
    );

    if (usuario === null) {
      lanzarAviso(formulario, MENSAJE_CREDENCIALES, 'error');
      campos.clave.value = '';
      campos.clave.focus();
      enviando = false;
      ponerEnviando(formulario, boton, false, textosBoton);
      return;
    }

    iniciarSesion(almacenSesion, usuario);
    guardarAvisoPendiente(almacenSesion, `Hola de nuevo, ${usuario.nombre}.`, 'exito');
    navegar(PAGINA_TRAS_ENTRAR);
  });

  return true;
}
