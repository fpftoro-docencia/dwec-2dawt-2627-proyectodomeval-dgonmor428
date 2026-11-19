// Tests del módulo de usuarios (js/usuarios.js) con AlmacenFalso.
import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { resumirClave } from '../../js/clave.js';
import {
  CLAVE_USUARIOS,
  ROLES,
  listarUsuarios,
  nombreOcupado,
  registrarUsuario,
  comprobarCredenciales,
} from '../../js/usuarios.js';

const ANA = { nombre: 'ana', correo: 'ana@ejemplo.es', clave: 'Nebulosa42' };
const LUIS = { nombre: 'luis', correo: 'luis@ejemplo.es', clave: 'Galaxia2026' };
const EVA = { nombre: 'eva', correo: 'eva@ejemplo.es', clave: 'Aurora7x' };

describe('usuarios', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('guardar y leer', () => {
    it('sin usuarios, la lista está vacía', () => {
      expect(listarUsuarios(almacen)).toEqual([]);
    });

    it('un usuario registrado aparece en la lista, sin el resumen', async () => {
      await registrarUsuario(almacen, ANA);
      expect(listarUsuarios(almacen)).toEqual([
        { nombre: 'ana', correo: 'ana@ejemplo.es', rol: ROLES.ADMINISTRADOR },
      ]);
    });

    it('registrar devuelve el usuario sin el resumen', async () => {
      const usuario = await registrarUsuario(almacen, ANA);
      expect(usuario).toEqual({
        nombre: 'ana',
        correo: 'ana@ejemplo.es',
        rol: ROLES.ADMINISTRADOR,
      });
      expect(usuario).not.toHaveProperty('resumen');
    });

    it('se guarda en su clave como JSON, con el resumen y nunca la contraseña', async () => {
      await registrarUsuario(almacen, ANA);
      const texto = almacen.getItem(CLAVE_USUARIOS);
      expect(texto).not.toContain(ANA.clave);
      expect(JSON.parse(texto)[0].resumen).toBe(await resumirClave(ANA.clave));
    });

    it('conserva el orden de registro', async () => {
      await registrarUsuario(almacen, ANA);
      await registrarUsuario(almacen, LUIS);
      await registrarUsuario(almacen, EVA);
      expect(listarUsuarios(almacen).map((usuario) => usuario.nombre)).toEqual([
        'ana',
        'luis',
        'eva',
      ]);
    });
  });

  describe('roles', () => {
    it('el primer usuario es administrador y los demás, usuarios', async () => {
      expect((await registrarUsuario(almacen, ANA)).rol).toBe(ROLES.ADMINISTRADOR);
      expect((await registrarUsuario(almacen, LUIS)).rol).toBe(ROLES.USUARIO);
      expect((await registrarUsuario(almacen, EVA)).rol).toBe(ROLES.USUARIO);
    });
  });

  describe('nombre repetido', () => {
    beforeEach(async () => {
      await registrarUsuario(almacen, ANA);
    });

    it.each([
      ['ana', 'el mismo nombre'],
      ['ANA', 'en mayúsculas'],
      ['Ana', 'con la primera en mayúscula'],
    ])('«%s» está ocupado (%s)', (nombre) => {
      expect(nombreOcupado(almacen, nombre)).toBe(true);
    });

    it('un nombre nuevo no está ocupado', () => {
      expect(nombreOcupado(almacen, 'luis')).toBe(false);
    });

    it('no deja registrar un nombre ocupado y no cambia la lista', async () => {
      await expect(registrarUsuario(almacen, { ...LUIS, nombre: 'ANA' })).rejects.toThrow(
        'Ese nombre ya está en uso.',
      );
      expect(listarUsuarios(almacen)).toHaveLength(1);
    });

    it('si el nombre se ocupa mientras se calcula el resumen, tampoco lo registra', async () => {
      // Un resumen «lento» durante el cual otro registro guarda el mismo nombre
      const resumirMientrasOtroSeRegistra = async (clave) => {
        await registrarUsuario(almacen, { ...LUIS });
        return resumirClave(clave);
      };
      await expect(
        registrarUsuario(almacen, { ...EVA, nombre: 'luis' }, resumirMientrasOtroSeRegistra),
      ).rejects.toThrow('Ese nombre ya está en uso.');
      expect(listarUsuarios(almacen).map((usuario) => usuario.nombre)).toEqual(['ana', 'luis']);
    });
  });

  describe('comprobar la contraseña', () => {
    beforeEach(async () => {
      await registrarUsuario(almacen, ANA);
      await registrarUsuario(almacen, LUIS);
    });

    it('con la contraseña correcta devuelve el usuario, sin el resumen', async () => {
      expect(await comprobarCredenciales(almacen, 'luis', LUIS.clave)).toEqual({
        nombre: 'luis',
        correo: 'luis@ejemplo.es',
        rol: ROLES.USUARIO,
      });
    });

    it('el nombre no distingue mayúsculas', async () => {
      expect(await comprobarCredenciales(almacen, 'ANA', ANA.clave)).not.toBeNull();
    });

    it.each([
      ['otra contraseña', 'Galaxia2026'],
      ['la misma con otra mayúscula', 'nebulosa42'],
      ['vacía', ''],
    ])('con una contraseña incorrecta (%s) devuelve null', async (_motivo, clave) => {
      expect(await comprobarCredenciales(almacen, 'ana', clave)).toBeNull();
    });

    it('con un usuario que no existe devuelve null', async () => {
      expect(await comprobarCredenciales(almacen, 'nadie', 'Nebulosa42')).toBeNull();
    });
  });

  describe('sustituir el resumen (para los tests de integración)', () => {
    const resumirFalso = async (clave) => `falso-${clave}`;

    it('registra y comprueba con la función de resumen que se le pasa', async () => {
      await registrarUsuario(almacen, ANA, resumirFalso);
      expect(JSON.parse(almacen.getItem(CLAVE_USUARIOS))[0].resumen).toBe('falso-Nebulosa42');
      expect(await comprobarCredenciales(almacen, 'ana', ANA.clave, resumirFalso)).not.toBeNull();
      expect(await comprobarCredenciales(almacen, 'ana', 'otra', resumirFalso)).toBeNull();
    });
  });

  describe('datos estropeados', () => {
    it.each([
      ['texto que no es JSON', 'no es json'],
      ['un objeto en lugar de una lista', '{"nombre":"ana"}'],
      ['un número', '42'],
      ['null', 'null'],
    ])('con %s, la lista está vacía', (_motivo, texto) => {
      almacen.setItem(CLAVE_USUARIOS, texto);
      expect(listarUsuarios(almacen)).toEqual([]);
      expect(nombreOcupado(almacen, 'ana')).toBe(false);
    });

    it('descarta las entradas estropeadas y conserva las buenas', () => {
      const buena = {
        nombre: 'ana',
        correo: 'ana@ejemplo.es',
        resumen: 'abc',
        rol: 'administrador',
      };
      almacen.setItem(
        CLAVE_USUARIOS,
        JSON.stringify([
          null,
          42,
          'ana',
          { nombre: 'sin-resumen', correo: 'x@ejemplo.es', rol: 'usuario' },
          { nombre: 'rol-inventado', correo: 'x@ejemplo.es', resumen: 'abc', rol: 'jefe' },
          { nombre: 7, correo: 'x@ejemplo.es', resumen: 'abc', rol: 'usuario' },
          buena,
        ]),
      );
      expect(listarUsuarios(almacen)).toEqual([
        { nombre: 'ana', correo: 'ana@ejemplo.es', rol: 'administrador' },
      ]);
    });

    it('si todo está estropeado, el siguiente registro es el primero y es administrador', async () => {
      almacen.setItem(CLAVE_USUARIOS, '[{"roto":true}]');
      expect((await registrarUsuario(almacen, ANA)).rol).toBe(ROLES.ADMINISTRADOR);
      expect(listarUsuarios(almacen)).toHaveLength(1);
    });

    it('un usuario estropeado no puede iniciar sesión', async () => {
      almacen.setItem(CLAVE_USUARIOS, '[{"nombre":"ana","correo":"a@ejemplo.es","rol":"usuario"}]');
      expect(await comprobarCredenciales(almacen, 'ana', '')).toBeNull();
    });
  });

  describe('almacenamiento lleno', () => {
    it('registrar falla con un mensaje claro', async () => {
      const lleno = new AlmacenFalso();
      lleno.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      await expect(registrarUsuario(lleno, ANA)).rejects.toThrow(
        'No se ha podido guardar el usuario',
      );
    });
  });
});
