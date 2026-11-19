// Tests de js/buscar.js: normalizar (sin tildes y en minúsculas) y retardar (debounce).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizar, retardar } from '../../js/buscar.js';

describe('normalizar', () => {
  it.each([
    ['mayúsculas pasan a minúsculas', 'CAMARA', 'camara'],
    ['tildes fuera', 'Cámara Prismáticos', 'camara prismaticos'],
    ['tildes en mayúsculas', 'ÓRIÓN', 'orion'],
    ['diéresis fuera', 'pingüino', 'pinguino'],
    ['la ñ pierde la tilde de la eñe', 'Peña', 'pena'],
    ['un texto ya normalizado no cambia', 'm42 teide', 'm42 teide'],
    ['una cadena vacía sigue vacía', '', ''],
    ['null es una cadena vacía', null, ''],
    ['undefined es una cadena vacía', undefined, ''],
    ['un número se convierte en texto', 42, '42'],
  ])('%s', (_motivo, entrada, esperado) => {
    expect(normalizar(entrada)).toBe(esperado);
  });
});

describe('retardar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no ejecuta la función antes del plazo y la ejecuta al cumplirse', () => {
    const funcion = vi.fn();
    const retardada = retardar(funcion, 300);
    retardada();
    vi.advanceTimersByTime(299);
    expect(funcion).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(funcion).toHaveBeenCalledTimes(1);
  });

  it('con varias llamadas seguidas, solo se ejecuta la última, con sus argumentos', () => {
    const funcion = vi.fn();
    const retardada = retardar(funcion, 300);
    retardada('a', 1);
    retardada('al', 2);
    retardada('alp', 3);
    vi.advanceTimersByTime(300);
    expect(funcion).toHaveBeenCalledTimes(1);
    expect(funcion).toHaveBeenCalledWith('alp', 3);
  });

  it('cada llamada reinicia el plazo', () => {
    const funcion = vi.fn();
    const retardada = retardar(funcion, 300);
    retardada('a');
    vi.advanceTimersByTime(200);
    retardada('ab');
    vi.advanceTimersByTime(200); // 400 ms desde la primera, 200 desde la segunda
    expect(funcion).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(funcion).toHaveBeenCalledTimes(1);
    expect(funcion).toHaveBeenCalledWith('ab');
  });

  it('después de ejecutarse, una llamada nueva vuelve a esperar y a ejecutarse', () => {
    const funcion = vi.fn();
    const retardada = retardar(funcion, 100);
    retardada('uno');
    vi.advanceTimersByTime(100);
    retardada('dos');
    vi.advanceTimersByTime(100);
    expect(funcion.mock.calls).toEqual([['uno'], ['dos']]);
  });
});
