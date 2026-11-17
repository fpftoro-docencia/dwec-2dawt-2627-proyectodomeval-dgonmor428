/**
 * Los controles de la paginación («Anterior», los números y «Siguiente»), comunes al listado de
 * capturas y a la zona de administración.
 *
 * Es un componente sin DOM propio: el contenedor lo pone la página (una lista `<ul>`) y aquí solo
 * se crean sus elementos con los métodos del DOM y `textContent` (nunca `innerHTML`). Los colores y
 * tamaños los pone el CSS con las clases `pagination`, `page-item` y `page-link` de Bootstrap.
 *
 * Se usa en dos pasos:
 * 1. `escucharControles` se llama **una sola vez** y registra el único oyente `click`;
 * 2. `pintarControles` se llama cada vez que cambia la página o el total.
 *
 * Se separan para no apilar un oyente nuevo cada vez que se vuelven a pintar los controles.
 *
 * @module controlesPaginacion
 */

/**
 * Crea un `<li>` con un botón de página.
 *
 * @param {Document} documento - El documento, para crear los elementos.
 * @param {string} texto - Lo que se ve en el botón.
 * @param {number} destino - La página a la que lleva.
 * @param {object} estado - Cómo está el botón.
 * @param {boolean} estado.desactivado - Si no se puede pulsar (extremos).
 * @param {boolean} estado.actual - Si es la página que se está viendo.
 * @param {string} [estado.etiqueta] - Texto para lectores de pantalla, si el visible no basta.
 * @returns {HTMLLIElement} El elemento, aún fuera de la página.
 */
function crearControl(documento, texto, destino, { desactivado, actual, etiqueta }) {
  const elemento = documento.createElement('li');
  elemento.className = 'page-item';

  const boton = documento.createElement('button');
  boton.type = 'button';
  boton.className = 'page-link';
  boton.textContent = texto;
  // El número de destino va en un atributo: el oyente lo lee al pulsar, sin buscar en la lista
  boton.dataset.pagina = String(destino);
  if (etiqueta) {
    boton.setAttribute('aria-label', etiqueta);
  }
  if (desactivado) {
    boton.disabled = true;
    elemento.classList.add('disabled');
  }
  if (actual) {
    boton.setAttribute('aria-current', 'page');
    elemento.classList.add('active');
  }
  elemento.append(boton);
  return elemento;
}

/**
 * Pinta los controles: «Anterior», un botón por página y «Siguiente».
 *
 * «Anterior» se desactiva en la primera página y «Siguiente» en la última; la página actual lleva
 * `aria-current="page"`. Sustituye el contenido del contenedor de una vez (`replaceChildren`).
 *
 * @param {object} opciones - Lo que necesita.
 * @param {Document} opciones.documento - El documento, para crear los elementos.
 * @param {HTMLElement} opciones.contenedor - La lista `<ul class="pagination">` donde van.
 * @param {number} opciones.pagina - La página actual (la ya corregida que devuelve `paginar`).
 * @param {number} opciones.totalPaginas - Cuántas páginas hay.
 * @returns {void}
 */
export function pintarControles({ documento, contenedor, pagina, totalPaginas }) {
  const fragmento = documento.createDocumentFragment();

  fragmento.append(
    crearControl(documento, 'Anterior', pagina - 1, {
      desactivado: pagina <= 1,
      actual: false,
    }),
  );
  for (let numero = 1; numero <= totalPaginas; numero++) {
    fragmento.append(
      crearControl(documento, String(numero), numero, {
        desactivado: false,
        actual: numero === pagina,
        etiqueta: `Página ${numero}`,
      }),
    );
  }
  fragmento.append(
    crearControl(documento, 'Siguiente', pagina + 1, {
      desactivado: pagina >= totalPaginas,
      actual: false,
    }),
  );

  contenedor.replaceChildren(fragmento);
}

/**
 * Registra el oyente de los controles. Se llama una sola vez por contenedor.
 *
 * Es delegación: un único oyente `click` en el contenedor atiende todos los botones, también los
 * que se crean después al volver a pintar. `closest` sube desde lo pulsado hasta su botón.
 *
 * @param {HTMLElement} contenedor - La lista donde están los controles.
 * @param {function(number): void} alCambiar - Se llama con el número de la página elegida.
 * @returns {void}
 * @listens click
 */
export function escucharControles(contenedor, alCambiar) {
  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pagina]');
    // Un botón desactivado no debería recibir clics, pero se comprueba por si acaso
    if (boton === null || boton.disabled) {
      return;
    }
    alCambiar(Number(boton.dataset.pagina));
  });
}
