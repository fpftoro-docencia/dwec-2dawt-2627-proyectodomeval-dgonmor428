// Test de integración de la página de registro: registro.html en happy-dom con sus módulos reales.
// Solo se sustituyen el almacenamiento (AlmacenFalso), el resumen de la contraseña y la navegación.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarRegistro, PAGINA_TRAS_REGISTRO } from '../../js/paginas/registro.js';
import { registrarUsuario, listarUsuarios, CLAVE_USUARIOS } from '../../js/usuarios.js';
import { leerSesion } from '../../js/sesion.js';
import { CLAVE_AVISO_PENDIENTE, guardarAvisoPendiente } from '../../js/avisos.js';

const resumirFalso = async (clave) => `resumen-${clave}`;

describe('página de registro', () => {
  let almacenUsuarios;
  let almacenSesion;
  let navegar;
  let formulario;
  let campos;

  function iniciar(resumir = resumirFalso) {
    iniciarRegistro({ documento: document, almacenUsuarios, almacenSesion, navegar, resumir });
    formulario = document.querySelector('#form-registro');
    campos = formulario.elements;
  }

  function rellenar({
    usuario = 'ana',
    correo = 'ana@ejemplo.es',
    clave = 'Nebulosa42',
    repetir = clave,
    acepto = true,
  } = {}) {
    escribir(campos.usuario, usuario);
    escribir(campos.correo, correo);
    escribir(campos.clave, clave);
    escribir(campos.repetir, repetir);
    campos.acepto.checked = acepto;
  }

  const textoAvisos = () => document.querySelector('#avisos').textContent;
  const avisoPendiente = () => JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE));
  const errorDe = (nombre) => document.querySelector(`#registro-${nombre}-error`).textContent;

  beforeEach(() => {
    cargarPagina('registro.html');
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    navegar = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('requisitos de la contraseña mientras se escribe', () => {
    const cumple = (requisito) =>
      document.querySelector(`[data-requisito="${requisito}"]`).dataset.cumple;

    it('antes de escribir no hay ninguno marcado', () => {
      iniciar();
      expect(cumple('longitud')).toBeUndefined();
    });

    it('marca los que cumple y los que no', () => {
      iniciar();
      escribir(campos.clave, 'abc');
      expect(cumple('longitud')).toBe('false');
      expect(cumple('minuscula')).toBe('true');
      expect(cumple('mayuscula')).toBe('false');
      expect(cumple('cifra')).toBe('false');

      escribir(campos.clave, 'Abcdefg1');
      expect(['longitud', 'minuscula', 'mayuscula', 'cifra'].map(cumple)).toEqual([
        'true',
        'true',
        'true',
        'true',
      ]);
    });
  });

  describe('registro correcto', () => {
    it('el primero: guarda el resumen, abre la sesión de administrador, avisa y va al listado', async () => {
      iniciar();
      rellenar({ correo: '  ana@ejemplo.es  ' });
      formulario.requestSubmit();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());

      expect(navegar).toHaveBeenCalledExactlyOnceWith(PAGINA_TRAS_REGISTRO);
      const guardado = JSON.parse(almacenUsuarios.getItem(CLAVE_USUARIOS));
      expect(guardado).toEqual([
        {
          nombre: 'ana',
          correo: 'ana@ejemplo.es',
          resumen: 'resumen-Nebulosa42',
          rol: 'administrador',
        },
      ]);
      expect(almacenUsuarios.getItem(CLAVE_USUARIOS)).not.toContain('"clave"');
      expect(leerSesion(almacenSesion)).toEqual({ nombre: 'ana', rol: 'administrador' });
      expect(avisoPendiente().tipo).toBe('exito');
      expect(avisoPendiente().mensaje).toContain('Te has registrado');
      expect(avisoPendiente().mensaje).toContain('administras Horizonte');
    });

    it('el segundo se registra como usuario, sin el mensaje de administrador', async () => {
      await registrarUsuario(almacenUsuarios, {
        nombre: 'ana',
        correo: 'a@ejemplo.es',
        clave: 'x',
      });
      iniciar();
      rellenar({ usuario: 'luis', correo: 'luis@ejemplo.es' });
      formulario.requestSubmit();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());

      expect(leerSesion(almacenSesion)).toEqual({ nombre: 'luis', rol: 'usuario' });
      expect(avisoPendiente().mensaje).not.toContain('administras');
    });
  });

  describe('errores al enviar', () => {
    it('con todo vacío: marca cada campo, avisa, lleva el foco al primero y no registra', () => {
      iniciar();
      formulario.requestSubmit();

      for (const nombre of ['usuario', 'correo', 'clave', 'repetir', 'acepto']) {
        expect(campos[nombre].classList.contains('is-invalid')).toBe(true);
        expect(campos[nombre].getAttribute('aria-invalid')).toBe('true');
        expect(errorDe(nombre)).not.toBe('');
      }
      expect(errorDe('usuario')).toBe('Usa de 3 a 20 letras, cifras o _.');
      expect(errorDe('repetir')).toBe('Repite la contraseña.'); // vacía no «coincide» con otra vacía
      expect(errorDe('acepto')).toBe('Tienes que aceptar las condiciones.');
      expect(textoAvisos()).toContain('Revisa los campos marcados en rojo.');
      expect(document.activeElement).toBe(campos.usuario);
      expect(listarUsuarios(almacenUsuarios)).toEqual([]);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('cada caja de error está enlazada a su campo con aria-describedby', () => {
      iniciar();
      for (const nombre of ['usuario', 'correo', 'clave', 'repetir', 'acepto']) {
        expect(campos[nombre].getAttribute('aria-describedby')).toContain(
          `registro-${nombre}-error`,
        );
      }
    });

    it('un nombre ocupado (sin distinguir mayúsculas) no se registra', async () => {
      await registrarUsuario(almacenUsuarios, {
        nombre: 'ana',
        correo: 'a@ejemplo.es',
        clave: 'x',
      });
      iniciar();
      rellenar({ usuario: 'ANA' });
      formulario.requestSubmit();

      expect(errorDe('usuario')).toBe('Ese nombre ya está en uso.');
      expect(document.activeElement).toBe(campos.usuario);
      expect(listarUsuarios(almacenUsuarios)).toHaveLength(1);
      expect(navegar).not.toHaveBeenCalled();
    });

    it.each([
      ['correo', { correo: 'ana@ejemplo' }, 'Escribe un correo válido.'],
      [
        'clave',
        { clave: 'corta1A', repetir: 'corta1A' },
        'La contraseña no cumple todos los requisitos.',
      ],
      ['repetir', { repetir: 'Nebulosa43' }, 'Las contraseñas no coinciden.'],
      ['acepto', { acepto: false }, 'Tienes que aceptar las condiciones.'],
    ])('si solo falla «%s», marca ese campo y le da el foco', (nombre, datos, mensaje) => {
      iniciar();
      rellenar(datos);
      formulario.requestSubmit();

      expect(errorDe(nombre)).toBe(mensaje);
      expect(document.activeElement).toBe(campos[nombre]);
      expect(navegar).not.toHaveBeenCalled();
    });
  });

  describe('después de un error', () => {
    it('al corregir un campo, su error desaparece mientras se escribe', () => {
      iniciar();
      formulario.requestSubmit();
      expect(campos.usuario.classList.contains('is-invalid')).toBe(true);

      escribir(campos.usuario, 'ana');
      expect(campos.usuario.classList.contains('is-invalid')).toBe(false);
      expect(campos.usuario.getAttribute('aria-invalid')).toBe('false');
      expect(errorDe('usuario')).toBe('');
    });

    it('al cambiar la contraseña se revisa también «repetir»', () => {
      iniciar();
      rellenar({ clave: 'Nebulosa42', repetir: 'Nebulosa43' });
      formulario.requestSubmit();
      expect(errorDe('repetir')).toBe('Las contraseñas no coinciden.');

      escribir(campos.clave, 'Nebulosa43');
      expect(errorDe('repetir')).toBe('');
    });

    it('al marcar la casilla, su error desaparece', () => {
      iniciar();
      rellenar({ acepto: false });
      formulario.requestSubmit();
      campos.acepto.checked = true;
      campos.acepto.dispatchEvent(new Event('change', { bubbles: true }));
      expect(errorDe('acepto')).toBe('');
    });
  });

  describe('sin doble envío', () => {
    it('mientras se calcula el resumen, un segundo envío no hace nada', async () => {
      let terminarResumen;
      const resumirLento = vi.fn(
        (clave) =>
          new Promise((resolver) => {
            terminarResumen = () => resolver(`resumen-${clave}`);
          }),
      );
      iniciar(resumirLento);
      rellenar();
      const boton = formulario.querySelector('button[type="submit"]');

      formulario.requestSubmit();
      // Estado de envío: botón desactivado y formulario ocupado
      expect(boton.disabled).toBe(true);
      expect(formulario.hasAttribute('aria-busy')).toBe(true);

      formulario.requestSubmit(); // otro clic o Intro
      formulario.requestSubmit();
      expect(resumirLento).toHaveBeenCalledTimes(1);

      terminarResumen();
      await vi.waitFor(() => expect(navegar).toHaveBeenCalled());
      expect(navegar).toHaveBeenCalledTimes(1);
      expect(listarUsuarios(almacenUsuarios)).toHaveLength(1);
    });
  });

  describe('si no se puede guardar', () => {
    it('avisa del error, sale del estado de envío y no navega', async () => {
      almacenUsuarios.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      iniciar();
      rellenar();
      formulario.requestSubmit();
      const boton = formulario.querySelector('button[type="submit"]');
      await vi.waitFor(() => expect(boton.disabled).toBe(false));

      expect(textoAvisos()).toContain('No se ha podido guardar el usuario');
      expect(formulario.hasAttribute('aria-busy')).toBe(false);
      expect(boton.textContent).toBe('Crear mi cuenta');
      expect(navegar).not.toHaveBeenCalled();
    });
  });

  describe('avisos', () => {
    it('muestra al cargar un aviso que dejó la página anterior', () => {
      guardarAvisoPendiente(almacenSesion, 'Has cerrado la sesión.', 'info');
      iniciar();
      expect(textoAvisos()).toContain('Has cerrado la sesión.');
    });
  });
});
