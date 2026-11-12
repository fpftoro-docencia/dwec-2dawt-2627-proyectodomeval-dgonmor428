// Tests del sistema de avisos (js/avisos.js). Usan el DOM de happy-dom que trae Vitest.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  EVENTO_AVISO,
  CLAVE_AVISO_PENDIENTE,
  lanzarAviso,
  escucharAvisos,
  guardarAvisoPendiente,
  mostrarAvisoPendiente,
} from '../../js/avisos.js';

describe('avisos', () => {
  let region;
  let formulario;
  let boton;
  let quitarOyentes;

  beforeEach(() => {
    // Una página mínima: la región de avisos y un botón dentro de un formulario
    document.body.innerHTML = `
      <div id="avisos" role="status"></div>
      <form><button type="button">Entrar</button></form>
    `;
    region = document.querySelector('#avisos');
    formulario = document.querySelector('form');
    boton = document.querySelector('button');
    quitarOyentes = escucharAvisos(document, region);
  });

  afterEach(() => {
    quitarOyentes();
  });

  describe('lanzarAviso', () => {
    it('lanza un CustomEvent «aviso» que sube (bubbles) con el mensaje y el tipo', () => {
      const oyente = vi.fn();
      document.addEventListener(EVENTO_AVISO, oyente);
      lanzarAviso(boton, 'Hola', 'exito');
      document.removeEventListener(EVENTO_AVISO, oyente);

      const evento = oyente.mock.calls[0][0];
      expect(evento).toBeInstanceOf(CustomEvent);
      expect(evento.bubbles).toBe(true);
      expect(evento.detail).toEqual({ mensaje: 'Hola', tipo: 'exito' });
      expect(evento.target).toBe(boton);
    });

    it('sin tipo, el aviso es de tipo info', () => {
      lanzarAviso(boton, 'Hola');
      expect(region.querySelector('.alert').classList.contains('alert-info')).toBe(true);
    });
  });

  describe('el único oyente en document', () => {
    it('muestra en la región un aviso lanzado desde un elemento cualquiera', () => {
      lanzarAviso(boton, 'La contraseña no es correcta.', 'error');
      expect(region.querySelector('.aviso__texto').textContent).toBe(
        'La contraseña no es correcta.',
      );
    });

    it('también recoge los avisos lanzados desde document', () => {
      lanzarAviso(document, 'Desde el documento', 'info');
      expect(region.textContent).toContain('Desde el documento');
    });

    it.each([
      ['exito', 'alert-success'],
      ['error', 'alert-danger'],
      ['advertencia', 'alert-warning'],
      ['info', 'alert-info'],
      ['inventado', 'alert-info'],
    ])('el tipo «%s» usa la clase %s de Bootstrap', (tipo, clase) => {
      lanzarAviso(formulario, 'Mensaje', tipo);
      const aviso = region.querySelector('.alert');
      expect(aviso.classList.contains('alert')).toBe(true);
      expect(aviso.classList.contains(clase)).toBe(true);
    });

    it('cada aviso sustituye al anterior', () => {
      lanzarAviso(boton, 'Primero');
      lanzarAviso(boton, 'Segundo');
      expect(region.querySelectorAll('.aviso')).toHaveLength(1);
      expect(region.textContent).toContain('Segundo');
      expect(region.textContent).not.toContain('Primero');
    });

    it('el mensaje entra como texto, nunca como HTML', () => {
      lanzarAviso(boton, '<img src="x" onerror="alert(1)">Hola');
      expect(region.querySelector('img')).toBeNull();
      expect(region.querySelector('.aviso__texto').textContent).toBe(
        '<img src="x" onerror="alert(1)">Hola',
      );
    });

    it('la región de avisos tiene role="status" para los lectores de pantalla', () => {
      expect(region.getAttribute('role')).toBe('status');
    });

    it('al quitar los oyentes, los avisos ya no se muestran', () => {
      quitarOyentes();
      lanzarAviso(boton, 'No se verá');
      expect(region.children).toHaveLength(0);
      quitarOyentes = escucharAvisos(document, region); // para el afterEach
    });
  });

  describe('botón «Cerrar» (delegación en la región)', () => {
    it('cierra el aviso', () => {
      lanzarAviso(boton, 'Un aviso');
      region.querySelector('.aviso__cerrar').click();
      expect(region.children).toHaveLength(0);
    });

    it('sirve también para los avisos que llegan después', () => {
      lanzarAviso(boton, 'Primero');
      lanzarAviso(boton, 'Segundo');
      region.querySelector('.aviso__cerrar').click();
      expect(region.children).toHaveLength(0);
    });

    it('pulsar en el texto del aviso no lo cierra', () => {
      lanzarAviso(boton, 'Un aviso');
      region.querySelector('.aviso__texto').click();
      expect(region.children).toHaveLength(1);
    });

    it('es un botón con nombre accesible', () => {
      lanzarAviso(boton, 'Un aviso');
      const cerrar = region.querySelector('.aviso__cerrar');
      expect(cerrar.type).toBe('button');
      expect(cerrar.getAttribute('aria-label')).toBe('Cerrar el aviso');
    });
  });

  describe('aviso guardado para la página siguiente', () => {
    let almacen;

    beforeEach(() => {
      almacen = new AlmacenFalso();
    });

    it('se guarda, se muestra en la página siguiente y se borra', () => {
      expect(guardarAvisoPendiente(almacen, 'Te has registrado.', 'exito')).toBe(true);
      expect(mostrarAvisoPendiente(almacen, document)).toBe(true);
      expect(region.textContent).toContain('Te has registrado.');
      expect(region.querySelector('.alert-success')).not.toBeNull();
      expect(almacen.getItem(CLAVE_AVISO_PENDIENTE)).toBeNull();
    });

    it('no se repite al recargar', () => {
      guardarAvisoPendiente(almacen, 'Una sola vez', 'info');
      mostrarAvisoPendiente(almacen, document);
      region.replaceChildren();
      expect(mostrarAvisoPendiente(almacen, document)).toBe(false);
      expect(region.children).toHaveLength(0);
    });

    it('sin tipo, se guarda como info', () => {
      guardarAvisoPendiente(almacen, 'Hola');
      expect(JSON.parse(almacen.getItem(CLAVE_AVISO_PENDIENTE))).toEqual({
        mensaje: 'Hola',
        tipo: 'info',
      });
    });

    it('sin aviso guardado no muestra nada', () => {
      expect(mostrarAvisoPendiente(almacen, document)).toBe(false);
      expect(region.children).toHaveLength(0);
    });

    it.each([
      ['texto que no es JSON', 'roto'],
      ['una lista', '["hola"]'],
      ['sin mensaje', '{"tipo":"exito"}'],
      ['un mensaje vacío', '{"mensaje":"","tipo":"exito"}'],
      ['un mensaje que no es texto', '{"mensaje":7,"tipo":"exito"}'],
    ])('con un aviso estropeado (%s) no muestra nada y lo borra', (_motivo, texto) => {
      almacen.setItem(CLAVE_AVISO_PENDIENTE, texto);
      expect(mostrarAvisoPendiente(almacen, document)).toBe(false);
      expect(region.children).toHaveLength(0);
      expect(almacen.getItem(CLAVE_AVISO_PENDIENTE)).toBeNull();
    });

    it('si el almacenamiento está lleno, guardar devuelve false', () => {
      almacen.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      expect(guardarAvisoPendiente(almacen, 'Hola')).toBe(false);
    });
  });
});
