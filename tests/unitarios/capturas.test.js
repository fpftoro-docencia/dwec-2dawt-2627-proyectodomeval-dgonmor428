// Tests del módulo de capturas (js/capturas.js) con AlmacenFalso.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  PREFIJO_CAPTURAS,
  claveCapturas,
  listarCapturas,
  buscarCaptura,
  crearCaptura,
  actualizarCaptura,
  borrarCaptura,
} from '../../js/capturas.js';

const TEIDE = { titulo: 'Vía Láctea en el Teide', categoria: 'espacio' };
const TORMENTA = { titulo: 'Tormenta sobre la sierra', categoria: 'cielo' };
const ATARDECER = { titulo: 'Atardecer en la costa', categoria: 'paisaje' };

/** Crea ids previsibles: 'id-1', 'id-2'… */
function idsEnOrden() {
  let contador = 0;
  return () => {
    contador += 1;
    return `id-${contador}`;
  };
}

/** Un almacenamiento que no deja guardar, como uno lleno. */
class AlmacenLleno extends AlmacenFalso {
  setItem() {
    throw new DOMException('Lleno', 'QuotaExceededError');
  }
}

/** Un almacenamiento bloqueado: ni siquiera deja leer. */
class AlmacenBloqueado extends AlmacenFalso {
  getItem() {
    throw new DOMException('Bloqueado', 'SecurityError');
  }
}

