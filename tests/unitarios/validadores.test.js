// Tests de los validadores del registro (js/validadores.js).
// Cada tabla `it.each` tiene casos válidos (con los límites) y un caso no válido por regla.
import { describe, it, expect } from 'vitest';
import {
  validarNombreUsuario,
  validarCorreo,
  requisitosClave,
  validarClave,
  validarRepetirClave,
} from '../../js/validadores.js';

describe('validarNombreUsuario', () => {
  it.each([
    ['ana', 'el mínimo: 3 caracteres'],
    ['a'.repeat(20), 'el máximo: 20 caracteres'],
    ['ana_2026', 'letras, cifras y guion bajo'],
    ['Iñaki', 'una ñ'],
    ['Ángela', 'una letra con tilde'],
  ])('«%s» es válido (%s)', (nombre) => {
    expect(validarNombreUsuario(nombre)).toBe('');
  });

  it.each([
    ['an', 'tiene menos de 3 caracteres'],
    ['a'.repeat(21), 'tiene más de 20 caracteres'],
    ['ana lopez', 'tiene un espacio'],
    ['ana-lopez', 'tiene un guion normal'],
    ['ana@', 'tiene una @'],
    ['', 'está vacío'],
  ])('«%s» no es válido porque %s', (nombre) => {
    expect(validarNombreUsuario(nombre)).toBe('Usa de 3 a 20 letras, cifras o _.');
  });
});

describe('validarCorreo', () => {
  it.each([
    ['ana@ejemplo.es', 'un correo normal'],
    ['ana.lopez+fotos@correo.ejemplo.com', 'con puntos, + y subdominio'],
  ])('«%s» es válido (%s)', (correo) => {
    expect(validarCorreo(correo)).toBe('');
  });

  it.each([
    ['ana.ejemplo.es', 'no tiene @'],
    ['ana@ejemplo', 'no tiene dominio con punto'],
    ['ana@ejemplo.e', 'la terminación tiene una sola letra'],
    ['ana @ejemplo.es', 'tiene un espacio'],
    ['@ejemplo.es', 'no tiene nada antes de la @'],
    ['', 'está vacío'],
  ])('«%s» no es válido porque %s', (correo) => {
    expect(validarCorreo(correo)).toBe('Escribe un correo válido.');
  });
});

describe('requisitosClave', () => {
  it.each([
    ['Nebulosa42', { longitud: true, minuscula: true, mayuscula: true, cifra: true }],
    ['Orion42', { longitud: false, minuscula: true, mayuscula: true, cifra: true }],
    ['nebulosa42', { longitud: true, minuscula: true, mayuscula: false, cifra: true }],
    ['NEBULOSA42', { longitud: true, minuscula: false, mayuscula: true, cifra: true }],
    ['nebulosas', { longitud: true, minuscula: true, mayuscula: false, cifra: false }],
    ['ÑANDÚñandú', { longitud: true, minuscula: true, mayuscula: true, cifra: false }],
    ['', { longitud: false, minuscula: false, mayuscula: false, cifra: false }],
  ])('«%s» cumple %o', (clave, esperado) => {
    expect(requisitosClave(clave)).toEqual(esperado);
  });

  it('cuenta caracteres reales, no unidades de código (un emoji cuenta como uno)', () => {
    expect(requisitosClave('Aa1🌌🌌🌌🌌').longitud).toBe(false); // 7 caracteres
    expect(requisitosClave('Aa1🌌🌌🌌🌌🌌').longitud).toBe(true); // 8 caracteres
  });
});

describe('validarClave', () => {
  it.each([
    ['Nebulosa42', 'cumple todo'],
    ['Abcdef1g', 'el mínimo: 8 caracteres'],
    ['Ñandú2026', 'con letras de tilde y ñ'],
  ])('«%s» es válida (%s)', (clave) => {
    expect(validarClave(clave)).toBe('');
  });

  it.each([
    ['Orion42', 'tiene menos de 8 caracteres'],
    ['nebulosa42', 'no tiene mayúscula'],
    ['NEBULOSA42', 'no tiene minúscula'],
    ['Nebulosas', 'no tiene cifra'],
  ])('«%s» no es válida porque %s', (clave) => {
    expect(validarClave(clave)).toBe('La contraseña no cumple todos los requisitos.');
  });
});

describe('validarRepetirClave', () => {
  it('es válida si coincide con la contraseña', () => {
    expect(validarRepetirClave('Nebulosa42', 'Nebulosa42')).toBe('');
  });

  it.each([
    ['nebulosa42', 'Nebulosa42', 'cambia una mayúscula'],
    ['Nebulosa4', 'Nebulosa42', 'le falta un carácter'],
    ['', 'Nebulosa42', 'está vacía'],
  ])('«%s» frente a «%s» no coincide porque %s', (repetida, clave) => {
    expect(validarRepetirClave(repetida, clave)).toBe('Las contraseñas no coinciden.');
  });
});
