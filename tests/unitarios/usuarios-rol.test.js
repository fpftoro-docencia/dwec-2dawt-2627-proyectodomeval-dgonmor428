// Tests de cambiarRol (js/usuarios.js) con AlmacenFalso.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { CLAVE_USUARIOS, ROLES, cambiarRol, listarUsuarios } from '../../js/usuarios.js';

const ANA = {
  nombre: 'ana',
  correo: 'ana@ejemplo.es',
  resumen: 'resumen-ana',
  rol: 'administrador',
};
const LUIS = { nombre: 'Luis', correo: 'luis@ejemplo.es', resumen: 'resumen-luis', rol: 'usuario' };
const EVA = { nombre: 'eva', correo: 'eva@ejemplo.es', resumen: 'resumen-eva', rol: 'usuario' };

describe('cambiarRol', () => {
  let almacen;
  const guardados = () => JSON.parse(almacen.getItem(CLAVE_USUARIOS));

  beforeEach(() => {
    almacen = new AlmacenFalso();
    almacen.setItem(CLAVE_USUARIOS, JSON.stringify([ANA, LUIS, EVA]));
  });

  it('da el rol de administrador y devuelve el usuario sin el resumen', () => {
    const usuario = cambiarRol(almacen, 'eva', ROLES.ADMINISTRADOR);
    expect(usuario).toEqual({ nombre: 'eva', correo: 'eva@ejemplo.es', rol: 'administrador' });
    expect(usuario).not.toHaveProperty('resumen');
    expect(guardados()[2].rol).toBe('administrador');
  });

  it('quita el rol de administrador', () => {
    expect(cambiarRol(almacen, 'ana', ROLES.USUARIO).rol).toBe('usuario');
    expect(guardados()[0].rol).toBe('usuario');
  });

  it.each([
    ['en minúsculas', 'luis'],
    ['en mayúsculas', 'LUIS'],
    ['como está guardado', 'Luis'],
  ])('el nombre no distingue mayúsculas (%s)', (_motivo, nombre) => {
    const usuario = cambiarRol(almacen, nombre, ROLES.ADMINISTRADOR);
    expect(usuario.nombre).toBe('Luis'); // conserva el nombre guardado
    expect(guardados()[1].rol).toBe('administrador');
  });

  it('conserva el resto de datos (también el resumen) y la posición, y no toca a los demás', () => {
    cambiarRol(almacen, 'Luis', ROLES.ADMINISTRADOR);
    expect(guardados()).toEqual([ANA, { ...LUIS, rol: 'administrador' }, EVA]);
  });

  it('poner el rol que ya tiene lo deja igual', () => {
    expect(cambiarRol(almacen, 'ana', ROLES.ADMINISTRADOR).rol).toBe('administrador');
    expect(guardados()).toEqual([ANA, LUIS, EVA]);
  });

  it.each([
    ['nadie'],
    [''],
    ['an'], // un trozo de un nombre no basta
  ])('con un usuario que no existe («%s») devuelve null y no guarda nada', (nombre) => {
    const antes = almacen.getItem(CLAVE_USUARIOS);
    expect(cambiarRol(almacen, nombre, ROLES.ADMINISTRADOR)).toBeNull();
    expect(almacen.getItem(CLAVE_USUARIOS)).toBe(antes);
  });

  it('sin usuarios guardados devuelve null', () => {
    expect(cambiarRol(new AlmacenFalso(), 'ana', ROLES.USUARIO)).toBeNull();
  });

  describe('rol no válido', () => {
    it.each([
      ['inventado', 'jefe'],
      ['vacío', ''],
      ['en mayúsculas', 'ADMINISTRADOR'],
      ['undefined', undefined],
      ['null', null],
      ['un número', 1],
      ['un objeto', {}],
    ])('con un rol %s lanza RangeError y no cambia nada', (_motivo, rol) => {
      const antes = almacen.getItem(CLAVE_USUARIOS);
      expect(() => cambiarRol(almacen, 'ana', rol)).toThrow(RangeError);
      expect(almacen.getItem(CLAVE_USUARIOS)).toBe(antes);
    });

    it('se comprueba antes de leer: ni siquiera toca el almacén', () => {
      const getItem = vi.spyOn(almacen, 'getItem');
      expect(() => cambiarRol(almacen, 'nadie', 'jefe')).toThrow(RangeError);
      expect(getItem).not.toHaveBeenCalled();
    });
  });

  describe('datos estropeados', () => {
    it.each([
      ['texto que no es JSON', 'no es json'],
      ['un objeto en lugar de una lista', '{"nombre":"ana"}'],
      ['null', 'null'],
    ])('con %s devuelve null', (_motivo, texto) => {
      almacen.setItem(CLAVE_USUARIOS, texto);
      expect(cambiarRol(almacen, 'ana', ROLES.USUARIO)).toBeNull();
    });

    it('un usuario estropeado no existe para cambiarRol', () => {
      almacen.setItem(
        CLAVE_USUARIOS,
        '[{"nombre":"ana","correo":"a@ejemplo.es","rol":"administrador"}]',
      );
      expect(cambiarRol(almacen, 'ana', ROLES.USUARIO)).toBeNull();
    });

    it('al guardar descarta las entradas estropeadas y conserva el cambio en las buenas', () => {
      almacen.setItem(CLAVE_USUARIOS, JSON.stringify([null, 42, { roto: true }, ANA, EVA]));
      expect(cambiarRol(almacen, 'eva', ROLES.ADMINISTRADOR).rol).toBe('administrador');
      expect(guardados()).toEqual([ANA, { ...EVA, rol: 'administrador' }]);
      expect(listarUsuarios(almacen)).toHaveLength(2);
    });
  });

  describe('no se puede guardar', () => {
    it('lanza un Error con mensaje para el aviso', () => {
      const lleno = new AlmacenFalso();
      lleno.setItem(CLAVE_USUARIOS, JSON.stringify([ANA]));
      lleno.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      expect(() => cambiarRol(lleno, 'ana', ROLES.USUARIO)).toThrow(
        'No se ha podido guardar el cambio de rol',
      );
    });
  });
});
