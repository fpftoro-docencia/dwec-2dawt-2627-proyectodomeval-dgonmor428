/**
 * Página de inicio de sesión (`index.html`).
 *
 * HTML que necesita:
 * - un formulario `#form-entrar` con los campos `usuario` y `clave` y un botón de envío;
 * - para cada campo, su caja de error `#entrar-<campo>-error`;
 * - la región de avisos `#avisos`.
 *
 * Qué hace:
 * - si ya hay una sesión abierta, va directamente al listado;
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
import { mostrarEstadoCampo, ponerEnviando } from '../formularios.js';
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
 * @param {(url: string) => void} dependencias.navegar - Cómo ir a otra página.
 * @param {(clave: string) => Promise<string>} [dependencias.resumir] - Cómo calcular el resumen de
 *   la contraseña. Por defecto, `resumirClave`.
 * @returns {boolean} `false` si ya había sesión y se ha ido al listado; `true` si la página se ha
 *   preparado para entrar.
 * @listens submit
 * @listens input
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

  const reglas = {
    usuario: () => (campos.usuario.value.trim() === '' ? 'Escribe tu nombre de usuario.' : ''),
    clave: () => (campos.clave.value === '' ? 'Escribe tu contraseña.' : ''),
  };

  /**
   * Valida un campo y muestra su estado.
   *
   * @param {string} nombre - El nombre del campo.
   * @returns {boolean} `true` si el campo es válido.
   */
  function validarCampo(nombre) {
    const caja = documento.querySelector(`#entrar-${nombre}-error`);
    return mostrarEstadoCampo(campos[nombre], caja, reglas[nombre]());
  }

  // Un campo marcado como erróneo se revisa al escribir, para quitar el error
  formulario.addEventListener('input', (evento) => {
    if (evento.target.classList.contains('is-invalid')) {
      validarCampo(evento.target.name);
    }
  });

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando) {
      return; // un segundo envío mientras se calcula el resumen no hace nada
    }

    const nombres = Object.keys(reglas);
    const validos = nombres.map(validarCampo);
    const primeroConError = nombres.find((_nombre, posicion) => !validos[posicion]);
    if (primeroConError !== undefined) {
      lanzarAviso(formulario, 'Rellena los campos marcados en rojo.', 'error');
      campos[primeroConError].focus();
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
