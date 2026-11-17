/**
 * Página de administración (`usuarios.html`): la lista de usuarios, con un botón para dar o quitar
 * el rol de administrador a cada uno.
 *
 * HTML que necesita:
 * - la lista `#usuarios-lista`, el buscador `#usuarios-buscar` (`<input type="search">`), el
 *   contador `#usuarios-contador` y el mensaje `#usuarios-sin-resultados`;
 * - la paginación: el `<nav id="usuarios-paginacion">` con la lista `#usuarios-controles`;
 * - la plantilla `#plantilla-usuario`, con un elemento `[data-parte="…"]` por dato (`nombre`,
 *   `correo`, `rol`), el botón `[data-accion="cambiar-rol"]` y la explicación
 *   `[data-parte="explicacion"]` (solo se ve en la fila de quien tiene la sesión abierta);
 * - el título de la página `#usuarios-titulo`.
 *
 * Qué hace:
 * - crea un `<li>` por usuario copiando la plantilla y lo rellena con `textContent` y atributos
 *   (nunca con `innerHTML`). Todos entran de una vez con `replaceChildren` de un fragmento;
 * - ordena por nombre sin distinguir mayúsculas; el buscador (con _debounce_, sin mayúsculas ni
 *   tildes) mira el nombre, el correo y el rol tal como se ve;
 * - la paginación usa `paginar` y los controles de `controlesPaginacion.js`; la página va en la
 *   dirección (`?pagina=2`) igual que en el listado, y al buscar se vuelve a la página 1;
 * - un solo oyente en la lista atiende los botones de todas las filas (delegación con `closest`);
 * - un administrador no puede quitarse el rol a sí mismo, para que siempre quede uno: su botón está
 *   desactivado y explicado, y aunque se fuerce el clic la página no lo permite.
 *
 * @module paginas/usuarios
 */

import { listarUsuarios, cambiarRol, mismoNombre, ROLES, TEXTOS_ROL } from '../usuarios.js';
import { lanzarAviso } from '../avisos.js';
import { paginar } from '../paginar.js';
import { normalizar, retardar } from '../buscar.js';
import { pintarControles, escucharControles } from '../controlesPaginacion.js';
import { leerPagina, escribirPagina } from '../direccion.js';

/** Cuántos usuarios caben en cada página. */
const POR_PAGINA = 6;

/** Los milisegundos de pausa del buscador antes de filtrar. */
const ESPERA_BUSQUEDA = 300;

// Se vuelve a exportar desde aquí para quien ya la importaba de esta página
export { TEXTOS_ROL };

/** Lo que dice el botón de cada fila según el rol que tiene ahora el usuario. */
const TEXTOS_BOTON = Object.freeze({
  [ROLES.USUARIO]: 'Hacer administrador',
  [ROLES.ADMINISTRADOR]: 'Quitar administrador',
});

/** El id de la explicación de la fila propia, a la que apunta `aria-describedby` de su botón. */
const ID_EXPLICACION = 'usuarios-explicacion-propia';

/**
 * Ordena los usuarios por nombre sin distinguir mayúsculas, sin cambiar la lista que recibe.
 *
 * @param {module:usuarios~Usuario[]} usuarios - Los usuarios.
 * @returns {module:usuarios~Usuario[]} Una lista nueva, ordenada por nombre.
 */
export function ordenarPorNombre(usuarios) {
  const clave = (usuario) => normalizar(usuario.nombre);
  return [...usuarios].sort((a, b) => clave(a).localeCompare(clave(b), 'es'));
}

/**
 * Junta en un solo texto normalizado todo lo que el buscador mira de un usuario: nombre, correo y
 * rol (como se ve, no como se guarda).
 *
 * @param {module:usuarios~Usuario} usuario - El usuario.
 * @returns {string} El texto normalizado (sin tildes y en minúsculas).
 */
export function textoBuscable(usuario) {
  return normalizar([usuario.nombre, usuario.correo, TEXTOS_ROL[usuario.rol]].join(' '));
}

