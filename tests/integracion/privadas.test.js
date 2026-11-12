// Test de integración de las páginas privadas (listado, ficha y usuarios): la protección por sesión
// y por rol y la cabecera común, con el HTML real en happy-dom. Solo se sustituyen el
// almacenamiento (AlmacenFalso) y la navegación (vi.fn()).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  iniciarPaginaPrivada,
  PAGINA_DE_ENTRADA,
  PAGINA_SIN_PERMISO,
} from '../../js/paginas/privada.js';
import { iniciarSesion, leerSesion, CLAVE_SESION } from '../../js/sesion.js';
import { CLAVE_AVISO_PENDIENTE, guardarAvisoPendiente } from '../../js/avisos.js';

const ANA = { nombre: 'ana', rol: 'administrador' };
const LUIS = { nombre: 'luis', rol: 'usuario' };

describe('páginas privadas', () => {
  let almacenSesion;
  let reemplazar;

  function iniciar(pagina, soloAdministradores = pagina === 'usuarios.html') {
    cargarPagina(pagina);
    return iniciarPaginaPrivada({
      documento: document,
      almacenSesion,
      reemplazar,
      soloAdministradores,
    });
  }

  const texto = (selector) => document.querySelector(selector).textContent;
  const itemUsuarios = () => document.querySelector('a[href="usuarios.html"]').closest('li');
  const avisoPendiente = () => JSON.parse(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE));

  beforeEach(() => {
    almacenSesion = new AlmacenFalso();
    reemplazar = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe.each(['listado.html', 'ficha.html', 'usuarios.html'])('%s', (pagina) => {
    it('sin sesión, lleva a index.html con replace y no rellena la cabecera', () => {
      expect(iniciar(pagina)).toBeNull();
      expect(reemplazar).toHaveBeenCalledExactlyOnceWith(PAGINA_DE_ENTRADA);
      expect(texto('#sesion-nombre')).toBe('');
    });

    it('con la sesión estropeada, también lleva a index.html', () => {
      almacenSesion.setItem(CLAVE_SESION, '{"nombre":"ana","rol":"jefe"}');
      expect(iniciar(pagina)).toBeNull();
      expect(reemplazar).toHaveBeenCalledExactlyOnceWith(PAGINA_DE_ENTRADA);
    });

    it('a un administrador le muestra su nombre, su rol y «Usuarios»', () => {
      iniciarSesion(almacenSesion, ANA);
      expect(iniciar(pagina)).toEqual(ANA);
      expect(reemplazar).not.toHaveBeenCalled();
      expect(texto('#sesion-nombre')).toBe('ana');
      expect(texto('#sesion-rol')).toBe('Administrador');
      expect(itemUsuarios().hidden).toBe(false);
    });

    it('«Cerrar sesión» borra la sesión, deja un aviso y vuelve a index.html', () => {
      iniciarSesion(almacenSesion, ANA);
      iniciar(pagina);
      document.querySelector('#cerrar-sesion').click();

      expect(leerSesion(almacenSesion)).toBeNull();
      expect(avisoPendiente().mensaje).toContain('Has cerrado la sesión');
      expect(reemplazar).toHaveBeenCalledExactlyOnceWith(PAGINA_DE_ENTRADA);
    });

    it('muestra el aviso que dejó la página anterior', () => {
      iniciarSesion(almacenSesion, ANA);
      guardarAvisoPendiente(almacenSesion, 'Te has registrado.', 'exito');
      iniciar(pagina);
      expect(texto('#avisos')).toContain('Te has registrado.');
      expect(almacenSesion.getItem(CLAVE_AVISO_PENDIENTE)).toBeNull();
    });
  });

  describe.each(['listado.html', 'ficha.html'])('%s con un usuario normal', (pagina) => {
    it('se queda, ve su nombre y su rol y no ve «Usuarios»', () => {
      iniciarSesion(almacenSesion, LUIS);
      expect(iniciar(pagina)).toEqual(LUIS);
      expect(reemplazar).not.toHaveBeenCalled();
      expect(texto('#sesion-nombre')).toBe('luis');
      expect(texto('#sesion-rol')).toBe('Usuario');
      expect(itemUsuarios().hidden).toBe(true);
    });
  });

  describe('usuarios.html (solo administradores)', () => {
    it('un usuario normal vuelve al listado con un aviso de error, sin ver la página', () => {
      iniciarSesion(almacenSesion, LUIS);
      expect(iniciar('usuarios.html')).toBeNull();
      expect(reemplazar).toHaveBeenCalledExactlyOnceWith(PAGINA_SIN_PERMISO);
      expect(avisoPendiente()).toEqual({
        mensaje: 'La página de usuarios es solo para administradores.',
        tipo: 'error',
      });
      expect(texto('#sesion-nombre')).toBe('');
      expect(leerSesion(almacenSesion)).toEqual(LUIS); // no se le cierra la sesión
    });

    it('un administrador se queda', () => {
      iniciarSesion(almacenSesion, ANA);
      expect(iniciar('usuarios.html')).toEqual(ANA);
      expect(reemplazar).not.toHaveBeenCalled();
    });

    it('el aviso de error se ve al llegar al listado', () => {
      iniciarSesion(almacenSesion, LUIS);
      iniciar('usuarios.html');
      reemplazar.mockClear();
      iniciar('listado.html');
      expect(texto('#avisos')).toContain('La página de usuarios es solo para administradores.');
    });
  });

  describe('páginas que no son solo para administradores', () => {
    it('por defecto no exigen ser administrador', () => {
      cargarPagina('listado.html');
      iniciarSesion(almacenSesion, LUIS);
      expect(iniciarPaginaPrivada({ documento: document, almacenSesion, reemplazar })).toEqual(
        LUIS,
      );
    });
  });

  describe('cabecera', () => {
    it('el nombre entra como texto, nunca como HTML', () => {
      almacenSesion.setItem(CLAVE_SESION, '{"nombre":"<b>ana</b>","rol":"usuario"}');
      iniciar('listado.html');
      expect(document.querySelector('#sesion-nombre b')).toBeNull();
      expect(texto('#sesion-nombre')).toBe('<b>ana</b>');
    });
  });
});
