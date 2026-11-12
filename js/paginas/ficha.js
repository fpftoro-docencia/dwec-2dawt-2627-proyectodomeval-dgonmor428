/**
 * Página de la ficha de una captura (`ficha.html`): los campos y el campo condicional.
 *
 * HTML que necesita:
 * - un formulario `#form-ficha` con los campos de la captura (`titulo`, `categoria`, `fecha`,
 *   `lugar`, `gps`, `altitud`, `condiciones`, `equipo` y `observatorio`), cada uno con su caja de
 *   error enlazada con `aria-describedby` y sus mensajes en `data-vacio`, `data-invalido` y
 *   `data-validar` (los lee `js/validacion.js`);
 * - el campo condicional `#ficha-espacio`, un `<fieldset hidden disabled>` con `catalogo`,
 *   `ascension` y `declinacion`.
 *
 * Qué hace:
 * - pone el `max` de la fecha: ahora mismo, para que no se pueda guardar una captura del futuro.
 *   Lo pone el código porque el HTML no sabe qué día es hoy;
 * - muestra **y activa** los datos del espacio solo si la categoría es «Espacio». `hidden` lo
 *   oculta, y `disabled` hace que no se valide ni se envíe: un campo oculto pero activo seguiría
 *   siendo obligatorio y no dejaría guardar una captura de paisaje;
 * - valida cada campo en tiempo real y todos al enviar (`js/validacion.js`).
 *
 * Guardar y editar la captura llegan en la tarjeta siguiente.
 *
 * @module paginas/ficha
 */

import { activarValidacion } from '../validacion.js';
import { mostrarEstadoCampo } from '../formularios.js';
import { lanzarAviso } from '../avisos.js';

/** La categoría que muestra los datos del espacio. */
export const CATEGORIA_ESPACIO = 'espacio';

/**
 * Escribe una fecha en el formato de un `<input type="datetime-local">`: `AAAA-MM-DDTHH:MM`, en
 * la hora local (la del reloj de quien usa la web, no la de Greenwich).
 *
 * @param {Date} fecha - La fecha.
 * @returns {string} La fecha en ese formato.
 * @example
 * fechaLocal(new Date(2026, 10, 5, 9, 7)); // → '2026-11-05T09:07'
 */
export function fechaLocal(fecha) {
  // padStart rellena con ceros por delante: 9 → '09'
  const dosCifras = (numero) => String(numero).padStart(2, '0');
  const dia = [fecha.getFullYear(), dosCifras(fecha.getMonth() + 1), dosCifras(fecha.getDate())];
  const hora = [dosCifras(fecha.getHours()), dosCifras(fecha.getMinutes())];
  return `${dia.join('-')}T${hora.join(':')}`;
}

/**
 * Inicia la ficha. Se llama después de `iniciarPaginaPrivada`, solo si hay sesión.
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {function(): Date} [dependencias.ahora] - Qué hora es. Por defecto, la del reloj; los
 *   tests pasan una fija para saber qué `max` saldrá.
 * @returns {void}
 * @listens change
 * @listens submit
 * @fires aviso
 */
export function iniciarFicha({ documento, ahora = () => new Date() }) {
  const formulario = documento.querySelector('#form-ficha');
  const campos = formulario.elements;
  const espacio = documento.querySelector('#ficha-espacio');

  campos.fecha.max = fechaLocal(ahora());

  const validacion = activarValidacion(formulario, {
    reglas: {
      // El navegador ya lo comprueba con el max (rangeOverflow), pero no todos los entornos lo
      // hacen con datetime-local (happy-dom no). Los textos «AAAA-MM-DDTHH:MM» se comparan
      // como fechas porque van de lo más grande (el año) a lo más pequeño (los minutos)
      fecha: (campo) => (campo.value > campo.max ? campo.dataset.invalido : ''),
    },
    avisoErrores: 'Revisa los campos marcados en rojo.',
  });

  /** Muestra y activa los datos del espacio si la categoría elegida es «Espacio». */
  function actualizarEspacio() {
    // Se mira la propiedad checked de cada botón (y no el selector :checked, que happy-dom
    // devuelve desactualizado justo después de un cambio)
    const botones = formulario.querySelectorAll('input[name="categoria"]');
    const elegida = [...botones].find((boton) => boton.checked);
    const esEspacio = elegida?.value === CATEGORIA_ESPACIO;
    espacio.hidden = !esEspacio;
    espacio.disabled = !esEspacio;

    for (const campo of espacio.querySelectorAll('input')) {
      // Un fieldset desactivado ya desactiva sus campos en el navegador; se hace también en cada
      // campo para no depender de ello (happy-dom no lo hace) y que se vea en el propio campo
      campo.disabled = !esEspacio;
      // Al ocultarlos se borran sus errores: si se vuelven a mostrar, empiezan limpios
      if (!esEspacio) {
        mostrarEstadoCampo(campo, documento.querySelector(`#${campo.id}-error`), '');
        campo.removeAttribute('aria-invalid');
      }
    }
  }

  // Delegación: el cambio de cualquier botón de opción sube hasta el formulario
  formulario.addEventListener('change', (evento) => {
    if (evento.target.name === 'categoria') {
      actualizarEspacio();
    }
  });
  actualizarEspacio();

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!validacion.validarFormulario()) {
      return;
    }
    // Guardar la captura es la tarjeta siguiente; de momento se confirma que todo está bien
    lanzarAviso(formulario, 'Todos los datos son correctos.', 'exito');
  });
}