/**
 * Inicia la página de administración. Se llama después de `iniciarPaginaPrivada`, solo si hay
 * sesión (y es de administrador).
 *
 * @param {object} dependencias - Lo que necesita la página.
 * @param {Document} dependencias.documento - El documento de la página.
 * @param {module:sesion~Sesion} dependencias.sesion - La sesión: su usuario no puede quitarse el rol.
 * @param {Storage} dependencias.almacenUsuarios - Dónde están los usuarios (`localStorage`).
 * @param {string} [dependencias.busqueda] - La parte `?…` de la dirección (`location.search`),
 *   de donde se lee `?pagina=`.
 * @param {function(string): void} [dependencias.actualizarDireccion] - Cambia la dirección sin
 *   añadir una entrada al historial (`(url) => history.replaceState(null, '', url)`).
 * @param {number} [dependencias.porPagina] - Usuarios por página (por defecto 6).
 * @param {number} [dependencias.esperaBusqueda] - Pausa del buscador en ms (por defecto 300).
 * @returns {void}
 * @listens input
 * @listens click
 * @fires aviso
 */
export function iniciarUsuarios({
  documento,
  sesion,
  almacenUsuarios,
  busqueda = '',
  actualizarDireccion = () => {},
  porPagina = POR_PAGINA,
  esperaBusqueda = ESPERA_BUSQUEDA,
}) {
  const lista = documento.querySelector('#usuarios-lista');
  const plantilla = documento.querySelector('#plantilla-usuario');
  const titulo = documento.querySelector('#usuarios-titulo');
  const campoBuscar = documento.querySelector('#usuarios-buscar');
  const contador = documento.querySelector('#usuarios-contador');
  const sinResultados = documento.querySelector('#usuarios-sin-resultados');
  const paginacion = documento.querySelector('#usuarios-paginacion');
  const controles = documento.querySelector('#usuarios-controles');

  // Lo que se está viendo. La página se lee de la dirección y `paginar` la corrige si hace falta
  let textoBusqueda = '';
  let paginaActual = leerPagina(busqueda);

  // Se compara como lo hace el módulo de usuarios (solo mayúsculas, no tildes): «José» y «Jose»
  // son usuarios distintos. `normalizar` de buscar.js es solo para buscar y ordenar
  const esYo = (nombre) => mismoNombre(nombre, sesion.nombre);

  /**
   * Crea el `<li>` de un usuario desde la plantilla.
   *
   * @param {module:usuarios~Usuario} usuario - El usuario.
   * @returns {HTMLElement} El elemento, aún fuera de la página.
   */
  function crearElemento(usuario) {
    const elemento = plantilla.content.firstElementChild.cloneNode(true);
    const parte = (nombre) => elemento.querySelector(`[data-parte="${nombre}"]`);

    // El nombre y el rol actual van en la fila: el oyente los lee al pulsar, sin buscar en el DOM
    elemento.dataset.nombre = usuario.nombre;
    elemento.dataset.rol = usuario.rol;
    parte('nombre').textContent = usuario.nombre;
    parte('correo').textContent = usuario.correo;
    parte('rol').textContent = TEXTOS_ROL[usuario.rol];
    if (usuario.rol === ROLES.ADMINISTRADOR) {
      // El color de la chapa lo pone el CSS con la clase
      parte('rol').classList.add('chapa--espacio');
    }

    const boton = elemento.querySelector('[data-accion="cambiar-rol"]');
    boton.textContent = TEXTOS_BOTON[usuario.rol];
    boton.setAttribute('aria-label', `${TEXTOS_BOTON[usuario.rol]}: ${usuario.nombre}`);

    // Nadie se quita el rol a sí mismo: botón desactivado y la razón, visible y enlazada al botón
    if (esYo(usuario.nombre)) {
      const explicacion = parte('explicacion');
      explicacion.id = ID_EXPLICACION;
      explicacion.hidden = false;
      boton.disabled = true;
      boton.setAttribute('aria-describedby', ID_EXPLICACION);
    }
    return elemento;
  }

  /**
   * Pinta los usuarios filtrados, ordenados por nombre y por páginas.
   *
   * @returns {void}
   */
  function pintar() {
    // El orden va antes del filtro y de la paginación: así cada página sale ya ordenada
    const todos = ordenarPorNombre(listarUsuarios(almacenUsuarios));
    const buscado = normalizar(textoBusqueda.trim());
    const filtrados = todos.filter((usuario) => textoBuscable(usuario).includes(buscado));
    const resultado = paginar(filtrados, paginaActual, porPagina);
    paginaActual = resultado.pagina;

    // Todo se prepara fuera de la página, en un fragmento, y entra de una vez
    const fragmento = documento.createDocumentFragment();
    for (const usuario of resultado.elementos) {
      fragmento.append(crearElemento(usuario));
    }
    lista.replaceChildren(fragmento);

    const total = filtrados.length;
    lista.hidden = total === 0;
    sinResultados.hidden = total > 0;
    contador.textContent = `${total} ${total === 1 ? 'usuario' : 'usuarios'}`;

    // Con una sola página los controles no hacen falta: se ocultan
    paginacion.hidden = resultado.totalPaginas <= 1;
    pintarControles({
      documento,
      contenedor: controles,
      pagina: resultado.pagina,
      totalPaginas: resultado.totalPaginas,
    });
    escribirPagina(actualizarDireccion, 'usuarios.html', resultado.pagina);
  }

  /**
   * Da el foco al botón de la fila de un usuario si existe y se puede pulsar; si no (la fila ya no
   * se ve por el filtro, o es la propia), al título.
   *
   * @param {string} nombre - El nombre del usuario.
   * @returns {void}
   */
  function enfocarBotonDe(nombre) {
    // Se recorren las filas en lugar de montar un selector con el nombre: así un nombre con
    // comillas o símbolos raros no rompe nada
    const fila = [...lista.children].find((elemento) => elemento.dataset.nombre === nombre);
    const boton = fila?.querySelector('[data-accion="cambiar-rol"]');
    if (boton && !boton.disabled) {
      boton.focus();
    } else {
      titulo.focus();
    }
  }

  // El buscador escucha `input` y espera a que se haga una pausa al escribir (debounce)
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

  // Delegación: un solo oyente en la lista para todos los botones de rol. closest() sube desde lo
  // pulsado hasta el botón, y desde el botón hasta su <li>, que guarda el nombre y el rol
  lista.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion="cambiar-rol"]');
    if (boton === null) {
      return;
    }
    const fila = boton.closest('[data-nombre]');
    const { nombre, rol } = fila.dataset;

    // Defensa en profundidad: el botón propio ya está desactivado, pero se comprueba también aquí
    // por si se fuerza el clic. Si no, podría quedar la aplicación sin ningún administrador
    if (esYo(nombre) && rol === ROLES.ADMINISTRADOR) {
      // Este texto es el mismo de [data-parte="explicacion"] de usuarios.html: deben coincidir
      lanzarAviso(
        titulo,
        'No puedes quitarte el rol a ti mismo: siempre tiene que quedar un administrador.',
        'error',
      );
      return;
    }

    const rolNuevo = rol === ROLES.ADMINISTRADOR ? ROLES.USUARIO : ROLES.ADMINISTRADOR;
    try {
      const cambiado = cambiarRol(almacenUsuarios, nombre, rolNuevo);
      if (cambiado === null) {
        lanzarAviso(titulo, `«${nombre}» ya no existe.`, 'advertencia');
      } else {
        lanzarAviso(
          titulo,
          `«${cambiado.nombre}» ahora tiene el rol de ${TEXTOS_ROL[cambiado.rol].toLowerCase()}.`,
          'exito',
        );
      }
    } catch (error) {
      lanzarAviso(titulo, error.message, 'error');
    }

    // Se vuelve a pintar con el mismo filtro y la misma página
    pintar();
    enfocarBotonDe(nombre);
  });

  pintar();
}