describe('capturas', () => {
  let almacen;
  let crearId;

  beforeEach(() => {
    almacen = new AlmacenFalso();
    crearId = idsEnOrden();
  });

  describe('la clave de cada usuario', () => {
    it('es el prefijo y el nombre del usuario', () => {
      expect(claveCapturas('ana')).toBe(`${PREFIJO_CAPTURAS}ana`);
      expect(PREFIJO_CAPTURAS).toBe('horizonte.capturas.');
    });

    it('no distingue mayúsculas: «Ana» y «ana» tienen la misma clave', () => {
      expect(claveCapturas('Ana')).toBe(claveCapturas('ana'));
    });

    it('se guarda en JSON en la clave del usuario', () => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      expect(JSON.parse(almacen.getItem('horizonte.capturas.ana'))).toEqual([
        { ...TEIDE, id: 'id-1' },
      ]);
    });
  });

  describe('crear y listar', () => {
    it('sin capturas, la lista está vacía', () => {
      expect(listarCapturas(almacen, 'ana')).toEqual([]);
    });

    it('crear devuelve la captura con su id', () => {
      expect(crearCaptura(almacen, 'ana', TEIDE, crearId)).toEqual({ ...TEIDE, id: 'id-1' });
    });

    it('las capturas salen en el orden en que se crearon', () => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      crearCaptura(almacen, 'ana', TORMENTA, crearId);
      expect(listarCapturas(almacen, 'ana')).toEqual([
        { ...TEIDE, id: 'id-1' },
        { ...TORMENTA, id: 'id-2' },
      ]);
    });

    it('no cambia los datos que recibe', () => {
      const datos = { ...TEIDE };
      crearCaptura(almacen, 'ana', datos, crearId);
      expect(datos).toEqual(TEIDE);
    });

    it('ignora el id que traigan los datos: el id lo pone el módulo', () => {
      const captura = crearCaptura(almacen, 'ana', { ...TEIDE, id: 'puesto-a-mano' }, crearId);
      expect(captura.id).toBe('id-1');
    });

    it('si el id creado ya existe, crea otro: nunca se repite', () => {
      crearCaptura(almacen, 'ana', TEIDE, () => 'repetido');
      const otroId = vi.fn().mockReturnValueOnce('repetido').mockReturnValueOnce('nuevo');
      const captura = crearCaptura(almacen, 'ana', TORMENTA, otroId);
      expect(captura.id).toBe('nuevo');
      expect(otroId).toHaveBeenCalledTimes(2);
    });

    it('sin crearId, usa crypto.randomUUID() y los ids son distintos', () => {
      const primera = crearCaptura(almacen, 'ana', TEIDE);
      const segunda = crearCaptura(almacen, 'ana', TORMENTA);
      expect(primera.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
      );
      expect(primera.id).not.toBe(segunda.id);
    });
  });

  describe('cada usuario ve solo las suyas', () => {
    beforeEach(() => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      crearCaptura(almacen, 'luis', TORMENTA, crearId);
    });

    it('cada uno lista solo sus capturas', () => {
      expect(listarCapturas(almacen, 'ana')).toEqual([{ ...TEIDE, id: 'id-1' }]);
      expect(listarCapturas(almacen, 'luis')).toEqual([{ ...TORMENTA, id: 'id-2' }]);
    });

    it('«Ana» ve las capturas de «ana»', () => {
      expect(listarCapturas(almacen, 'Ana')).toEqual([{ ...TEIDE, id: 'id-1' }]);
    });

    it('no se encuentra una captura de otro usuario por su id', () => {
      expect(buscarCaptura(almacen, 'ana', 'id-2')).toBeNull();
    });

    it('no se puede editar una captura de otro usuario', () => {
      expect(actualizarCaptura(almacen, 'ana', 'id-2', ATARDECER)).toBeNull();
      expect(listarCapturas(almacen, 'luis')).toEqual([{ ...TORMENTA, id: 'id-2' }]);
    });

    it('no se puede borrar una captura de otro usuario', () => {
      expect(borrarCaptura(almacen, 'ana', 'id-2')).toBe(false);
      expect(listarCapturas(almacen, 'luis')).toHaveLength(1);
    });
  });

  describe('buscar', () => {
    it('encuentra una captura por su id', () => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      crearCaptura(almacen, 'ana', TORMENTA, crearId);
      expect(buscarCaptura(almacen, 'ana', 'id-2')).toEqual({ ...TORMENTA, id: 'id-2' });
    });

    it('devuelve null si el id no existe', () => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      expect(buscarCaptura(almacen, 'ana', 'no-existe')).toBeNull();
    });
  });

  describe('actualizar', () => {
    beforeEach(() => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      crearCaptura(almacen, 'ana', TORMENTA, crearId);
    });

    it('sustituye los datos, conserva el id y devuelve la captura', () => {
      expect(actualizarCaptura(almacen, 'ana', 'id-1', ATARDECER)).toEqual({
        ...ATARDECER,
        id: 'id-1',
      });
      expect(buscarCaptura(almacen, 'ana', 'id-1')).toEqual({ ...ATARDECER, id: 'id-1' });
    });

    it('conserva su posición en la lista', () => {
      actualizarCaptura(almacen, 'ana', 'id-1', ATARDECER);
      expect(listarCapturas(almacen, 'ana').map((captura) => captura.id)).toEqual(['id-1', 'id-2']);
    });

    it('no deja cambiar el id aunque los datos traigan otro', () => {
      const captura = actualizarCaptura(almacen, 'ana', 'id-1', { ...ATARDECER, id: 'otro' });
      expect(captura.id).toBe('id-1');
    });

    it('devuelve null y no cambia nada si el id no existe', () => {
      const antes = almacen.getItem(claveCapturas('ana'));
      expect(actualizarCaptura(almacen, 'ana', 'no-existe', ATARDECER)).toBeNull();
      expect(almacen.getItem(claveCapturas('ana'))).toBe(antes);
    });
  });

  describe('borrar', () => {
    beforeEach(() => {
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      crearCaptura(almacen, 'ana', TORMENTA, crearId);
    });

    it('borra la captura y devuelve true', () => {
      expect(borrarCaptura(almacen, 'ana', 'id-1')).toBe(true);
      expect(listarCapturas(almacen, 'ana')).toEqual([{ ...TORMENTA, id: 'id-2' }]);
    });

    it('devuelve false y no cambia nada si el id no existe', () => {
      expect(borrarCaptura(almacen, 'ana', 'no-existe')).toBe(false);
      expect(listarCapturas(almacen, 'ana')).toHaveLength(2);
    });

    it('al borrar la última, la lista queda vacía', () => {
      borrarCaptura(almacen, 'ana', 'id-1');
      borrarCaptura(almacen, 'ana', 'id-2');
      expect(listarCapturas(almacen, 'ana')).toEqual([]);
    });
  });

  describe('datos estropeados: las lecturas no fallan', () => {
    it.each([
      ['un texto que no es JSON', '[{"id": "id-1",'],
      ['un objeto en lugar de una lista', '{"id": "id-1"}'],
      ['un número', '42'],
      ['null', 'null'],
      ['un texto JSON', '"hola"'],
    ])('con %s, la lista está vacía', (_motivo, texto) => {
      almacen.setItem(claveCapturas('ana'), texto);
      expect(listarCapturas(almacen, 'ana')).toEqual([]);
      expect(buscarCaptura(almacen, 'ana', 'id-1')).toBeNull();
    });

    it('descarta las entradas que no son capturas y se queda con las buenas', () => {
      almacen.setItem(
        claveCapturas('ana'),
        JSON.stringify([
          null,
          'texto',
          42,
          ['una', 'lista'],
          { titulo: 'sin id' },
          { id: '', titulo: 'id vacío' },
          { id: 7, titulo: 'id que no es texto' },
          { id: 'id-1', titulo: 'buena' },
        ]),
      );
      expect(listarCapturas(almacen, 'ana')).toEqual([{ id: 'id-1', titulo: 'buena' }]);
    });

    it('con datos estropeados se puede crear una captura y quedan solo las buenas', () => {
      almacen.setItem(
        claveCapturas('ana'),
        JSON.stringify([null, { id: 'id-9', titulo: 'buena' }]),
      );
      crearCaptura(almacen, 'ana', TEIDE, crearId);
      expect(listarCapturas(almacen, 'ana')).toEqual([
        { id: 'id-9', titulo: 'buena' },
        { ...TEIDE, id: 'id-1' },
      ]);
    });

    it('si el almacenamiento está bloqueado, la lista está vacía', () => {
      expect(listarCapturas(new AlmacenBloqueado(), 'ana')).toEqual([]);
    });
  });

  describe('si el almacenamiento no deja guardar', () => {
    it.each([
      ['crear', (lleno) => crearCaptura(lleno, 'ana', TEIDE, crearId)],
      ['actualizar', (lleno) => actualizarCaptura(lleno, 'ana', 'id-1', ATARDECER)],
      ['borrar', (lleno) => borrarCaptura(lleno, 'ana', 'id-1')],
    ])('%s lanza un error que se puede enseñar', (_accion, accion) => {
      const lleno = new AlmacenLleno();
      // Se mete una captura saltándose el setItem que falla, para que haya algo que editar o borrar
      AlmacenFalso.prototype.setItem.call(
        lleno,
        claveCapturas('ana'),
        JSON.stringify([{ ...TEIDE, id: 'id-1' }]),
      );
      expect(() => accion(lleno)).toThrow(
        'No se ha podido guardar la captura: el almacenamiento está lleno o bloqueado.',
      );
    });
  });
});
