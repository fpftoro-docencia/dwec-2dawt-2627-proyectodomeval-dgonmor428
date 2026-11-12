/**
 * Página de la ficha de una captura (`ficha.html`): dar de alta (`ficha.html`) y editar
 * (`ficha.html?id=…`).
 *
 * HTML que necesita:
 * - un formulario `#form-ficha` con los campos de la captura (`titulo`, `categoria`, `fecha`,
 *   `lugar`, `gps`, `altitud`, `condiciones`, `equipo` y `observatorio`), cada uno con su caja de
 *   error enlazada con `aria-describedby` y sus mensajes en `data-vacio`, `data-invalido` y
 *   `data-validar` (los lee `js/validacion.js`), y el botón de envío `#ficha-guardar`;
 * - el campo condicional `#ficha-espacio`, un `<fieldset hidden disabled>` con `catalogo`,
 *   `ascension` y `declinacion`;
 * - el grupo de imágenes `#ficha-imagenes`: la lista `#ficha-imagenes-lista`, el contador
 *   `#ficha-imagenes-cuenta`, el botón `[data-accion="anadir-imagen"]` y la plantilla
 *   `#plantilla-imagen`;
 * - el título de la página `#ficha-encabezado`.
 *
 * Qué hace:
 * - pone el `max` de la fecha: ahora mismo, para que no se pueda guardar una captura del futuro.
 *   Lo pone el código porque el HTML no sabe qué día es hoy;
 * - muestra **y activa** los datos del espacio solo si la categoría es «Espacio». `hidden` lo
 *   oculta, y `disabled` hace que no se valide ni se envíe: un campo oculto pero activo seguiría
 *   siendo obligatorio y no dejaría guardar una captura de paisaje;
 * - añade y quita imágenes (de 0 a 3) desde la plantilla, con un `id` único por campo, y
 *   desactiva los botones en los límites;
 * - valida cada campo en tiempo real y todos al enviar (`js/validacion.js`);
 * - al enviar sin errores, lee los datos con `FormData`, los guarda normalizados, deja un aviso
 *   para el listado y vuelve a él;
 * - con `?id=…`, rellena el formulario con esa captura para editarla. Si no existe (o es de otro
 *   usuario), vuelve al listado con un aviso de error.
 *
 * @module paginas/ficha
 */

import { activarValidacion } from '../validacion.js';
import { mostrarEstadoCampo } from '../formularios.js';
import { lanzarAviso, guardarAvisoPendiente } from '../avisos.js';
import { buscarCaptura, crearCaptura, actualizarCaptura } from '../capturas.js';

/** La categoría que muestra los datos del espacio. */
export const CATEGORIA_ESPACIO = 'espacio';

/** Cuántas imágenes puede tener una captura, como mínimo y como máximo. */
export const MIN_IMAGENES = 0;
export const MAX_IMAGENES = 3;

/** Adónde se vuelve al guardar o si la captura que se quiere editar no existe. */
export const PAGINA_LISTADO = 'listado.html';

/** Aviso cuando `?id=…` no es de ninguna captura del usuario. */
export const MENSAJE_NO_EXISTE = 'No hemos encontrado esa captura en tu cuaderno.';

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
 * Convierte lo que se ha escrito en el formulario en una captura **normalizada**, lista para
 * guardar: los textos sin espacios al principio ni al final, la altitud como número, las
 * coordenadas con una coma y un espacio, el código de observatorio vacío como `null`, los datos
 * del espacio solo si la categoría es «Espacio» y las imágenes como una lista de `{ url, pie }`.
 *
 * Las imágenes se leen con `getAll`, porque hay varios campos con el mismo nombre: devuelve
 * todos los valores, en el orden del formulario.
 *
 * @param {FormData} datos - Los datos del formulario (`new FormData(formulario)`).
 * @returns {object} La captura sin `id` (el `id` lo pone el módulo de capturas).
 * @example
 * datosDeCaptura(new FormData(formulario)).altitud; // → 2390 (un número, no '2390')
 */
export function datosDeCaptura(datos) {
  const texto = (nombre) => (datos.get(nombre) ?? '').trim();
  const categoria = texto('categoria');
  const pies = datos.getAll('imagen-pie');

  return {
    titulo: texto('titulo'),
    categoria,
    fecha: texto('fecha'),
    lugar: texto('lugar'),
    // '36.7213,-4.4214' y '36.7213, -4.4214' se guardan igual
    gps: texto('gps').replace(/,\s*/u, ', '),
    altitud: Number(texto('altitud')),
    condiciones: texto('condiciones'),
    equipo: texto('equipo'),
    observatorio: texto('observatorio') === '' ? null : texto('observatorio'),
    espacio:
      categoria === CATEGORIA_ESPACIO
        ? {
            catalogo: texto('catalogo'),
            ascension: texto('ascension'),
            declinacion: texto('declinacion'),
          }
        : null,
    imagenes: datos.getAll('imagen-url').map((url, posicion) => ({
      url: url.trim(),
      pie: (pies[posicion] ?? '').trim(),
    })),
  };
}

