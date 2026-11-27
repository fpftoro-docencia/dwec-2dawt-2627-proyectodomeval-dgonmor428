// Test de integración del listado: listado.html en happy-dom con sus módulos reales (las capturas,
// la plantilla, el diálogo y los avisos). Solo se sustituye el almacenamiento (AlmacenFalso).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaPrivada } from '../../js/paginas/privada.js';
import { iniciarListado, fechaLegible, ordenarPorFecha } from '../../js/paginas/listado.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearCaptura, listarCapturas, claveCapturas } from '../../js/capturas.js';

const TEIDE = {
  titulo: 'Nebulosa de Orión',
  categoria: 'espacio',
  fecha: '2026-11-10T22:40',
  lugar: 'Observatorio del Teide',
  gps: '28.3009, -16.5098',
  altitud: 2390,
  condiciones: 'despejado',
  equipo: 'telescopio',
  observatorio: null,
  espacio: { catalogo: 'M42', ascension: '05h 35m 17s', declinacion: '-05° 23′ 28″' },
  imagenes: [{ url: 'https://ejemplo.es/m42.jpg', pie: 'La nebulosa' }],
};

const TORMENTA = {
  ...TEIDE,
  titulo: 'Tormenta sobre la sierra',
  categoria: 'cielo',
  fecha: '2026-11-12T19:05',
  lugar: 'Sierra de las Nieves',
  altitud: 1919,
  condiciones: 'tormenta',
  equipo: 'camara',
  espacio: null,
  imagenes: [],
};

