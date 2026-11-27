// Tests del módulo de lectura segura del almacenamiento (js/almacen.js).
// Usan AlmacenFalso en lugar de localStorage: misma interfaz, pero en memoria.
import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { leerJSON, guardarJSON, borrar } from '../../js/almacen.js';

describe('almacen', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('guardar y leer', () => {
    it.each([
      ['una lista', [{ nombre: 'ana' }, { nombre: 'luis' }], []],
      ['un objeto', { usuario: 'ana', rol: 'administrador' }, {}],
      ['un texto', 'hola', ''],
      ['un número', 42, 0],
    ])('lee lo mismo que se guardó: %s', (_motivo, valor, porDefecto) => {
      expect(guardarJSON(almacen, 'dato', valor)).toBe(true);
      expect(leerJSON(almacen, 'dato', porDefecto)).toEqual(valor);
    });

    it('guarda el dato como texto JSON', () => {
      guardarJSON(almacen, 'dato', { a: 1 });
      expect(almacen.getItem('dato')).toBe('{"a":1}');
    });
  });

  describe('lectura segura', () => {
    it('sin nada guardado devuelve el valor por defecto', () => {
      expect(leerJSON(almacen, 'no-existe', [])).toEqual([]);
    });

    it.each([
      ['JSON cortado', '{"usuario": "ana"'],
      ['texto que no es JSON', 'hola'],
      ['la palabra undefined', 'undefined'],
      ['un texto vacío', ''],
    ])('con datos estropeados (%s) devuelve el valor por defecto', (_motivo, texto) => {
      almacen.setItem('dato', texto);
      expect(leerJSON(almacen, 'dato', [])).toEqual([]);
    });

    it.each([
      ['se espera una lista y hay un objeto', '{"a":1}', []],
      ['se espera una lista y hay un número', '5', []],
      ['se espera un objeto y hay una lista', '[1,2]', {}],
      ['se espera un objeto y hay null', 'null', {}],
      ['se espera un objeto y hay un texto', '"hola"', {}],
    ])('si %s, devuelve el valor por defecto', (_motivo, texto, porDefecto) => {
      almacen.setItem('dato', texto);
      expect(leerJSON(almacen, 'dato', porDefecto)).toEqual(porDefecto);
    });

    it('con un valor por defecto null acepta cualquier dato válido', () => {
      almacen.setItem('dato', '"ana"');
      expect(leerJSON(almacen, 'dato', null)).toBe('ana');
    });

    it('si el almacenamiento falla al leer, devuelve el valor por defecto', () => {
      const roto = {
        getItem() {
          throw new Error('almacenamiento bloqueado');
        },
      };
      expect(leerJSON(roto, 'dato', [])).toEqual([]);
    });
  });

  describe('guardar cuando el almacenamiento falla', () => {
    it('devuelve false si el almacenamiento está lleno', () => {
      const lleno = {
        setItem() {
          throw new Error('QuotaExceededError');
        },
      };
      expect(guardarJSON(lleno, 'dato', [1, 2, 3])).toBe(false);
    });
  });

  describe('borrar', () => {
    it('elimina el dato y la siguiente lectura da el valor por defecto', () => {
      guardarJSON(almacen, 'dato', [1]);
      borrar(almacen, 'dato');
      expect(almacen.getItem('dato')).toBeNull();
      expect(leerJSON(almacen, 'dato', [])).toEqual([]);
    });

    it('no falla si el almacenamiento no está disponible', () => {
      const roto = {
        removeItem() {
          throw new Error('almacenamiento bloqueado');
        },
      };
      expect(() => borrar(roto, 'dato')).not.toThrow();
    });
  });
});
