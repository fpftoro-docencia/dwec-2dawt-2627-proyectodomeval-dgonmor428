/**
 * Página del listado de capturas (`listado.html`): un elemento por captura, con «Editar» y
 * «Borrar».
 *
 * HTML que necesita:
 * - la lista `#listado-capturas` y el estado vacío `#listado-vacio`;
 * - el bloque `#listado-herramientas` con el buscador `#listado-buscar` (`<input type="search">`)
 *   y el contador `#listado-contador`;
 * - el mensaje `#listado-sin-resultados` (la búsqueda no encuentra nada) y la paginación: el
 *   `<nav id="listado-paginacion">` con la lista `#listado-controles`;
 * - la plantilla `#plantilla-captura`, con un elemento `[data-parte="…"]` por dato (`titulo`,
 *   `categoria`, `lugar`, `fecha`, `altitud`, `condiciones`, `equipo`, `catalogo`, `imagen`…), el
 *   enlace `[data-parte="editar"]` y el botón `[data-accion="borrar"]`;
 * - el diálogo `#dialogo-borrar`, con un `<form method="dialog">` y los botones `value="cancelar"`
 *   y `value="borrar"`;
 * - el título de la página `#listado-titulo`.
 *
 * Qué hace:
 * - crea un `<li>` por captura copiando la plantilla y lo rellena con `textContent` y atributos:
 *   nunca con `innerHTML`, así un título como `<b>hola</b>` se ve tal cual y no se convierte en
 *   HTML. Mete todos los `<li>` en un fragmento y sustituye el contenido de la lista de una vez
 *   (`replaceChildren`): el navegador redibuja una sola vez y no queda nada de la lista anterior;
 * - «Editar» es un enlace normal a `ficha.html?id=…`: no necesita JavaScript;
 * - «Borrar» abre el diálogo de confirmación. Un solo oyente en la lista atiende los «Borrar» de
 *   todas las capturas (delegación con `closest`), también las que se pintan después;
 * - al cerrarse el diálogo con «Borrar», borra la captura, avisa y vuelve a pintar la lista;
 * - el buscador filtra con cada `input`, pero con una pausa (_debounce_), sin distinguir
 *   mayúsculas ni tildes; el contador dice cuántas capturas hay y, si no hay ninguna que coincida,
 *   se ve un mensaje distinto del estado vacío (que es solo cuando no hay capturas guardadas);
 * - la paginación usa `paginar` y los controles de `controlesPaginacion.js`. La página va en la
 *   dirección (`?pagina=2`) y se lee al cargar, así que al recargar sigues en la misma página.
 *   En la página 1 se quita el parámetro (la dirección limpia). El texto del buscador no va a la
 *   dirección. Al buscar se vuelve a la página 1.
 *
 * @module paginas/listado
 */

import { listarCapturas, borrarCaptura } from '../capturas.js';
import { lanzarAviso } from '../avisos.js';
import { validarUrlImagen } from '../validadores.js';
import { paginar } from '../paginar.js';
import { normalizar, retardar } from '../buscar.js';
import { pintarControles, escucharControles } from '../controlesPaginacion.js';
import { leerPagina, escribirPagina } from '../direccion.js';

/** Cuántas capturas caben en cada página del listado. */
const POR_PAGINA = 6;

/** Los milisegundos de pausa del buscador antes de filtrar. */
const ESPERA_BUSQUEDA = 300;

/** Los textos que se ven de cada valor guardado (en la ficha son las opciones de cada lista). */
export const TEXTOS = Object.freeze({
  categoria: { paisaje: 'Paisaje', cielo: 'Cielo', espacio: 'Espacio' },
  condiciones: {
    despejado: 'Despejado',
    nubes: 'Nubes',
    niebla: 'Niebla',
    lluvia: 'Lluvia',
    tormenta: 'Tormenta',
    nieve: 'Nieve',
    aurora: 'Aurora',
  },
  equipo: {
    movil: 'Móvil',
    camara: 'Cámara',
    prismaticos: 'Prismáticos',
    telescopio: 'Telescopio',
  },
});

/** Cómo se escribe la fecha de una captura: «10 nov 2026, 22:40». */
const FORMATO_FECHA = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Escribe la fecha guardada (`AAAA-MM-DDTHH:MM`, en hora local) para leerla.
 *
 * @param {string} fecha - La fecha guardada.
 * @returns {string} La fecha escrita, o `''` si no es una fecha.
 * @example
 * fechaLegible('2026-11-10T22:40'); // → '10 nov 2026, 22:40'
 */
export function fechaLegible(fecha) {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? '' : FORMATO_FECHA.format(valor);
}

/**
 * Ordena las capturas de la más reciente a la más antigua, sin cambiar la lista que recibe.
 *
 * @param {object[]} capturas - Las capturas.
 * @returns {object[]} Una lista nueva, ordenada por fecha descendente.
 * @example
 * ordenarPorFecha([{ fecha: '2026-11-01T10:00' }, { fecha: '2026-11-10T22:40' }]);
 * // → [{ fecha: '2026-11-10T22:40' }, { fecha: '2026-11-01T10:00' }]
 */
