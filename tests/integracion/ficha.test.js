// Test de integración de la ficha: ficha.html en happy-dom con sus módulos reales (los campos, el
// campo condicional, la validación, las imágenes, guardar y editar). Solo se sustituyen el
// almacenamiento (AlmacenFalso), la navegación (vi.fn()) y la hora (una fija).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaPrivada } from '../../js/paginas/privada.js';
import {
  iniciarFicha,
  fechaLocal,
  datosDeCaptura,
  CATEGORIA_ESPACIO,
  PAGINA_LISTADO,
  MENSAJE_NO_EXISTE,
  MAX_IMAGENES,
} from '../../js/paginas/ficha.js';
import { listarCapturas, crearCaptura, buscarCaptura } from '../../js/capturas.js';
import { CLAVE_AVISO_PENDIENTE } from '../../js/avisos.js';
import { iniciarSesion } from '../../js/sesion.js';

/** La hora fija de los tests: 12 de noviembre de 2026, 18:30 (los meses empiezan en 0). */
const AHORA = new Date(2026, 10, 12, 18, 30);

const CAMPOS_OBLIGATORIOS = [
  ['titulo', 'Escribe un título.'],
  ['categoria', 'Elige una categoría.'],
  ['fecha', 'Escribe la fecha y la hora.'],
  ['lugar', 'Escribe el lugar.'],
  ['gps', 'Escribe las coordenadas.'],
  ['altitud', 'Escribe la altitud.'],
  ['condiciones', 'Elige las condiciones del cielo.'],
  ['equipo', 'Elige el equipo.'],
];

const CAMPOS_ESPACIO = [
  ['catalogo', 'Escribe el código de catálogo.'],
  ['ascension', 'Escribe la ascensión recta.'],
  ['declinacion', 'Escribe la declinación.'],
];