/**
 * Inicia la ficha. Se llama después de `iniciarPaginaPrivada`, solo si hay sesión.
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {module:sesion~Sesion} dependencias.sesion - La sesión: sus capturas son las de este
 *   usuario.
 * @param {Storage} dependencias.almacenCapturas - Dónde están las capturas (`localStorage`).
 * @param {Storage} dependencias.almacenSesion - Dónde se deja el aviso para el listado
 *   (`sessionStorage`).
 * @param {string} [dependencias.busqueda] - La parte `?…` de la dirección (`location.search`).
 * @param {function(string): void} dependencias.navegar - Cómo ir a otra página
 *   (`location.assign`).
 * @param {function(string): void} dependencias.reemplazar - Cómo cambiar de página sin dejar esta
 *   en el historial (`location.replace`).
 * @param {function(): Date} [dependencias.ahora] - Qué hora es. Por defecto, la del reloj; los
 *   tests pasan una fija para saber qué `max` saldrá.
 * @returns {boolean} `false` si la captura que se quería editar no existe y se ha vuelto al
 *   listado; `true` si la ficha está lista.
 * @listens change
 * @listens click
 * @listens submit
 * @fires aviso
 */
export function iniciarFicha({
  documento,
  sesion,
  almacenCapturas,
  almacenSesion,
  busqueda = '',
  navegar,
  reemplazar,
  ahora = () => new Date(),
}) {
  // ¿Alta o edición? Con ?id=… se edita, si esa captura existe y es de este usuario
  const id = new URLSearchParams(busqueda).get('id');
  const capturaEditada = id === null ? null : buscarCaptura(almacenCapturas, sesion.nombre, id);
  if (id !== null && capturaEditada === null) {
    guardarAvisoPendiente(almacenSesion, MENSAJE_NO_EXISTE, 'error');
    // replace: con «Atrás» no se vuelve a una ficha que no existe
    reemplazar(PAGINA_LISTADO);
    return false;
  }

  const formulario = documento.querySelector('#form-ficha');
  const campos = formulario.elements;
  const espacio = documento.querySelector('#ficha-espacio');
  const grupoImagenes = documento.querySelector('#ficha-imagenes');
  const listaImagenes = documento.querySelector('#ficha-imagenes-lista');
  const cuentaImagenes = documento.querySelector('#ficha-imagenes-cuenta');
  const botonAnadir = grupoImagenes.querySelector('[data-accion="anadir-imagen"]');
  const plantillaImagen = documento.querySelector('#plantilla-imagen');

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

  // ---- Campo condicional ----------------------------------------------------------------------

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

  // ---- Grupo dinámico de imágenes -------------------------------------------------------------

  // Cada imagen nueva recibe un número que nunca se repite, aunque se quiten otras: así sus id
  // (ficha-imagen-1-url, ficha-imagen-2-url…) son únicos en la página
  let siguienteNumero = 1;

  /**
   * Pone al día lo que depende de cuántas imágenes hay: su número visible («Imagen 2»), el
   * contador y los botones, que se desactivan en los límites.
   */
  function actualizarImagenes() {
    const imagenes = [...listaImagenes.children];
    imagenes.forEach((imagen, posicion) => {
      const numero = posicion + 1;
      imagen.querySelector('.imagen__numero').textContent = `Imagen ${numero}`;
      const quitar = imagen.querySelector('[data-accion="quitar-imagen"]');
      quitar.disabled = imagenes.length <= MIN_IMAGENES;
      // El botón dice «Quitar»; quien usa un lector de pantalla oye cuál
      quitar.setAttribute('aria-label', `Quitar la imagen ${numero}`);
    });
    botonAnadir.disabled = imagenes.length >= MAX_IMAGENES;
    cuentaImagenes.textContent = `${imagenes.length} de ${MAX_IMAGENES}`;
  }

  /**
   * Añade una imagen desde la plantilla, con un `id` único en cada campo, su `label` enlazada con
   * `htmlFor` y su caja de error enlazada con `aria-describedby`.
   *
   * @param {{url: string, pie: string}} [valores] - Lo que se escribe en ella (al editar); sin
   *   ellos, la imagen sale vacía.
   * @returns {HTMLElement|null} La imagen añadida, o `null` si ya había el máximo.
   */
  function anadirImagen({ url = '', pie = '' } = {}) {
    if (listaImagenes.children.length >= MAX_IMAGENES) {
      return null;
    }
    const prefijo = `ficha-imagen-${siguienteNumero}`;
    siguienteNumero += 1;

    // content es un fragmento con el contenido de la plantilla: se copia entero (true)
    const imagen = plantillaImagen.content.firstElementChild.cloneNode(true);
    const valores = { url, pie };
    for (const parte of ['url', 'pie']) {
      const campo = imagen.querySelector(`input[data-parte="${parte}"]`);
      const etiqueta = imagen.querySelector(`label[data-parte="${parte}"]`);
      const caja = imagen.querySelector(`[data-parte="${parte}-error"]`);
      campo.id = `${prefijo}-${parte}`;
      etiqueta.htmlFor = campo.id;
      caja.id = `${campo.id}-error`;
      campo.setAttribute('aria-describedby', caja.id);
      campo.value = valores[parte];
    }

    listaImagenes.append(imagen);
    actualizarImagenes();
    return imagen;
  }

  /**
   * Quita una imagen. No hace falta comprobar el mínimo: en el mínimo, los «Quitar» están
   * desactivados y el clic no llega (con un mínimo de 0, ni siquiera queda ninguno).
   *
   * @param {HTMLElement} imagen - La imagen (`.imagen`) que se quita.
   * @returns {void}
   */
  function quitarImagen(imagen) {
    imagen.remove();
    actualizarImagenes();
  }

  // Delegación: un solo oyente en el grupo sirve para «Añadir» y para los «Quitar» de todas las
  // imágenes, también las que se crean después. closest() sube desde lo que se ha pulsado (que
  // podría ser un elemento dentro del botón) hasta el botón con data-accion
  grupoImagenes.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (boton === null) {
      return;
    }
    if (boton.dataset.accion === 'anadir-imagen') {
      // Si se ha llegado al máximo, el botón está desactivado y el clic ni siquiera llega
      anadirImagen().querySelector('input').focus();
    } else {
      // La otra acción del grupo: data-accion="quitar-imagen"
      quitarImagen(boton.closest('.imagen'));
      // El botón pulsado ya no existe: el foco va a «Añadir», que vuelve a estar activo
      botonAnadir.focus();
    }
  });

  // ---- Editar: rellenar el formulario con la captura -------------------------------------------

  /**
   * Rellena el formulario con una captura guardada.
   *
   * @param {object} captura - La captura.
   * @returns {void}
   */
  function rellenar(captura) {
    for (const nombre of ['titulo', 'fecha', 'lugar', 'gps', 'condiciones', 'equipo']) {
      campos[nombre].value = captura[nombre] ?? '';
    }
    campos.altitud.value = String(captura.altitud ?? '');
    campos.observatorio.value = captura.observatorio ?? '';

    // Se busca entre los botones (y no con un selector armado con el valor guardado, que podría
    // traer comillas si alguien lo ha cambiado a mano)
    const botones = formulario.querySelectorAll('input[name="categoria"]');
    const boton = [...botones].find((opcion) => opcion.value === captura.categoria);
    if (boton !== undefined) {
      boton.checked = true;
    }
    if (captura.espacio) {
      for (const nombre of ['catalogo', 'ascension', 'declinacion']) {
        campos[nombre].value = captura.espacio[nombre] ?? '';
      }
    }
    for (const imagen of captura.imagenes ?? []) {
      anadirImagen(imagen);
    }
  }

  if (capturaEditada !== null) {
    documento.querySelector('#ficha-encabezado').textContent = 'Editar captura';
    documento.title = 'Editar captura · Horizonte';
    documento.querySelector('#ficha-guardar').textContent = 'Guardar cambios';
    rellenar(capturaEditada);
  }
  actualizarEspacio();
  actualizarImagenes();

  // ---- Guardar ----------------------------------------------------------------------------------

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!validacion.validarFormulario()) {
      return;
    }

    const captura = datosDeCaptura(new FormData(formulario));
    try {
      if (capturaEditada === null) {
        crearCaptura(almacenCapturas, sesion.nombre, captura);
      } else if (actualizarCaptura(almacenCapturas, sesion.nombre, id, captura) === null) {
        // Se borró (en otra pestaña) mientras se editaba
        guardarAvisoPendiente(almacenSesion, MENSAJE_NO_EXISTE, 'error');
        navegar(PAGINA_LISTADO);
        return;
      }
    } catch (error) {
      // El almacenamiento está lleno o bloqueado: se avisa y se queda en la ficha
      lanzarAviso(formulario, error.message, 'error');
      return;
    }

    const mensaje =
      capturaEditada === null
        ? `Has guardado «${captura.titulo}» en tu cuaderno.`
        : `Has guardado los cambios de «${captura.titulo}».`;
    guardarAvisoPendiente(almacenSesion, mensaje, 'exito');
    navegar(PAGINA_LISTADO);
  });

  return true;
}