export function ordenarPorFecha(capturas) {
  // Las fechas «AAAA-MM-DDTHH:MM» se ordenan bien como texto: van del año a los minutos
  const fecha = (captura) => String(captura.fecha ?? '');
  return [...capturas].sort((a, b) => fecha(b).localeCompare(fecha(a)));
}

/**
 * Junta en un solo texto normalizado todo lo que el buscador mira de una captura: título, lugar,
 * categoría y condiciones (como se ven, no como se guardan), equipo y código de catálogo.
 *
 * @param {object} captura - La captura.
 * @returns {string} El texto normalizado (sin tildes y en minúsculas).
 * @example
 * textoBuscable({ titulo: 'Amanecer', lugar: 'Ávila', categoria: 'paisaje', condiciones: 'despejado' });
 * // → 'amanecer avila paisaje despejado  '
 */
export function textoBuscable(captura) {
  const visible = (tipo, valor) => TEXTOS[tipo][valor] ?? '';
  return normalizar(
    [
      captura.titulo,
      captura.lugar,
      visible('categoria', captura.categoria),
      visible('condiciones', captura.condiciones),
      visible('equipo', captura.equipo),
      captura.espacio?.catalogo,
    ].join(' '),
  );
}

/**
 * Inicia el listado. Se llama después de `iniciarPaginaPrivada`, solo si hay sesión.
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {module:sesion~Sesion} dependencias.sesion - La sesión: se ven las capturas de este
 *   usuario.
 * @param {Storage} dependencias.almacenCapturas - Dónde están las capturas (`localStorage`).
 * @param {string} [dependencias.busqueda] - La parte `?…` de la dirección (`location.search`),
 *   de donde se lee `?pagina=`.
 * @param {function(string): void} [dependencias.actualizarDireccion] - Cambia la dirección sin
 *   añadir una entrada al historial (`(url) => history.replaceState(null, '', url)`).
 * @param {number} [dependencias.porPagina] - Capturas por página (por defecto 6).
 * @param {number} [dependencias.esperaBusqueda] - Pausa del buscador en ms (por defecto 300).
 * @returns {void}
 * @listens input
 * @listens click
 * @listens close
 * @fires aviso
 */
