// Tests de mismoNombre y TEXTOS_ROL (js/usuarios.js).
import { describe, it, expect } from 'vitest';
import { ROLES, TEXTOS_ROL, mismoNombre } from '../../js/usuarios.js';

describe('mismoNombre', () => {
  it.each([
    ['iguales', 'ana', 'ana', true],
    ['mayúsculas', 'ANA', 'ana', true],
    ['primera en mayúscula', 'Ana', 'aNA', true],
    ['con tilde, mayúsculas', 'JOSÉ', 'josé', true],
    ['la ñ en mayúscula', 'ÑANDÚ', 'ñandú', true],
    ['vacíos', '', '', true],
    ['distintos', 'ana', 'luis', false],
    ['«José» y «Jose» no son el mismo', 'José', 'Jose', false],
    ['«Jose» y «José» no son el mismo', 'Jose', 'José', false],
    ['«ñ» y «n» no son el mismo', 'Muñoz', 'Munoz', false],
    ['uno es trozo del otro', 'ana', 'an', false],
    ['espacios cuentan', 'ana ', 'ana', false],
  ])('%s', (_motivo, a, b, esperado) => {
    expect(mismoNombre(a, b)).toBe(esperado);
    expect(mismoNombre(b, a)).toBe(esperado);
  });
});

describe('TEXTOS_ROL', () => {
  it('tiene el texto de cada rol', () => {
    expect(TEXTOS_ROL[ROLES.USUARIO]).toBe('Usuario');
    expect(TEXTOS_ROL[ROLES.ADMINISTRADOR]).toBe('Administrador');
  });

  it('tiene exactamente un texto por rol', () => {
    expect(Object.keys(TEXTOS_ROL).sort()).toEqual(Object.values(ROLES).sort());
  });

  it('está congelado', () => {
    expect(Object.isFrozen(TEXTOS_ROL)).toBe(true);
  });
});