describe('listado: elementos, editar y borrar', () => {
  let almacenCapturas;
  let almacenSesion;

  const lista = () => document.querySelector('#listado-capturas');
  const elementos = () => [...lista().children];
  const vacio = () => document.querySelector('#listado-vacio');
  const dialogo = () => document.querySelector('#dialogo-borrar');
  const textoAvisos = () => document.querySelector('#avisos').textContent;
  const parte = (elemento, nombre) => elemento.querySelector(`[data-parte="${nombre}"]`);

  /** Carga listado.html y la inicia como lo hace la página. */
  function iniciar() {
    cargarPagina('listado.html');
    iniciarPaginaPrivada({ documento: document, almacenSesion, reemplazar: vi.fn() });
    iniciarListado({
      documento: document,
      sesion: { nombre: 'ana', rol: 'usuario' },
      almacenCapturas,
    });
  }

  /** Pulsa «Borrar» en un elemento y después un botón del diálogo, como el usuario. */
  function borrar(elemento, respuesta) {
    elemento.querySelector('[data-accion="borrar"]').click();
    dialogo().querySelector(`button[value="${respuesta}"]`).click();
  }

  beforeEach(() => {
    almacenCapturas = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    iniciarSesion(almacenSesion, { nombre: 'ana', rol: 'usuario' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('sin capturas', () => {
    it('se ve el estado vacío y la lista está oculta', () => {
      iniciar();
      expect(vacio().hidden).toBe(false);
      expect(lista().hidden).toBe(true);
      expect(elementos()).toHaveLength(0);
    });
  });

  describe('un elemento por captura', () => {
    beforeEach(() => {
      crearCaptura(almacenCapturas, 'ana', TEIDE);
      crearCaptura(almacenCapturas, 'ana', TORMENTA);
      crearCaptura(almacenCapturas, 'luis', { ...TEIDE, titulo: 'De otro usuario' });
      iniciar();
    });

    it('pinta solo las del usuario, de la más reciente a la más antigua', () => {
      expect(elementos().map((elemento) => parte(elemento, 'titulo').textContent)).toEqual([
        'Tormenta sobre la sierra',
        'Nebulosa de Orión',
      ]);
      expect(vacio().hidden).toBe(true);
      expect(lista().hidden).toBe(false);
    });

    it('cada elemento es una copia de la plantilla, que no cambia', () => {
      expect(elementos()[0].classList.contains('captura')).toBe(true);
      const plantilla = document.querySelector('#plantilla-captura');
      expect(plantilla.content.querySelector('[data-parte="titulo"]').textContent).toBe('');
    });

    it('rellena los datos con textContent', () => {
      const teide = elementos()[1];
      expect(parte(teide, 'lugar').textContent).toBe('Observatorio del Teide');
      expect(parte(teide, 'fecha').textContent).toBe(fechaLegible('2026-11-10T22:40'));
      expect(parte(teide, 'fecha').getAttribute('datetime')).toBe('2026-11-10T22:40');
      expect(parte(teide, 'altitud').textContent).toBe('2390 m');
      expect(parte(teide, 'condiciones').textContent).toBe('Despejado');
      expect(parte(teide, 'equipo').textContent).toBe('Telescopio');
    });

    it('la categoría sale como chapa con su clase de color', () => {
      const categoria = parte(elementos()[1], 'categoria');
      expect(categoria.textContent).toBe('Espacio');
      expect(categoria.classList.contains('chapa--espacio')).toBe(true);
    });

    it('el catálogo solo se ve en las capturas del espacio', () => {
      const [tormenta, teide] = elementos();
      expect(parte(teide, 'bloque-catalogo').hidden).toBe(false);
      expect(parte(teide, 'catalogo').textContent).toBe('M42');
      expect(parte(tormenta, 'bloque-catalogo').hidden).toBe(true);
    });

    it('la primera imagen se ve con su pie como texto alternativo; sin imágenes, no', () => {
      const [tormenta, teide] = elementos();
      expect(parte(teide, 'imagen').hidden).toBe(false);
      expect(parte(teide, 'imagen').getAttribute('src')).toBe('https://ejemplo.es/m42.jpg');
      expect(parte(teide, 'imagen').alt).toBe('La nebulosa');
      expect(parte(tormenta, 'imagen').hidden).toBe(true);
      expect(parte(tormenta, 'imagen').hasAttribute('src')).toBe(false);
    });

    it('«Editar» es un enlace a ficha.html?id=… con el id de su captura', () => {
      const [tormenta] = elementos();
      const id = listarCapturas(almacenCapturas, 'ana')[1].id;
      expect(parte(tormenta, 'editar').getAttribute('href')).toBe(`ficha.html?id=${id}`);
      expect(parte(tormenta, 'editar').getAttribute('aria-label')).toBe(
        'Editar «Tormenta sobre la sierra»',
      );
    });

    it('cada «Borrar» dice a un lector de pantalla qué captura borra', () => {
      const etiquetas = elementos().map((elemento) =>
        elemento.querySelector('[data-accion="borrar"]').getAttribute('aria-label'),
      );
      expect(etiquetas).toEqual([
        'Borrar «Tormenta sobre la sierra»',
        'Borrar «Nebulosa de Orión»',
      ]);
    });
  });

  describe('sin innerHTML con datos', () => {
    it('un título con etiquetas se ve como texto, no se convierte en HTML', () => {
      crearCaptura(almacenCapturas, 'ana', { ...TEIDE, titulo: '<b>Orión</b>' });
      iniciar();
      const titulo = parte(elementos()[0], 'titulo');
      expect(titulo.textContent).toBe('<b>Orión</b>');
      expect(titulo.querySelector('b')).toBeNull();
    });

    it('una imagen con una dirección que no es http(s) no se carga', () => {
      crearCaptura(almacenCapturas, 'ana', {
        ...TEIDE,
        imagenes: [{ url: 'javascript:alert(1)', pie: '' }],
      });
      iniciar();
      expect(parte(elementos()[0], 'imagen').hidden).toBe(true);
      expect(parte(elementos()[0], 'imagen').hasAttribute('src')).toBe(false);
    });

    it('un id con caracteres raros va codificado en el enlace', () => {
      almacenCapturas.setItem(claveCapturas('ana'), JSON.stringify([{ ...TEIDE, id: 'a&b=c' }]));
      iniciar();
      expect(parte(elementos()[0], 'editar').getAttribute('href')).toBe('ficha.html?id=a%26b%3Dc');
    });

    it('una captura guardada a medias se pinta sin romperse', () => {
      almacenCapturas.setItem(claveCapturas('ana'), JSON.stringify([{ id: 'rota' }]));
      iniciar();
      const [rota] = elementos();
      expect(parte(rota, 'titulo').textContent).toBe('');
      expect(parte(rota, 'fecha').textContent).toBe('');
      expect(parte(rota, 'altitud').textContent).toBe('');
      expect(parte(rota, 'categoria').className).toBe('chapa');
      expect(parte(rota, 'imagen').hidden).toBe(true);
    });

    it('una categoría desconocida no añade ninguna clase', () => {
      crearCaptura(almacenCapturas, 'ana', { ...TEIDE, categoria: 'inventada' });
      iniciar();
      expect(parte(elementos()[0], 'categoria').className).toBe('chapa');
      expect(parte(elementos()[0], 'categoria').textContent).toBe('');
    });

    it('sin pie, el texto alternativo de la imagen es el título', () => {
      crearCaptura(almacenCapturas, 'ana', {
        ...TEIDE,
        imagenes: [{ url: 'https://ejemplo.es/m42.jpg', pie: '' }],
      });
      iniciar();
      expect(parte(elementos()[0], 'imagen').alt).toBe('Nebulosa de Orión');
    });

    it('sin pie ni título, el texto alternativo queda vacío', () => {
      crearCaptura(almacenCapturas, 'ana', {
        ...TEIDE,
        titulo: '',
        imagenes: [{ url: 'https://ejemplo.es/m42.jpg', pie: '' }],
      });
      iniciar();
      expect(parte(elementos()[0], 'imagen').alt).toBe('');
    });
  });

  describe('borrar con confirmación', () => {
    beforeEach(() => {
      crearCaptura(almacenCapturas, 'ana', TEIDE);
      crearCaptura(almacenCapturas, 'ana', TORMENTA);
      iniciar();
    });

    it('«Borrar» abre el diálogo con el título de la captura y no borra todavía', () => {
      elementos()[1].querySelector('[data-accion="borrar"]').click();
      expect(dialogo().open).toBe(true);
      expect(dialogo().querySelector('[data-parte="titulo"]').textContent).toBe(
        'Nebulosa de Orión',
      );
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(2);
    });

    it('con «Cancelar», cierra el diálogo y no borra nada', () => {
      borrar(elementos()[1], 'cancelar');
      expect(dialogo().open).toBe(false);
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(2);
      expect(elementos()).toHaveLength(2);
      expect(textoAvisos()).toBe('');
    });

    it('con «Borrar», la borra, la quita de la lista, avisa y da el foco al título', () => {
      borrar(elementos()[1], 'borrar');
      expect(listarCapturas(almacenCapturas, 'ana').map((captura) => captura.titulo)).toEqual([
        'Tormenta sobre la sierra',
      ]);
      expect(elementos()).toHaveLength(1);
      expect(textoAvisos()).toContain('Has borrado «Nebulosa de Orión».');
      expect(document.activeElement).toBe(document.querySelector('#listado-titulo'));
    });

    it('al borrar la última, se ve el estado vacío', () => {
      borrar(elementos()[0], 'borrar');
      borrar(elementos()[0], 'borrar');
      expect(vacio().hidden).toBe(false);
      expect(lista().hidden).toBe(true);
    });

    it('cerrar con Escape (sin valor) no borra', () => {
      elementos()[0].querySelector('[data-accion="borrar"]').click();
      dialogo().close(); // lo que pasa al pulsar Escape: se cierra sin returnValue
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(2);
    });

    it('cancelar después de un borrado anterior no vuelve a borrar', () => {
      borrar(elementos()[0], 'borrar');
      borrar(elementos()[0], 'cancelar');
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(1);
    });

    it('si ya no estaba (se borró en otra pestaña), avisa y la quita de la lista', () => {
      const [primero] = elementos();
      almacenCapturas.setItem(
        claveCapturas('ana'),
        JSON.stringify(listarCapturas(almacenCapturas, 'ana').slice(0, 1)),
      );
      borrar(primero, 'borrar');
      expect(textoAvisos()).toContain('ya no estaba en tu cuaderno');
      expect(elementos()).toHaveLength(1);
    });

    it('si el almacenamiento no deja guardar, avisa del error y la captura sigue', () => {
      almacenCapturas.setItem = () => {
        throw new DOMException('Lleno', 'QuotaExceededError');
      };
      borrar(elementos()[0], 'borrar');
      expect(textoAvisos()).toContain('el almacenamiento está lleno o bloqueado');
      expect(elementos()).toHaveLength(2);
    });

    it('un cierre del diálogo sin haber pulsado «Borrar» en ninguna captura no hace nada', () => {
      dialogo().showModal();
      dialogo().close('borrar');
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(2);
    });
  });

  describe('delegación', () => {
    beforeEach(() => {
      crearCaptura(almacenCapturas, 'ana', TEIDE);
    });

    it('un solo oyente en la lista: pintar de nuevo no añade oyentes', () => {
      cargarPagina('listado.html');
      const espia = vi.spyOn(document.querySelector('#listado-capturas'), 'addEventListener');
      iniciarListado({
        documento: document,
        sesion: { nombre: 'ana', rol: 'usuario' },
        almacenCapturas,
      });
      expect(espia).toHaveBeenCalledTimes(1);
      expect(espia).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('un clic en la lista que no es en «Borrar» no abre el diálogo', () => {
      iniciar();
      parte(elementos()[0], 'titulo').click();
      expect(dialogo().open).toBe(false);
    });

    it('sirve para los elementos pintados después de borrar', () => {
      crearCaptura(almacenCapturas, 'ana', TORMENTA);
      iniciar();
      borrar(elementos()[0], 'borrar'); // se vuelve a pintar la lista
      borrar(elementos()[0], 'borrar'); // y el «Borrar» del elemento nuevo funciona
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(0);
    });
  });

  describe('funciones de ayuda', () => {
    it('fechaLegible escribe la fecha en español y deja vacía una que no lo es', () => {
      expect(fechaLegible('2026-11-10T22:40')).toMatch(/10.*nov.*2026.*22:40/u);
      expect(fechaLegible('no es una fecha')).toBe('');
      expect(fechaLegible(undefined)).toBe('');
    });

    it('ordenarPorFecha ordena de la más reciente a la más antigua sin cambiar la lista', () => {
      const capturas = [{ fecha: '2026-01-01T00:00' }, {}, { fecha: '2026-12-31T23:59' }];
      expect(ordenarPorFecha(capturas)).toEqual([
        { fecha: '2026-12-31T23:59' },
        { fecha: '2026-01-01T00:00' },
        {},
      ]);
      expect(capturas[0]).toEqual({ fecha: '2026-01-01T00:00' });
    });
  });
});