export function iniciarListado({
  documento,
  sesion,
  almacenCapturas,
  busqueda = '',
  actualizarDireccion = () => {},
  porPagina = POR_PAGINA,
  esperaBusqueda = ESPERA_BUSQUEDA,
}) {
  const lista = documento.querySelector('#listado-capturas');
  const vacio = documento.querySelector('#listado-vacio');
  const plantilla = documento.querySelector('#plantilla-captura');
  const dialogo = documento.querySelector('#dialogo-borrar');
  const titulo = documento.querySelector('#listado-titulo');
  const herramientas = documento.querySelector('#listado-herramientas');
  const campoBuscar = documento.querySelector('#listado-buscar');
  const contador = documento.querySelector('#listado-contador');
  const sinResultados = documento.querySelector('#listado-sin-resultados');
  const paginacion = documento.querySelector('#listado-paginacion');
  const controles = documento.querySelector('#listado-controles');

  // La captura que se va a borrar mientras el diálogo está abierto
  let pendiente = null;

  // Lo que se está viendo. La página se lee de la dirección: Number(null) es 0 y Number('abc') es
  // NaN, y `paginar` corrige las dos a la página 1 (y una pasada del total, a la última)
  let textoBusqueda = '';
  let paginaActual = leerPagina(busqueda);

  /**
   * Crea el `<li>` de una captura desde la plantilla.
   *
   * @param {object} captura - La captura.
   * @returns {HTMLElement} El elemento, aún fuera de la página.
   */
  function crearElemento(captura) {
    const elemento = plantilla.content.firstElementChild.cloneNode(true);
    const parte = (nombre) => elemento.querySelector(`[data-parte="${nombre}"]`);
    const textoDe = (tipo, valor) => TEXTOS[tipo][valor] ?? '';

    elemento.dataset.id = captura.id;
    parte('titulo').textContent = captura.titulo ?? '';
    parte('lugar').textContent = captura.lugar ?? '';
    parte('fecha').textContent = fechaLegible(captura.fecha);
    parte('fecha').dateTime = captura.fecha ?? '';
    parte('altitud').textContent = Number.isFinite(captura.altitud) ? `${captura.altitud} m` : '';
    parte('condiciones').textContent = textoDe('condiciones', captura.condiciones);
    parte('equipo').textContent = textoDe('equipo', captura.equipo);

    // La chapa de la categoría: su color lo pone el CSS con la clase, no el JavaScript
    const categoria = parte('categoria');
    categoria.textContent = textoDe('categoria', captura.categoria);
    if (Object.hasOwn(TEXTOS.categoria, captura.categoria)) {
      categoria.classList.add(`chapa--${captura.categoria}`);
    }

    if (captura.espacio?.catalogo) {
      parte('catalogo').textContent = captura.espacio.catalogo;
      parte('bloque-catalogo').hidden = false;
    }

    // La primera imagen, si su dirección es válida (lo guardado se puede haber cambiado a mano)
    const [primera] = captura.imagenes ?? [];
    if (primera && validarUrlImagen(String(primera.url)) === '') {
      const imagen = parte('imagen');
      imagen.src = primera.url;
      imagen.alt = primera.pie || captura.titulo || '';
      imagen.hidden = false;
    }

    // encodeURIComponent: un id con caracteres raros no rompe la dirección
    parte('editar').href = `ficha.html?id=${encodeURIComponent(captura.id)}`;
    parte('editar').setAttribute('aria-label', `Editar «${captura.titulo ?? ''}»`);
    elemento
      .querySelector('[data-accion="borrar"]')
      .setAttribute('aria-label', `Borrar «${captura.titulo ?? ''}»`);
    return elemento;
  }

  /** Pinta las capturas del usuario filtradas, de la más reciente a la más antigua, por páginas. */
  function pintar() {
    // El orden va antes del filtro y de la paginación: así cada página sale ya ordenada
    const todas = ordenarPorFecha(listarCapturas(almacenCapturas, sesion.nombre));
    const buscado = normalizar(textoBusqueda.trim());
    const filtradas = todas.filter((captura) => textoBuscable(captura).includes(buscado));
    const resultado = paginar(filtradas, paginaActual, porPagina);
    // Se guarda la página ya corregida: tras borrar la última de una página, se retrocede sola
    paginaActual = resultado.pagina;

    // Todo se prepara fuera de la página, en un fragmento, y entra de una vez
    const fragmento = documento.createDocumentFragment();
    for (const captura of resultado.elementos) {
      fragmento.append(crearElemento(captura));
    }
    lista.replaceChildren(fragmento);

    const hayCapturas = todas.length > 0;
    const hayResultados = filtradas.length > 0;
    // El estado vacío (sin capturas guardadas) oculta el buscador, el contador y la paginación
    vacio.hidden = hayCapturas;
    herramientas.hidden = !hayCapturas;
    lista.hidden = !hayResultados;
    sinResultados.hidden = !hayCapturas || hayResultados;
    const total = filtradas.length;
    contador.textContent = `${total} ${total === 1 ? 'captura' : 'capturas'}`;

    // Con una sola página los controles no hacen falta: se ocultan
    paginacion.hidden = resultado.totalPaginas <= 1;
    pintarControles({
      documento,
      contenedor: controles,
      pagina: resultado.pagina,
      totalPaginas: resultado.totalPaginas,
    });
    escribirPagina(actualizarDireccion, 'listado.html', resultado.pagina);
  }

  // El buscador escucha `input` (cada cambio del texto, también al pegar o borrar) y no `change`
  // (que solo salta al salir del campo). El debounce espera a que se haga una pausa al escribir
  campoBuscar.addEventListener(
    'input',
    retardar(() => {
      textoBusqueda = campoBuscar.value;
      paginaActual = 1; // al buscar se vuelve a la primera página
      pintar();
    }, esperaBusqueda),
  );

  // Delegación: un único oyente en la lista de controles atiende todos los botones
  escucharControles(controles, (pagina) => {
    paginaActual = pagina;
    pintar();
    // El botón pulsado ya no existe (se han vuelto a crear): el foco va al título
    titulo.focus();
  });

  // Delegación: un solo oyente en la lista para todos los «Borrar». closest() sube desde lo
  // pulsado hasta el botón, y desde el botón hasta su <li>, que guarda el id de la captura
  lista.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion="borrar"]');
    if (boton === null) {
      return;
    }
    const elemento = boton.closest('.captura');
    pendiente = {
      id: elemento.dataset.id,
      titulo: elemento.querySelector('[data-parte="titulo"]').textContent,
    };
    dialogo.querySelector('[data-parte="titulo"]').textContent = pendiente.titulo;
    dialogo.returnValue = '';
    dialogo.showModal();
  });

  // El diálogo se cierra con cualquiera de sus botones o con Escape. returnValue dice cuál
  dialogo.addEventListener('close', () => {
    const captura = pendiente;
    pendiente = null;
    if (dialogo.returnValue !== 'borrar' || captura === null) {
      return;
    }

    try {
      const borrada = borrarCaptura(almacenCapturas, sesion.nombre, captura.id);
      lanzarAviso(
        titulo,
        borrada
          ? `Has borrado «${captura.titulo}».`
          : `«${captura.titulo}» ya no estaba en tu cuaderno.`,
        borrada ? 'exito' : 'advertencia',
      );
    } catch (error) {
      lanzarAviso(titulo, error.message, 'error');
    }
    pintar();
    // El botón pulsado ya no existe: el foco va al título de la página
    titulo.focus();
  });

  pintar();
}
