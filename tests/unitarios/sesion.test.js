// Tests del módulo de sesión (js/sesion.js) con AlmacenFalso.
import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  CLAVE_SESION,
  iniciarSesion,
  leerSesion,
  cerrarSesion,
  esAdministrador,
} from '../../js/sesion.js';

describe('sesion', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('iniciar y leer', () => {
    it('sin sesión abierta, leer devuelve null', () => {
      expect(leerSesion(almacen)).toBeNull();
    });

    it.each([['administrador'], ['usuario']])('una sesión iniciada como %s se lee igual', (rol) => {
      expect(iniciarSesion(almacen, { nombre: 'ana', rol })).toBe(true);
      expect(leerSesion(almacen)).toEqual({ nombre: 'ana', rol });
    });

    it('solo guarda el nombre y el rol, aunque el usuario traiga más datos', () => {
      iniciarSesion(almacen, {
        nombre: 'ana',
        rol: 'usuario',
        correo: 'ana@ejemplo.es',
        resumen: 'abc123',
      });
      expect(JSON.parse(almacen.getItem(CLAVE_SESION))).toEqual({ nombre: 'ana', rol: 'usuario' });
    });

    it('iniciar otra sesión sustituye a la anterior', () => {
      iniciarSesion(almacen, { nombre: 'ana', rol: 'administrador' });
      iniciarSesion(almacen, { nombre: 'luis', rol: 'usuario' });
      expect(leerSesion(almacen)).toEqual({ nombre: 'luis', rol: 'usuario' });
    });
  });

  describe('cerrar', () => {
    it('después de cerrar no hay sesión', () => {
      iniciarSesion(almacen, { nombre: 'ana', rol: 'usuario' });
      cerrarSesion(almacen);
      expect(leerSesion(almacen)).toBeNull();
      expect(almacen.getItem(CLAVE_SESION)).toBeNull();
    });

    it('cerrar sin sesión abierta no falla', () => {
      expect(() => cerrarSesion(almacen)).not.toThrow();
    });
  });

  describe('datos estropeados', () => {
    it.each([
      ['texto que no es JSON', 'no es json'],
      ['una lista', '[{"nombre":"ana","rol":"usuario"}]'],
      ['un texto', '"ana"'],
      ['null', 'null'],
      ['sin rol', '{"nombre":"ana"}'],
      ['un rol inventado', '{"nombre":"ana","rol":"jefe"}'],
      ['sin nombre', '{"rol":"usuario"}'],
      ['un nombre vacío', '{"nombre":"","rol":"usuario"}'],
      ['un nombre que no es texto', '{"nombre":7,"rol":"usuario"}'],
    ])('con %s, leer devuelve null', (_motivo, texto) => {
      almacen.setItem(CLAVE_SESION, texto);
      expect(leerSesion(almacen)).toBeNull();
    });

    it('si lo guardado trae datos de más, solo devuelve el nombre y el rol', () => {
      almacen.setItem(CLAVE_SESION, '{"nombre":"ana","rol":"usuario","extra":true}');
      expect(leerSesion(almacen)).toEqual({ nombre: 'ana', rol: 'usuario' });
    });
  });

  describe('almacenamiento lleno', () => {
    it('iniciar devuelve false', () => {
      const lleno = new AlmacenFalso();
      lleno.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      expect(iniciarSesion(lleno, { nombre: 'ana', rol: 'usuario' })).toBe(false);
    });
  });

  describe('esAdministrador', () => {
    it.each([
      [{ nombre: 'ana', rol: 'administrador' }, true],
      [{ nombre: 'luis', rol: 'usuario' }, false],
      [null, false],
    ])('con la sesión %o devuelve %s', (sesion, esperado) => {
      expect(esAdministrador(sesion)).toBe(esperado);
    });
  });
});
