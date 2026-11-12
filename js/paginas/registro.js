/**
 * Página de registro (`registro.html`).
 *
 * HTML que necesita:
 * - un formulario `#form-registro` con los campos `usuario`, `correo`, `clave`, `repetir` y
 *   `acepto` (casilla), y un botón de envío;
 * - para cada campo, su caja de error `#registro-<campo>-error`;
 * - la lista `#registro-clave-requisitos`, con un `<li data-requisito>` por requisito
 *   (`longitud`, `minuscula`, `mayuscula`, `cifra`);
 * - la región de avisos `#avisos`.
 *
 * Qué hace:
 * - mientras se escribe la contraseña, marca los requisitos que cumple (`data-cumple`);
 * - al enviar, valida todos los campos; si hay errores, los marca, avisa y lleva el foco al primero;
 * - si todo está bien, registra al usuario (el primero será administrador), abre su sesión, deja
 *   un aviso para la página siguiente y va al listado;
 * - mientras se calcula el resumen de la contraseña, el formulario está «enviando» y un segundo
 *   envío (otro clic o Intro) no hace nada.
 *
 * Recibe lo que necesita en lugar de usar `localStorage`, `sessionStorage` o `location`
 * directamente: así los tests de integración pueden sustituirlo.
 *
 * @module paginas/registro
 */

import {
  validarNombreUsuario,
  validarCorreo,
  validarClave,
  validarRepetirClave,
  requisitosClave,
} from '../validadores.js';
import { nombreOcupado, registrarUsuario, ROLES } from '../usuarios.js';
import { iniciarSesion } from '../sesion.js';
import {
  escucharAvisos,
  lanzarAviso,
  guardarAvisoPendiente,
  mostrarAvisoPendiente,
} from '../avisos.js';
import { resumirClave } from '../clave.js';
import { mostrarEstadoCampo, ponerEnviando } from '../formularios.js';

/** Adónde se va después de registrarse. */
export const PAGINA_TRAS_REGISTRO = 'listado.html';

/**
 * Inicia la página de registro.
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {Storage} dependencias.almacenUsuarios - Dónde están los usuarios (`localStorage`).
 * @param {Storage} dependencias.almacenSesion - Dónde van la sesión y los avisos pendientes
 *   (`sessionStorage`).
 * @param {function(string): void} dependencias.navegar - Cómo ir a otra página.
 * @param {function(string): Promise<string>} [dependencias.resumir] - Cómo calcular el resumen de
 *   la contraseña. Por defecto, `resumirClave`.
 * @returns {void}
 * @listens submit
 * @listens input
 * @listens change
 * @fires aviso
 */
export function iniciarRegistro({
  documento,
  almacenUsuarios,
  almacenSesion,
  navegar,
  resumir = resumirClave,
}) {
  const formulario = documento.querySelector('#form-registro');
  const campos = formulario.elements;
  const boton = formulario.querySelector('button[type="submit"]');
  const textoBoton = boton.textContent;
  const requisitos = documento.querySelectorAll('#registro-clave-requisitos [data-requisito]');

  escucharAvisos(documento, documento.querySelector('#avisos'));
  mostrarAvisoPendiente(almacenSesion, documento);

  // La regla de cada campo: devuelve el mensaje de error, o '' si el valor es válido
  const reglas = {
    usuario: () => {
      const error = validarNombreUsuario(campos.usuario.value);
      if (error !== '') {
        return error;
      }
      return nombreOcupado(almacenUsuarios, campos.usuario.value)
        ? 'Ese nombre ya está en uso.'
        : '';
    },
    correo: () => validarCorreo(campos.correo.value.trim()),
    clave: () => validarClave(campos.clave.value),
    // Vacío no «coincide» con una contraseña vacía: hay que repetirla
    repetir: () =>
      campos.repetir.value === ''
        ? 'Repite la contraseña.'
        : validarRepetirClave(campos.repetir.value, campos.clave.value),
    acepto: () => (campos.acepto.checked ? '' : 'Tienes que aceptar las condiciones.'),
  };

  /**
   * Valida un campo y muestra su estado: mensaje en su caja de error, `setCustomValidity`,
   * `aria-invalid` y la clase `is-invalid` de Bootstrap.
   *
   * @param {string} nombre - El nombre del campo.
   * @returns {boolean} `true` si el campo es válido.
   */
  function validarCampo(nombre) {
    const caja = documento.querySelector(`#registro-${nombre}-error`);
    return mostrarEstadoCampo(campos[nombre], caja, reglas[nombre]());
  }

  /** Marca en la lista los requisitos que cumple la contraseña escrita. */
  function marcarRequisitos() {
    const cumplidos = requisitosClave(campos.clave.value);
    for (const requisito of requisitos) {
      requisito.dataset.cumple = String(cumplidos[requisito.dataset.requisito]);
    }
  }

  const textosBoton = { enviando: 'Creando tu cuenta…', normal: textoBoton };

  // Delegación: un solo oyente en el formulario para todos sus campos
  const alCambiar = (evento) => {
    const nombre = evento.target.name;
    if (nombre === 'clave') {
      marcarRequisitos();
    }
    // Un campo que ya está marcado como erróneo se revisa con cada cambio, para quitar el error
    if (evento.target.classList.contains('is-invalid')) {
      validarCampo(nombre);
    }
    // «Repetir» depende de la contraseña: si estaba mal, se revisa al cambiar la contraseña
    if (nombre === 'clave' && campos.repetir.classList.contains('is-invalid')) {
      validarCampo('repetir');
    }
  };
  formulario.addEventListener('input', alCambiar);
  formulario.addEventListener('change', alCambiar);

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
      lanzarAviso(formulario, 'Revisa los campos marcados en rojo.', 'error');
      campos[primeroConError].focus();
      return;
    }

    enviando = true;
    ponerEnviando(formulario, boton, true, textosBoton);
    try {
      const usuario = await registrarUsuario(
        almacenUsuarios,
        {
          nombre: campos.usuario.value,
          correo: campos.correo.value.trim(),
          clave: campos.clave.value,
        },
        resumir,
      );
      iniciarSesion(almacenSesion, usuario);
      const extra =
        usuario.rol === ROLES.ADMINISTRADOR
          ? ' Eres la primera persona registrada: administras Horizonte.'
          : '';
      guardarAvisoPendiente(
        almacenSesion,
        `Te has registrado. ¡Te damos la bienvenida, ${usuario.nombre}!${extra}`,
        'exito',
      );
      navegar(PAGINA_TRAS_REGISTRO);
    } catch (error) {
      // El nombre se ocupó entretanto o el almacenamiento está lleno
      lanzarAviso(formulario, error.message, 'error');
      enviando = false;
      ponerEnviando(formulario, boton, false, textosBoton);
    }
  });
}