describe('ficha', () => {
  let formulario;
  let campos;
  let espacio;
  let almacenCapturas;
  let almacenSesion;
  let navegar;
  let reemplazar;

  /** Lo que ficha.html le pasa a iniciarFicha, con dobles de prueba. */
  const dependencias = (busqueda = '') => ({
    documento: document,
    sesion: { nombre: 'ana', rol: 'usuario' },
    almacenCapturas,
    almacenSesion,
    busqueda,
    navegar,
    reemplazar,
    ahora: () => AHORA,
  });

  /** Carga ficha.html y la inicia como lo hace la página, con `?…` si se edita. */
  function iniciar(busqueda = '') {
    cargarPagina('ficha.html');
    // Como en ficha.html: primero la protección y la cabecera (que escucha los avisos), luego la ficha
    iniciarPaginaPrivada({ documento: document, almacenSesion, reemplazar: vi.fn() });
    const resultado = iniciarFicha(dependencias(busqueda));
    formulario = document.querySelector('#form-ficha');
    campos = formulario.elements;
    espacio = document.querySelector('#ficha-espacio');
    return resultado;
  }

  const errorDe = (nombre) => document.querySelector(`#ficha-${nombre}-error`).textContent;
  const textoAvisos = () => document.querySelector('#avisos').textContent;
  const marcado = (campo) => campo.classList.contains('is-invalid');

  /** Elige una categoría como el usuario: marca el botón y lanza `change`, que sube. */
  function elegir(categoria) {
    const boton = document.querySelector(`#ficha-categoria-${categoria}`);
    boton.checked = true;
    boton.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Elige una opción de una lista desplegable. */
  function seleccionar(campo, valor) {
    campo.value = valor;
    campo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Rellena todos los campos obligatorios con datos válidos de una captura de cielo. */
  function rellenarValida() {
    escribir(campos.titulo, 'Tormenta sobre la sierra');
    elegir('cielo');
    escribir(campos.fecha, '2026-11-10T21:15');
    escribir(campos.lugar, 'Sierra de las Nieves');
    escribir(campos.gps, '36.6833, -5.0167');
    escribir(campos.altitud, '1919');
    seleccionar(campos.condiciones, 'tormenta');
    seleccionar(campos.equipo, 'camara');
  }

  beforeEach(() => {
    almacenCapturas = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    iniciarSesion(almacenSesion, { nombre: 'ana', rol: 'usuario' });
    navegar = vi.fn();
    reemplazar = vi.fn();
    iniciar();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('fechaLocal', () => {
    it.each([
      [new Date(2026, 10, 12, 18, 30), '2026-11-12T18:30', 'una fecha normal'],
      [
        new Date(2026, 0, 5, 9, 7),
        '2026-01-05T09:07',
        'rellena con ceros el mes, el día y la hora',
      ],
      [new Date(2026, 11, 31, 23, 59), '2026-12-31T23:59', 'el último minuto del año'],
    ])('%s → %s (%s)', (fecha, texto) => {
      expect(fechaLocal(fecha)).toBe(texto);
    });
  });

  describe('la fecha', () => {
    it('el código pone el max: ahora mismo', () => {
      expect(campos.fecha.max).toBe('2026-11-12T18:30');
    });

    it('el max no está escrito en el HTML: sin el código, no hay límite', () => {
      cargarPagina('ficha.html');
      expect(document.querySelector('#ficha-fecha').max).toBe('');
    });

    it('una fecha futura no vale', () => {
      escribir(campos.fecha, '2026-11-12T18:31');
      salir(campos.fecha);
      expect(errorDe('fecha')).toBe('La fecha no puede ser futura.');
    });

    it('ahora mismo sí vale', () => {
      escribir(campos.fecha, '2026-11-12T18:30');
      salir(campos.fecha);
      expect(errorDe('fecha')).toBe('');
    });

    it('sin el parámetro ahora, usa la hora del reloj', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 2, 1, 8, 0));
      cargarPagina('ficha.html');
      iniciarFicha({ ...dependencias(), ahora: undefined }); // undefined: usa el valor por defecto
      expect(document.querySelector('#ficha-fecha').max).toBe('2027-03-01T08:00');
      vi.useRealTimers();
    });
  });

  describe('campo condicional: los datos del espacio', () => {
    it('al empezar, sin categoría, están ocultos y desactivados', () => {
      expect(espacio.hidden).toBe(true);
      expect(espacio.disabled).toBe(true);
      expect(campos.catalogo.willValidate).toBe(false); // desactivado: ni se valida ni se envía
    });

    it('con «Espacio», se muestran y se activan', () => {
      elegir(CATEGORIA_ESPACIO);
      expect(espacio.hidden).toBe(false);
      expect(espacio.disabled).toBe(false);
      expect(campos.catalogo.willValidate).toBe(true);
    });

    it.each(['paisaje', 'cielo'])('con «%s», siguen ocultos y desactivados', (categoria) => {
      elegir(categoria);
      expect(espacio.hidden).toBe(true);
      expect(espacio.disabled).toBe(true);
    });

    it('al cambiar de «Espacio» a otra categoría, se vuelven a ocultar y desactivar', () => {
      elegir('espacio');
      elegir('paisaje');
      expect(espacio.hidden).toBe(true);
      expect(espacio.disabled).toBe(true);
    });

    it('si se ocultan, sus campos no impiden enviar aunque estén vacíos o mal', () => {
      rellenarValida();
      escribir(campos.catalogo, 'mal');
      formulario.requestSubmit();
      expect(errorDe('catalogo')).toBe('');
      expect(navegar).toHaveBeenCalledWith(PAGINA_LISTADO); // sin errores: se guarda y vuelve
    });

    it('con «Espacio», son obligatorios', () => {
      rellenarValida();
      elegir('espacio');
      formulario.requestSubmit();
      for (const [nombre, mensaje] of CAMPOS_ESPACIO) {
        expect(errorDe(nombre)).toBe(mensaje);
      }
      expect(document.activeElement).toBe(campos.catalogo);
    });

    it.each([
      ['catalogo', 'NGC1976', 'Usa un código como M42, NGC 1976 o IC 434.'],
      ['ascension', '5h 35m 17s', 'Usa el formato 05h 35m 17s.'],
      ['declinacion', '-5° 23′ 28″', 'Usa el formato -05° 23′ 28″.'],
    ])('con «Espacio», «%s» usa su validador', (nombre, valor, mensaje) => {
      elegir('espacio');
      escribir(campos[nombre], valor);
      salir(campos[nombre]);
      expect(errorDe(nombre)).toBe(mensaje);
    });

    it('al ocultarlos se borran sus errores: si vuelven, empiezan limpios', () => {
      elegir('espacio');
      formulario.requestSubmit();
      expect(marcado(campos.catalogo)).toBe(true);

      elegir('cielo');
      elegir('espacio');
      for (const [nombre] of CAMPOS_ESPACIO) {
        expect(marcado(campos[nombre])).toBe(false);
        expect(campos[nombre].hasAttribute('aria-invalid')).toBe(false);
        expect(errorDe(nombre)).toBe('');
      }
    });

    it('una captura del espacio completa es válida', () => {
      rellenarValida();
      elegir('espacio');
      escribir(campos.catalogo, 'M42');
      escribir(campos.ascension, '05h 35m 17s');
      escribir(campos.declinacion, '-05° 23′ 28″');
      formulario.requestSubmit();
      expect(navegar).toHaveBeenCalledWith(PAGINA_LISTADO); // sin errores: se guarda y vuelve
    });
  });

  describe('los campos y sus validadores', () => {
    it('con todo vacío: marca cada obligatorio, avisa y lleva el foco al título', () => {
      formulario.requestSubmit();
      for (const [nombre, mensaje] of CAMPOS_OBLIGATORIOS) {
        expect(errorDe(nombre)).toBe(mensaje);
      }
      expect(errorDe('observatorio')).toBe(''); // opcional
      expect(textoAvisos()).toContain('Revisa los campos marcados en rojo.');
      expect(document.activeElement).toBe(campos.titulo);
    });

    it('los tres botones de categoría se marcan juntos', () => {
      formulario.requestSubmit();
      for (const categoria of ['paisaje', 'cielo', 'espacio']) {
        expect(marcado(document.querySelector(`#ficha-categoria-${categoria}`))).toBe(true);
      }
    });

    it('al elegir una categoría, desaparece su error', () => {
      formulario.requestSubmit();
      elegir('paisaje');
      expect(errorDe('categoria')).toBe('');
    });

    it.each([
      ['gps', '36,7213 -4,4214', 'Usa el formato 36.7213, -4.4214.'],
      ['gps', '91, 0', 'La latitud va de −90 a 90 y la longitud de −180 a 180.'],
      ['altitud', '9000', 'La altitud va de −430 a 8849 m.'],
      ['altitud', '-431', 'La altitud va de −430 a 8849 m.'],
      ['observatorio', 'OBS-482-7', 'Usa el formato OBS-4821-7.'],
      ['observatorio', 'OBS-4821-3', 'El dígito de control no es correcto.'],
    ])('«%s» con «%s»: %s', (nombre, valor, mensaje) => {
      escribir(campos[nombre], valor);
      salir(campos[nombre]);
      expect(errorDe(nombre)).toBe(mensaje);
    });

    it.each([
      ['altitud', '8849'],
      ['altitud', '-430'],
      ['altitud', '1919.5'],
      ['observatorio', 'OBS-4821-7'],
      ['observatorio', ''],
    ])('«%s» con «%s» es válido', (nombre, valor) => {
      escribir(campos[nombre], valor);
      salir(campos[nombre]);
      expect(errorDe(nombre)).toBe('');
    });

    it('una lista desplegable sin elegir avisa al salir, y deja de avisar al elegir', () => {
      salir(campos.condiciones);
      expect(errorDe('condiciones')).toBe('Elige las condiciones del cielo.');
      seleccionar(campos.condiciones, 'aurora');
      expect(errorDe('condiciones')).toBe('');
    });

    it('con todo bien, avisa de que los datos son correctos y no marca nada', () => {
      rellenarValida();
      formulario.requestSubmit();
      expect(navegar).toHaveBeenCalledWith(PAGINA_LISTADO); // sin errores: se guarda y vuelve
      expect(formulario.querySelectorAll('.is-invalid')).toHaveLength(0);
    });

    it.each([...CAMPOS_OBLIGATORIOS, ['observatorio'], ...CAMPOS_ESPACIO])(
      'la caja de error de «%s» está enlazada con aria-describedby',
      (nombre) => {
        const campo = document.querySelector(`[name="${nombre}"]`);
        expect(campo.getAttribute('aria-describedby')).toContain(`ficha-${nombre}-error`);
      },
    );

    it('el formulario lleva novalidate', () => {
      expect(formulario.hasAttribute('novalidate')).toBe(true);
    });
  });

  describe('grupo dinámico de imágenes', () => {
    const lista = () => document.querySelector('#ficha-imagenes-lista');
    const imagenes = () => [...lista().children];
    const botonAnadir = () => document.querySelector('[data-accion="anadir-imagen"]');
    const cuenta = () => document.querySelector('#ficha-imagenes-cuenta').textContent;
    const anadir = () => botonAnadir().click();
    const quitar = (posicion) =>
      imagenes()[posicion].querySelector('[data-accion="quitar-imagen"]').click();
    const numeros = () =>
      imagenes().map((imagen) => imagen.querySelector('.imagen__numero').textContent);

    it('al empezar no hay ninguna (el mínimo es 0) y se puede añadir', () => {
      expect(imagenes()).toHaveLength(0);
      expect(cuenta()).toBe('0 de 3');
      expect(botonAnadir().disabled).toBe(false);
    });

    it('«Añadir imagen» crea una desde la plantilla y le da el foco', () => {
      anadir();
      expect(imagenes()).toHaveLength(1);
      expect(numeros()).toEqual(['Imagen 1']);
      expect(cuenta()).toBe('1 de 3');
      expect(document.activeElement).toBe(imagenes()[0].querySelector('[name="imagen-url"]'));
    });

    it('la plantilla no cambia: cada imagen es una copia', () => {
      anadir();
      const plantilla = document.querySelector('#plantilla-imagen');
      expect(plantilla.content.querySelector('input').id).toBe('');
    });

    it('cada campo tiene un id único, su label con htmlFor y su caja de error', () => {
      anadir();
      anadir();
      const ids = [];
      for (const imagen of imagenes()) {
        for (const parte of ['url', 'pie']) {
          const campo = imagen.querySelector(`input[data-parte="${parte}"]`);
          const etiqueta = imagen.querySelector(`label[data-parte="${parte}"]`);
          const caja = document.getElementById(campo.getAttribute('aria-describedby'));
          ids.push(campo.id);
          expect(etiqueta.htmlFor).toBe(campo.id);
          expect(caja.classList.contains('invalid-feedback')).toBe(true);
          expect(imagen.contains(caja)).toBe(true);
        }
      }
      expect(new Set(ids).size).toBe(4);
      expect(ids).toEqual([
        'ficha-imagen-1-url',
        'ficha-imagen-1-pie',
        'ficha-imagen-2-url',
        'ficha-imagen-2-pie',
      ]);
    });

    it(`con ${MAX_IMAGENES} imágenes, «Añadir» se desactiva`, () => {
      anadir();
      anadir();
      anadir();
      expect(imagenes()).toHaveLength(3);
      expect(cuenta()).toBe('3 de 3');
      expect(botonAnadir().disabled).toBe(true);
    });

    it('«Quitar» quita la suya, renumera las demás, reactiva «Añadir» y le da el foco', () => {
      anadir();
      anadir();
      anadir();
      const tercera = imagenes()[2];
      quitar(1);
      expect(imagenes()).toHaveLength(2);
      expect(imagenes()[1]).toBe(tercera);
      expect(numeros()).toEqual(['Imagen 1', 'Imagen 2']);
      expect(botonAnadir().disabled).toBe(false);
      expect(document.activeElement).toBe(botonAnadir());
    });

    it('cada «Quitar» dice a un lector de pantalla qué imagen quita', () => {
      anadir();
      anadir();
      const etiquetas = imagenes().map((imagen) =>
        imagen.querySelector('[data-accion="quitar-imagen"]').getAttribute('aria-label'),
      );
      expect(etiquetas).toEqual(['Quitar la imagen 1', 'Quitar la imagen 2']);
    });

    it('después de quitar, una imagen nueva no repite ningún id', () => {
      anadir();
      anadir();
      quitar(0);
      anadir();
      const ids = imagenes().map((imagen) => imagen.querySelector('input').id);
      expect(ids).toEqual(['ficha-imagen-2-url', 'ficha-imagen-3-url']);
    });

    it('delegación: un solo oyente en el grupo sirve para las imágenes creadas después', () => {
      const grupo = document.querySelector('#ficha-imagenes');
      const espia = vi.spyOn(grupo, 'addEventListener');
      anadir();
      quitar(0);
      expect(espia).not.toHaveBeenCalled(); // no se ha añadido ningún oyente por imagen
      expect(imagenes()).toHaveLength(0);
    });

    it('un clic en el grupo que no es en un botón no hace nada', () => {
      anadir();
      imagenes()[0].querySelector('.imagen__numero').click();
      expect(imagenes()).toHaveLength(1);
    });

    it('la URL es obligatoria y usa su validador; el pie es opcional', () => {
      anadir();
      const [imagen] = imagenes();
      const url = imagen.querySelector('[name="imagen-url"]');
      const errorUrl = () => imagen.querySelector('[data-parte="url-error"]').textContent;
      formulario.requestSubmit();
      expect(errorUrl()).toBe('Escribe la dirección de la imagen.');
      escribir(url, 'ejemplo.es/foto.jpg');
      expect(errorUrl()).toBe('Escribe una URL que empiece por http:// o https://.');
      escribir(url, 'https://ejemplo.es/foto.jpg');
      expect(errorUrl()).toBe('');
      expect(imagen.querySelector('[data-parte="pie-error"]').textContent).toBe('');
    });

    it('una imagen con la URL mal no deja guardar', () => {
      rellenarValida();
      anadir();
      escribir(imagenes()[0].querySelector('[name="imagen-url"]'), 'mal');
      formulario.requestSubmit();
      expect(navegar).not.toHaveBeenCalled();
      expect(listarCapturas(almacenCapturas, 'ana')).toEqual([]);
    });
  });

  describe('guardar una captura nueva', () => {
    const avisoPendiente = () => JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE));

    it('guarda los datos normalizados, avisa y vuelve al listado', () => {
      escribir(campos.titulo, '  Tormenta sobre la sierra  ');
      elegir('cielo');
      escribir(campos.fecha, '2026-11-10T21:15');
      escribir(campos.lugar, 'Sierra de las Nieves ');
      escribir(campos.gps, '36.6833,-5.0167');
      escribir(campos.altitud, '1919');
      seleccionar(campos.condiciones, 'tormenta');
      seleccionar(campos.equipo, 'camara');
      formulario.requestSubmit();

      const [guardada] = listarCapturas(almacenCapturas, 'ana');
      expect(guardada).toEqual({
        id: expect.any(String),
        titulo: 'Tormenta sobre la sierra',
        categoria: 'cielo',
        fecha: '2026-11-10T21:15',
        lugar: 'Sierra de las Nieves',
        gps: '36.6833, -5.0167',
        altitud: 1919,
        condiciones: 'tormenta',
        equipo: 'camara',
        observatorio: null,
        espacio: null,
        imagenes: [],
      });
      expect(avisoPendiente()).toEqual({
        mensaje: 'Has guardado «Tormenta sobre la sierra» en tu cuaderno.',
        tipo: 'exito',
      });
      expect(navegar).toHaveBeenCalledWith(PAGINA_LISTADO);
    });

    it('con «Espacio», guarda sus datos; con imágenes, las guarda en orden', () => {
      rellenarValida();
      elegir('espacio');
      escribir(campos.catalogo, 'M42');
      escribir(campos.ascension, '05h 35m 17s');
      escribir(campos.declinacion, '-05° 23′ 28″');
      escribir(campos.observatorio, 'OBS-4821-7');
      document.querySelector('[data-accion="anadir-imagen"]').click();
      document.querySelector('[data-accion="anadir-imagen"]').click();
      const [primera, segunda] = document.querySelectorAll('#ficha-imagenes-lista .imagen');
      escribir(primera.querySelector('[name="imagen-url"]'), 'https://ejemplo.es/m42.jpg');
      escribir(primera.querySelector('[name="imagen-pie"]'), ' La nebulosa ');
      escribir(segunda.querySelector('[name="imagen-url"]'), 'https://ejemplo.es/teide.jpg');
      formulario.requestSubmit();

      const [guardada] = listarCapturas(almacenCapturas, 'ana');
      expect(guardada.espacio).toEqual({
        catalogo: 'M42',
        ascension: '05h 35m 17s',
        declinacion: '-05° 23′ 28″',
      });
      expect(guardada.observatorio).toBe('OBS-4821-7');
      expect(guardada.imagenes).toEqual([
        { url: 'https://ejemplo.es/m42.jpg', pie: 'La nebulosa' },
        { url: 'https://ejemplo.es/teide.jpg', pie: '' },
      ]);
    });

    it('los datos del espacio no se guardan si al final la categoría no es «Espacio»', () => {
      rellenarValida();
      elegir('espacio');
      escribir(campos.catalogo, 'M42');
      elegir('cielo');
      formulario.requestSubmit();
      expect(listarCapturas(almacenCapturas, 'ana')[0].espacio).toBeNull();
    });

    it('con errores no guarda ni cambia de página', () => {
      formulario.requestSubmit();
      expect(listarCapturas(almacenCapturas, 'ana')).toEqual([]);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('si el almacenamiento está lleno, avisa del error y se queda en la ficha', () => {
      almacenCapturas.setItem = () => {
        throw new DOMException('Lleno', 'QuotaExceededError');
      };
      rellenarValida();
      formulario.requestSubmit();
      expect(textoAvisos()).toContain('el almacenamiento está lleno o bloqueado');
      expect(navegar).not.toHaveBeenCalled();
    });

    it('se guarda en las capturas del usuario de la sesión', () => {
      rellenarValida();
      formulario.requestSubmit();
      expect(listarCapturas(almacenCapturas, 'ana')).toHaveLength(1);
      expect(listarCapturas(almacenCapturas, 'luis')).toHaveLength(0);
    });
  });

  describe('datosDeCaptura', () => {
    it('lee varias imágenes con getAll y empareja cada URL con su pie', () => {
      const datos = new FormData();
      datos.append('categoria', 'paisaje');
      datos.append('imagen-url', ' https://ejemplo.es/a.jpg ');
      datos.append('imagen-pie', 'Primera');
      datos.append('imagen-url', 'https://ejemplo.es/b.jpg');
      expect(datosDeCaptura(datos).imagenes).toEqual([
        { url: 'https://ejemplo.es/a.jpg', pie: 'Primera' },
        { url: 'https://ejemplo.es/b.jpg', pie: '' }, // sin pie: texto vacío
      ]);
    });

    it('un campo que falta se lee como texto vacío', () => {
      const captura = datosDeCaptura(new FormData());
      expect(captura.titulo).toBe('');
      expect(captura.observatorio).toBeNull();
      expect(captura.espacio).toBeNull();
      expect(captura.imagenes).toEqual([]);
    });
  });

  describe('editar (ficha.html?id=…)', () => {
    const TEIDE = {
      titulo: 'Nebulosa de Orión',
      categoria: 'espacio',
      fecha: '2026-11-10T22:40',
      lugar: 'Observatorio del Teide',
      gps: '28.3009, -16.5098',
      altitud: 2390,
      condiciones: 'despejado',
      equipo: 'telescopio',
      observatorio: 'OBS-4821-7',
      espacio: { catalogo: 'M42', ascension: '05h 35m 17s', declinacion: '-05° 23′ 28″' },
      imagenes: [
        { url: 'https://ejemplo.es/m42.jpg', pie: 'La nebulosa' },
        { url: 'https://ejemplo.es/teide.jpg', pie: '' },
      ],
    };
    let id;

    beforeEach(() => {
      id = crearCaptura(almacenCapturas, 'ana', TEIDE).id;
    });

    it('rellena el formulario con la captura y cambia los títulos', () => {
      expect(iniciar(`?id=${id}`)).toBe(true);
      expect(document.querySelector('#ficha-encabezado').textContent).toBe('Editar captura');
      expect(document.title).toBe('Editar captura · Horizonte');
      expect(document.querySelector('#ficha-guardar').textContent).toBe('Guardar cambios');

      expect(campos.titulo.value).toBe('Nebulosa de Orión');
      expect(document.querySelector('#ficha-categoria-espacio').checked).toBe(true);
      expect(campos.fecha.value).toBe('2026-11-10T22:40');
      expect(campos.altitud.value).toBe('2390');
      expect(campos.condiciones.value).toBe('despejado');
      expect(campos.observatorio.value).toBe('OBS-4821-7');
      expect(espacio.hidden).toBe(false); // es del espacio: sus datos se ven
      expect(campos.catalogo.value).toBe('M42');

      const urls = [...document.querySelectorAll('[name="imagen-url"]')].map((url) => url.value);
      expect(urls).toEqual(['https://ejemplo.es/m42.jpg', 'https://ejemplo.es/teide.jpg']);
      expect(document.querySelector('[name="imagen-pie"]').value).toBe('La nebulosa');
      expect(document.querySelector('#ficha-imagenes-cuenta').textContent).toBe('2 de 3');
    });

    it('al guardar, cambia esa captura (mismo id, no una nueva), avisa y vuelve', () => {
      iniciar(`?id=${id}`);
      escribir(campos.titulo, 'Orión desde el Teide');
      formulario.requestSubmit();

      const capturas = listarCapturas(almacenCapturas, 'ana');
      expect(capturas).toHaveLength(1);
      expect(capturas[0]).toEqual({ ...TEIDE, titulo: 'Orión desde el Teide', id });
      expect(JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE)).mensaje).toBe(
        'Has guardado los cambios de «Orión desde el Teide».',
      );
      expect(navegar).toHaveBeenCalledWith(PAGINA_LISTADO);
    });

    it('una captura de paisaje se edita con los datos del espacio ocultos', () => {
      const otra = crearCaptura(almacenCapturas, 'ana', {
        ...TEIDE,
        categoria: 'paisaje',
        espacio: null,
        imagenes: [],
      });
      iniciar(`?id=${otra.id}`);
      expect(espacio.hidden).toBe(true);
      expect(campos.catalogo.value).toBe('');
    });

    it.each([
      ['un id que no existe', () => '?id=no-existe'],
      ['un id vacío', () => '?id='],
      [
        'una captura de otro usuario',
        () => `?id=${crearCaptura(almacenCapturas, 'luis', TEIDE).id}`,
      ],
    ])('con %s, vuelve al listado con un aviso de error', (_caso, busqueda) => {
      expect(iniciar(busqueda())).toBe(false);
      expect(reemplazar).toHaveBeenCalledWith(PAGINA_LISTADO);
      expect(JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE))).toEqual({
        mensaje: MENSAJE_NO_EXISTE,
        tipo: 'error',
      });
      expect(navegar).not.toHaveBeenCalled();
    });

    it('si se borra mientras se edita, al guardar avisa y vuelve al listado', () => {
      iniciar(`?id=${id}`);
      almacenCapturas.clear();
      formulario.requestSubmit();
      expect(JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE)).mensaje).toBe(
        MENSAJE_NO_EXISTE,
      );
      expect(navegar).toHaveBeenCalledWith(PAGINA_LISTADO);
      expect(buscarCaptura(almacenCapturas, 'ana', id)).toBeNull();
    });

    it('una captura guardada a medias (sin campos) se abre sin romperse', () => {
      almacenCapturas.setItem('horizonte.capturas.ana', JSON.stringify([{ id: 'rota' }]));
      expect(iniciar('?id=rota')).toBe(true);
      expect(campos.titulo.value).toBe('');
      expect(campos.altitud.value).toBe('');
      expect(document.querySelectorAll('.imagen')).toHaveLength(0);
    });

    it('unos datos del espacio a medias se rellenan con lo que hay', () => {
      const otra = crearCaptura(almacenCapturas, 'ana', { ...TEIDE, espacio: { catalogo: 'M42' } });
      iniciar(`?id=${otra.id}`);
      expect(campos.catalogo.value).toBe('M42');
      expect(campos.ascension.value).toBe('');
    });

    it(`con más de ${MAX_IMAGENES} imágenes guardadas, solo muestra ${MAX_IMAGENES}`, () => {
      const imagenes = [1, 2, 3, 4].map((numero) => ({
        url: `https://ejemplo.es/${numero}.jpg`,
        pie: '',
      }));
      const otra = crearCaptura(almacenCapturas, 'ana', { ...TEIDE, imagenes });
      iniciar(`?id=${otra.id}`);
      expect(document.querySelectorAll('.imagen')).toHaveLength(3);
    });
  });
});
