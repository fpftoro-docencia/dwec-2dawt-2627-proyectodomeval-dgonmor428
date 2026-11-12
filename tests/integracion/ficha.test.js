// Test de integración de la ficha: ficha.html en happy-dom con sus módulos reales (los campos, el
// campo condicional y la validación). Solo se sustituyen el almacenamiento de la sesión
// (AlmacenFalso), la navegación (vi.fn()) y la hora (una fija).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaPrivada } from '../../js/paginas/privada.js';
import { iniciarFicha, fechaLocal, CATEGORIA_ESPACIO } from '../../js/paginas/ficha.js';
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

describe('ficha: campos y campo condicional', () => {
  let formulario;
  let campos;
  let espacio;

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
    cargarPagina('ficha.html');
    const almacenSesion = new AlmacenFalso();
    iniciarSesion(almacenSesion, { nombre: 'ana', rol: 'usuario' });
    // Como en ficha.html: primero la protección y la cabecera (que escucha los avisos), luego la ficha
    iniciarPaginaPrivada({ documento: document, almacenSesion, reemplazar: vi.fn() });
    iniciarFicha({ documento: document, ahora: () => AHORA });
    formulario = document.querySelector('#form-ficha');
    campos = formulario.elements;
    espacio = document.querySelector('#ficha-espacio');
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
      iniciarFicha({ documento: document });
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
      expect(textoAvisos()).toContain('Todos los datos son correctos.');
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
      expect(textoAvisos()).toContain('Todos los datos son correctos.');
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
      expect(textoAvisos()).toContain('Todos los datos son correctos.');
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
});
