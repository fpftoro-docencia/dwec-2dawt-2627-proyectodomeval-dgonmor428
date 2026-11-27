// Test de integración del buscador y la paginación del listado: listado.html en happy-dom con sus
// módulos reales. Se sustituyen el almacenamiento (AlmacenFalso), la dirección (vi.fn()) y el
// tiempo (vi.useFakeTimers() para el debounce).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaPrivada } from '../../js/paginas/privada.js';
import { iniciarListado, textoBuscable } from '../../js/paginas/listado.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearCaptura, listarCapturas } from '../../js/capturas.js';

const BASE = {
  titulo: 'Captura',
  categoria: 'paisaje',
  fecha: '2026-11-10T22:40',
  lugar: 'Sierra',
  gps: '28.3009, -16.5098',
  altitud: 100,
  condiciones: 'despejado',
  equipo: 'movil',
  observatorio: null,
  espacio: null,
  imagenes: [],
};

describe('listado: buscador y paginación', () => {
  let almacenCapturas;
  let almacenSesion;
  let actualizarDireccion;

  const lista = () => document.querySelector('#listado-capturas');
  const titulos = () =>
    [...lista().children].map((li) => li.querySelector('[data-parte="titulo"]').textContent);
  const buscador = () => document.querySelector('#listado-buscar');
  const contador = () => document.querySelector('#listado-contador');
  const sinResultados = () => document.querySelector('#listado-sin-resultados');
  const vacio = () => document.querySelector('#listado-vacio');
  const herramientas = () => document.querySelector('#listado-herramientas');
  const paginacion = () => document.querySelector('#listado-paginacion');
  const controles = () => document.querySelector('#listado-controles');
  const dialogo = () => document.querySelector('#dialogo-borrar');
  const boton = (texto) =>
    [...controles().querySelectorAll('button')].find((b) => b.textContent === texto);

  /** Crea `n` capturas «Captura 01»…, la de número mayor es la más reciente. */
  function crearVarias(n) {
    for (let i = 1; i <= n; i++) {
      const numero = String(i).padStart(2, '0');
      crearCaptura(almacenCapturas, 'ana', {
        ...BASE,
        titulo: `Captura ${numero}`,
        fecha: `2026-10-${numero}T10:00`,
      });
    }
  }

  function iniciar(busqueda = '') {
    cargarPagina('listado.html');
    iniciarPaginaPrivada({ documento: document, almacenSesion, reemplazar: vi.fn() });
    iniciarListado({
      documento: document,
      sesion: { nombre: 'ana', rol: 'usuario' },
      almacenCapturas,
      busqueda,
      actualizarDireccion,
    });
  }

  /** Escribe en el buscador y deja pasar la pausa del debounce. */
  function buscar(texto) {
    escribir(buscador(), texto);
    vi.advanceTimersByTime(300);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    almacenCapturas = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    actualizarDireccion = vi.fn();
    iniciarSesion(almacenSesion, { nombre: 'ana', rol: 'usuario' });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('estado inicial', () => {
    it('sin capturas: solo el estado vacío; buscador, contador y paginación ocultos', () => {
      iniciar();
      expect(vacio().hidden).toBe(false);
      expect(herramientas().hidden).toBe(true);
      expect(sinResultados().hidden).toBe(true);
      expect(paginacion().hidden).toBe(true);
      expect(lista().hidden).toBe(true);
    });

    it('con capturas: se ve el buscador y el contador, y no el estado vacío', () => {
      crearVarias(3);
      iniciar();
      expect(herramientas().hidden).toBe(false);
      expect(vacio().hidden).toBe(true);
      expect(sinResultados().hidden).toBe(true);
      expect(contador().textContent).toBe('3 capturas');
    });
  });

  describe('buscador', () => {
    beforeEach(() => {
      crearCaptura(almacenCapturas, 'ana', {
        ...BASE,
        titulo: 'Nebulosa de Orión',
        fecha: '2026-11-10T22:40',
        categoria: 'espacio',
        equipo: 'telescopio',
        espacio: { catalogo: 'M42', ascension: '05h 35m 17s', declinacion: '-05° 23′ 28″' },
      });
      crearCaptura(almacenCapturas, 'ana', {
        ...BASE,
        titulo: 'Tormenta',
        fecha: '2026-11-12T19:05',
        categoria: 'cielo',
        lugar: 'Peña Negra',
        condiciones: 'tormenta',
        equipo: 'camara',
      });
      crearCaptura(almacenCapturas, 'ana', {
        ...BASE,
        titulo: 'Amanecer',
        fecha: '2026-11-11T07:00',
        equipo: 'prismaticos',
      });
      iniciar();
    });

    it('con debounce: antes de 300 ms no filtra y después sí', () => {
      escribir(buscador(), 'orion');
      vi.advanceTimersByTime(299);
      expect(titulos()).toHaveLength(3);
      vi.advanceTimersByTime(1);
      expect(titulos()).toEqual(['Nebulosa de Orión']);
    });

    it('varias teclas seguidas filtran una sola vez, con el último texto', () => {
      const pintadas = vi.spyOn(lista(), 'replaceChildren');
      escribir(buscador(), 'o');
      vi.advanceTimersByTime(100);
      escribir(buscador(), 'or');
      vi.advanceTimersByTime(100);
      escribir(buscador(), 'orion');
      vi.advanceTimersByTime(300);
      expect(pintadas).toHaveBeenCalledTimes(1);
      expect(titulos()).toEqual(['Nebulosa de Orión']);
    });

    it.each([
      ['mayúsculas', 'ORIÓN', ['Nebulosa de Orión']],
      ['sin tildes', 'orion', ['Nebulosa de Orión']],
      ['con tilde que el título no tiene', 'tórmenta', ['Tormenta']],
      ['la ñ', 'PEÑA', ['Tormenta']],
      ['por lugar sin ñ', 'pena negra', ['Tormenta']],
      ['por categoría visible', 'espacio', ['Nebulosa de Orión']],
      ['por condiciones visibles', 'tormenta', ['Tormenta']],
      ['por equipo visible con tilde', 'prismáticos', ['Amanecer']],
      ['por equipo sin tilde', 'camara', ['Tormenta']],
      ['por catálogo', 'm42', ['Nebulosa de Orión']],
      ['con espacios alrededor', '  orion  ', ['Nebulosa de Orión']],
    ])('encuentra por %s', (_motivo, texto, esperado) => {
      buscar(texto);
      expect(titulos()).toEqual(esperado);
    });

    it('no busca por los valores guardados sino por los visibles', () => {
      buscar('prismaticos');
      expect(titulos()).toEqual(['Amanecer']);
    });

    it('borrar el texto vuelve a mostrar todas, de la más reciente a la más antigua', () => {
      buscar('orion');
      buscar('');
      expect(titulos()).toEqual(['Tormenta', 'Amanecer', 'Nebulosa de Orión']);
    });

    it('el contador va en singular con una y en plural con varias o ninguna', () => {
      expect(contador().textContent).toBe('3 capturas');
      buscar('orion');
      expect(contador().textContent).toBe('1 captura');
      buscar('zzz');
      expect(contador().textContent).toBe('0 capturas');
    });

    it('el contador avisa a los lectores de pantalla (aria-live)', () => {
      expect(contador().getAttribute('aria-live')).toBe('polite');
    });

    it('sin coincidencias: mensaje de sin resultados, no el estado vacío, y se mantiene el buscador', () => {
      buscar('zzz');
      expect(sinResultados().hidden).toBe(false);
      expect(vacio().hidden).toBe(true);
      expect(lista().hidden).toBe(true);
      expect(herramientas().hidden).toBe(false);
      expect(paginacion().hidden).toBe(true);
      buscar('orion');
      expect(sinResultados().hidden).toBe(true);
      expect(lista().hidden).toBe(false);
    });

    it('el texto buscado no va a la dirección', () => {
      buscar('orion');
      for (const [url] of actualizarDireccion.mock.calls) {
        expect(url).toBe('listado.html');
      }
    });
  });

  describe('XSS', () => {
    it('buscar un título con <b> lo encuentra y lo pinta como texto', () => {
      crearCaptura(almacenCapturas, 'ana', { ...BASE, titulo: '<b>Orión</b>' });
      crearCaptura(almacenCapturas, 'ana', { ...BASE, titulo: 'Otra', fecha: '2026-10-01T00:00' });
      iniciar();
      buscar('<b>');
      expect(titulos()).toEqual(['<b>Orión</b>']);
      expect(lista().querySelector('b')).toBeNull();
      expect(contador().textContent).toBe('1 captura');
    });

    it('un texto con etiquetas en el buscador no crea elementos', () => {
      crearVarias(2);
      iniciar();
      buscar('<img src=x onerror=alert(1)>');
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(sinResultados().hidden).toBe(false);
    });
  });

  describe('paginación', () => {
    beforeEach(() => {
      crearVarias(15); // 3 páginas de 6: 15..10, 09..04 y 03..01
    });

    it('la primera página tiene las 6 más recientes y 3 páginas de controles', () => {
      iniciar();
      expect(titulos()).toEqual([
        'Captura 15',
        'Captura 14',
        'Captura 13',
        'Captura 12',
        'Captura 11',
        'Captura 10',
      ]);
      expect(paginacion().hidden).toBe(false);
      expect(contador().textContent).toBe('15 capturas');
      expect(boton('3')).toBeDefined();
      expect(boton('4')).toBeUndefined();
      expect(boton('1').getAttribute('aria-current')).toBe('page');
      expect(boton('Anterior').disabled).toBe(true);
    });

    it('con 6 o menos capturas los controles se ocultan', () => {
      document.body.innerHTML = '';
      almacenCapturas = new AlmacenFalso();
      crearVarias(6);
      iniciar();
      expect(paginacion().hidden).toBe(true);
      expect(titulos()).toHaveLength(6);
    });

    it('un clic en un número cambia de página, da el foco al título y escribe la dirección', () => {
      iniciar();
      boton('2').click();
      expect(titulos()[0]).toBe('Captura 09');
      expect(titulos()).toHaveLength(6);
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(document.activeElement).toBe(document.querySelector('#listado-titulo'));
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html?pagina=2');
    });

    it('«Siguiente» y «Anterior» recorren las páginas; la última tiene 3', () => {
      iniciar();
      boton('Siguiente').click();
      boton('Siguiente').click();
      expect(titulos()).toEqual(['Captura 03', 'Captura 02', 'Captura 01']);
      expect(boton('Siguiente').disabled).toBe(true);
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html?pagina=3');
      boton('Anterior').click();
      expect(titulos()[0]).toBe('Captura 09');
    });

    it('volver a la página 1 deja la dirección limpia (listado.html)', () => {
      iniciar();
      boton('2').click();
      boton('1').click();
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html');
    });

    it('al cargar, con ?pagina=2 se ve la página 2', () => {
      iniciar('?pagina=2');
      expect(titulos()[0]).toBe('Captura 09');
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html?pagina=2');
    });

    it('?pagina=99 va a la última y corrige la dirección', () => {
      iniciar('?pagina=99');
      expect(titulos()).toHaveLength(3);
      expect(boton('3').getAttribute('aria-current')).toBe('page');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html?pagina=3');
    });

    it.each([
      ['abc', '?pagina=abc'],
      ['vacío', '?pagina='],
      ['sin el parámetro', ''],
      ['0', '?pagina=0'],
      ['negativo', '?pagina=-4'],
    ])('?pagina %s va a la 1 y deja la dirección limpia', (_motivo, busqueda) => {
      iniciar(busqueda);
      expect(titulos()[0]).toBe('Captura 15');
      expect(boton('1').getAttribute('aria-current')).toBe('page');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html');
    });

    it('al buscar desde otra página se vuelve a la 1', () => {
      iniciar('?pagina=3');
      buscar('captura');
      expect(titulos()[0]).toBe('Captura 15');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html');
    });

    it('el resultado de la búsqueda también se pagina: 6 caben en una página, 15 en tres', () => {
      iniciar();
      buscar('captura 1'); // solo «Captura 10» a «Captura 15»
      expect(contador().textContent).toBe('6 capturas');
      expect(paginacion().hidden).toBe(true);
      buscar('captura');
      expect(contador().textContent).toBe('15 capturas');
      expect(paginacion().hidden).toBe(false);
    });

    it('tras borrar la última captura de la última página, retrocede a la anterior', () => {
      document.body.innerHTML = '';
      almacenCapturas = new AlmacenFalso();
      crearVarias(7); // la página 2 solo tiene «Captura 01»
      iniciar('?pagina=2');
      expect(titulos()).toEqual(['Captura 01']);
      lista().querySelector('[data-accion="borrar"]').click();
      dialogo().querySelector('button[value="borrar"]').click();
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(6);
      expect(titulos()).toHaveLength(6);
      expect(boton('2')).toBeUndefined(); // ya solo queda una página
      expect(paginacion().hidden).toBe(true);
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html');
    });

    it('tras borrar en una página que no es la última, se queda en ella', () => {
      iniciar('?pagina=2');
      lista().querySelector('[data-accion="borrar"]').click();
      dialogo().querySelector('button[value="borrar"]').click();
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(titulos()).toHaveLength(6);
      expect(actualizarDireccion).toHaveBeenLastCalledWith('listado.html?pagina=2');
    });

    it('al borrar la última captura que queda, vuelve el estado vacío y se oculta el buscador', () => {
      document.body.innerHTML = '';
      almacenCapturas = new AlmacenFalso();
      crearVarias(1);
      iniciar();
      lista().querySelector('[data-accion="borrar"]').click();
      dialogo().querySelector('button[value="borrar"]').click();
      expect(vacio().hidden).toBe(false);
      expect(herramientas().hidden).toBe(true);
      expect(paginacion().hidden).toBe(true);
    });
  });

  describe('sin actualizarDireccion ni opciones', () => {
    it('funciona con los valores por defecto (6 por página, sin dirección)', () => {
      crearVarias(8);
      cargarPagina('listado.html');
      iniciarListado({
        documento: document,
        sesion: { nombre: 'ana', rol: 'usuario' },
        almacenCapturas,
      });
      expect(titulos()).toHaveLength(6);
      boton('2').click();
      expect(titulos()).toHaveLength(2);
    });

    it('porPagina y esperaBusqueda se pueden cambiar', () => {
      crearVarias(5);
      cargarPagina('listado.html');
      iniciarListado({
        documento: document,
        sesion: { nombre: 'ana', rol: 'usuario' },
        almacenCapturas,
        porPagina: 2,
        esperaBusqueda: 50,
      });
      expect(titulos()).toHaveLength(2);
      escribir(buscador(), 'captura 05');
      vi.advanceTimersByTime(50);
      expect(titulos()).toEqual(['Captura 05']);
    });
  });

  describe('textoBuscable', () => {
    it('junta título, lugar y los textos visibles, normalizados', () => {
      const texto = textoBuscable({
        ...BASE,
        titulo: 'Órión',
        categoria: 'espacio',
        equipo: 'prismaticos',
        espacio: { catalogo: 'M42' },
      });
      expect(texto).toContain('orion');
      expect(texto).toContain('sierra');
      expect(texto).toContain('espacio');
      expect(texto).toContain('despejado');
      expect(texto).toContain('prismaticos');
      expect(texto).toContain('m42');
    });

    it('una captura a medias no rompe (valores que faltan o desconocidos)', () => {
      expect(textoBuscable({ id: 'x' }).trim()).toBe('');
      expect(textoBuscable({ id: 'x', categoria: 'inventada' }).trim()).toBe('');
    });
  });
});
