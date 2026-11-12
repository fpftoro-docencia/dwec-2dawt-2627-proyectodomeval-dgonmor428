// Test de integración de la página de inicio de sesión: index.html en happy-dom con sus módulos
// reales. Solo se sustituyen el almacenamiento (AlmacenFalso), el resumen y la navegación.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  iniciarEntrar,
  PAGINA_TRAS_ENTRAR,
  MENSAJE_CREDENCIALES,
} from '../../js/paginas/entrar.js';
import { registrarUsuario } from '../../js/usuarios.js';
import { iniciarSesion, leerSesion, CLAVE_SESION } from '../../js/sesion.js';
import { CLAVE_AVISO_PENDIENTE, guardarAvisoPendiente } from '../../js/avisos.js';

const resumirFalso = async (clave) => `resumen-${clave}`;

describe('página de inicio de sesión', () => {
  let almacenUsuarios;
  let almacenSesion;
  let navegar;
  let formulario;
  let campos;

  function iniciar(resumir = resumirFalso) {
    const resultado = iniciarEntrar({
      documento: document,
      almacenUsuarios,
      almacenSesion,
      navegar,
      resumir,
    });
    formulario = document.querySelector('#form-entrar');
    campos = formulario.elements;
    return resultado;
  }

  const textoAvisos = () => document.querySelector('#avisos').textContent;
  const errorDe = (nombre) => document.querySelector(`#entrar-${nombre}-error`).textContent;

  beforeEach(async () => {
    cargarPagina('index.html');
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    navegar = vi.fn();
    await registrarUsuario(
      almacenUsuarios,
      { nombre: 'ana', correo: 'ana@ejemplo.es', clave: 'Nebulosa42' },
      resumirFalso,
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('con una sesión ya abierta', () => {
    it('va directamente al listado', () => {
      iniciarSesion(almacenSesion, { nombre: 'ana', rol: 'administrador' });
      expect(iniciar()).toBe(false);
      expect(navegar).toHaveBeenCalledExactlyOnceWith(PAGINA_TRAS_ENTRAR);
    });

    it('si la sesión guardada está estropeada, se queda para entrar', () => {
      almacenSesion.setItem(CLAVE_SESION, 'roto');
      expect(iniciar()).toBe(true);
      expect(navegar).not.toHaveBeenCalled();
    });
  });

  describe('entrar con los datos correctos', () => {
    it('abre la sesión, deja un aviso de bienvenida y va al listado', async () => {
      iniciar();
      escribir(campos.usuario, 'ana');
      escribir(campos.clave, 'Nebulosa42');
      formulario.requestSubmit();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());

      expect(navegar).toHaveBeenCalledExactlyOnceWith(PAGINA_TRAS_ENTRAR);
      expect(leerSesion(almacenSesion)).toEqual({ nombre: 'ana', rol: 'administrador' });
      expect(JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE))).toEqual({
        mensaje: 'Hola de nuevo, ana.',
        tipo: 'exito',
      });
    });

    it('el nombre no distingue mayúsculas y se le quitan los espacios', async () => {
      iniciar();
      escribir(campos.usuario, '  ANA  ');
      escribir(campos.clave, 'Nebulosa42');
      formulario.requestSubmit();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());
      expect(leerSesion(almacenSesion).nombre).toBe('ana');
    });
  });

  describe('contraseña incorrecta', () => {
    it.each([
      ['otra contraseña', 'ana', 'Galaxia2026'],
      ['un usuario que no existe', 'nadie', 'Nebulosa42'],
    ])('con %s: avisa, vacía la contraseña y le da el foco', async (_motivo, usuario, clave) => {
      iniciar();
      escribir(campos.usuario, usuario);
      escribir(campos.clave, clave);
      formulario.requestSubmit();
      await vi.waitFor(() => expect(textoAvisos()).toContain(MENSAJE_CREDENCIALES));

      expect(campos.clave.value).toBe('');
      expect(document.activeElement).toBe(campos.clave);
      expect(campos.usuario.value).toBe(usuario); // el nombre se conserva
      expect(leerSesion(almacenSesion)).toBeNull();
      expect(navegar).not.toHaveBeenCalled();
    });

    it('sale del estado de envío para poder intentarlo otra vez', async () => {
      iniciar();
      const boton = formulario.querySelector('button[type="submit"]');
      escribir(campos.usuario, 'ana');
      escribir(campos.clave, 'mal');
      formulario.requestSubmit();
      await vi.waitFor(() => expect(textoAvisos()).toContain(MENSAJE_CREDENCIALES));

      expect(boton.disabled).toBe(false);
      expect(boton.textContent).toBe('Entrar en mi diario');
      expect(formulario.hasAttribute('aria-busy')).toBe(false);

      escribir(campos.clave, 'Nebulosa42');
      formulario.requestSubmit();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());
    });
  });

  describe('campos vacíos', () => {
    it('sin nada escrito: marca los dos campos, avisa y da el foco al nombre', () => {
      iniciar();
      formulario.requestSubmit();

      expect(errorDe('usuario')).toBe('Escribe tu nombre de usuario.');
      expect(errorDe('clave')).toBe('Escribe tu contraseña.');
      expect(campos.usuario.getAttribute('aria-invalid')).toBe('true');
      expect(campos.clave.classList.contains('is-invalid')).toBe(true);
      expect(textoAvisos()).toContain('Rellena los campos marcados en rojo.');
      expect(document.activeElement).toBe(campos.usuario);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('un nombre de solo espacios cuenta como vacío', () => {
      iniciar();
      escribir(campos.usuario, '   ');
      escribir(campos.clave, 'Nebulosa42');
      formulario.requestSubmit();
      expect(errorDe('usuario')).toBe('Escribe tu nombre de usuario.');
    });

    it('con solo la contraseña vacía, el foco va a la contraseña', () => {
      iniciar();
      escribir(campos.usuario, 'ana');
      formulario.requestSubmit();
      expect(errorDe('usuario')).toBe('');
      expect(document.activeElement).toBe(campos.clave);
    });

    it('al escribir en un campo marcado, su error desaparece', () => {
      iniciar();
      formulario.requestSubmit();
      escribir(campos.usuario, 'ana');
      expect(errorDe('usuario')).toBe('');
      expect(campos.usuario.classList.contains('is-invalid')).toBe(false);
    });

    it('cada caja de error está enlazada a su campo con aria-describedby', () => {
      iniciar();
      expect(campos.usuario.getAttribute('aria-describedby')).toBe('entrar-usuario-error');
      expect(campos.clave.getAttribute('aria-describedby')).toBe('entrar-clave-error');
    });
  });

  describe('validación en tiempo real', () => {
    it('al salir de un campo vacío se avisa de que falta', () => {
      iniciar();
      salir(campos.usuario);
      expect(errorDe('usuario')).toBe('Escribe tu nombre de usuario.');
      expect(errorDe('clave')).toBe(''); // el otro campo no se ha tocado
    });

    it('al salir de un nombre de solo espacios, también cuenta como vacío', () => {
      iniciar();
      escribir(campos.usuario, '   ');
      salir(campos.usuario);
      expect(errorDe('usuario')).toBe('Escribe tu nombre de usuario.');
    });

    it('después de salir, el error desaparece en cuanto se escribe', () => {
      iniciar();
      salir(campos.clave);
      expect(errorDe('clave')).toBe('Escribe tu contraseña.');
      escribir(campos.clave, 'N');
      expect(errorDe('clave')).toBe('');
    });

    it('el formulario lleva novalidate: los mensajes los pone el código', () => {
      iniciar();
      expect(formulario.hasAttribute('novalidate')).toBe(true);
    });
  });

  describe('sin doble envío', () => {
    it('mientras se calcula el resumen, otro envío (clic o Intro) no hace nada', async () => {
      let terminarResumen;
      const resumirLento = vi.fn(
        (clave) =>
          new Promise((resolver) => {
            terminarResumen = () => resolver(`resumen-${clave}`);
          }),
      );
      iniciar(resumirLento);
      const boton = formulario.querySelector('button[type="submit"]');
      escribir(campos.usuario, 'ana');
      escribir(campos.clave, 'Nebulosa42');

      formulario.requestSubmit();
      expect(boton.disabled).toBe(true);
      expect(boton.textContent).toBe('Entrando…');
      expect(formulario.hasAttribute('aria-busy')).toBe(true);

      formulario.requestSubmit();
      formulario.requestSubmit();
      expect(resumirLento).toHaveBeenCalledTimes(1);

      terminarResumen();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());
      expect(navegar).toHaveBeenCalledTimes(1);
    });
  });

  describe('avisos', () => {
    it('muestra al cargar el aviso que dejó la página anterior', () => {
      guardarAvisoPendiente(almacenSesion, 'Has cerrado la sesión.', 'info');
      iniciar();
      expect(textoAvisos()).toContain('Has cerrado la sesión.');
    });
  });
});
