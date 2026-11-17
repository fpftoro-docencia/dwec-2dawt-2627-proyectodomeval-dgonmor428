// Test de integración del cambio de rol en la zona de administración: usuarios.html en happy-dom
// con sus módulos reales. Se sustituyen el almacenamiento (AlmacenFalso), la dirección (vi.fn()) y
// el tiempo (vi.useFakeTimers() para el debounce).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaPrivada } from '../../js/paginas/privada.js';
import { iniciarUsuarios } from '../../js/paginas/usuarios.js';
import { iniciarSesion } from '../../js/sesion.js';
import { CLAVE_USUARIOS, listarUsuarios } from '../../js/usuarios.js';

const EXPLICACION =
  'No puedes quitarte el rol a ti mismo: siempre tiene que quedar un administrador.';

function guardado(nombre, rol = 'usuario') {
  const slug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  return { nombre, correo: `${slug}@ejemplo.es`, resumen: `resumen-${slug}`, rol };
}

describe('usuarios: cambiar el rol', () => {
  let almacenUsuarios;
  let almacenSesion;
  let actualizarDireccion;

  const lista = () => document.querySelector('#usuarios-lista');
  const titulo = () => document.querySelector('#usuarios-titulo');
  const fila = (nombre) => [...lista().children].find((li) => li.dataset.nombre === nombre);
  const botonDe = (nombre) => fila(nombre).querySelector('[data-accion="cambiar-rol"]');
  const aviso = () => document.querySelector('#avisos .alert');
  const rolGuardado = (nombre) =>
    listarUsuarios(almacenUsuarios).find((u) => u.nombre === nombre).rol;
  const controles = () => document.querySelector('#usuarios-controles');
  const botonPagina = (texto) =>
    [...controles().querySelectorAll('button')].find((b) => b.textContent === texto);

  function guardar(...usuarios) {
    almacenUsuarios.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
  }

  function iniciar({ busqueda = '', nombreSesion = 'ana' } = {}) {
    iniciarSesion(almacenSesion, { nombre: nombreSesion, rol: 'administrador' });
    cargarPagina('usuarios.html');
    const sesion = iniciarPaginaPrivada({
      documento: document,
      almacenSesion,
      reemplazar: vi.fn(),
      soloAdministradores: true,
    });
    iniciarUsuarios({
      documento: document,
      sesion,
      almacenUsuarios,
      busqueda,
      actualizarDireccion,
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    actualizarDireccion = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('dar y quitar el rol', () => {
    beforeEach(() => {
      guardar(guardado('ana', 'administrador'), guardado('luis'), guardado('eva', 'administrador'));
      iniciar();
    });

    it('dar el rol: se guarda, la fila se actualiza y sale un aviso de éxito', () => {
      botonDe('luis').click();
      expect(rolGuardado('luis')).toBe('administrador');
      expect(fila('luis').dataset.rol).toBe('administrador');
      expect(fila('luis').querySelector('[data-parte="rol"]').textContent).toBe('Administrador');
      expect(botonDe('luis').textContent).toBe('Quitar administrador');
      expect(botonDe('luis').getAttribute('aria-label')).toBe('Quitar administrador: luis');
      expect(aviso().classList.contains('alert-success')).toBe(true);
      expect(aviso().textContent).toContain('«luis» ahora tiene el rol de administrador.');
    });

    it('quitar el rol a otro administrador: se guarda y sale el aviso', () => {
      botonDe('eva').click();
      expect(rolGuardado('eva')).toBe('usuario');
      expect(botonDe('eva').textContent).toBe('Hacer administrador');
      expect(
        fila('eva').querySelector('[data-parte="rol"]').classList.contains('chapa--espacio'),
      ).toBe(false);
      expect(aviso().classList.contains('alert-success')).toBe(true);
      expect(aviso().textContent).toContain('«eva» ahora tiene el rol de usuario.');
    });

    it('dar el rol y volver a quitarlo deja el rol como estaba', () => {
      botonDe('luis').click();
      botonDe('luis').click();
      expect(rolGuardado('luis')).toBe('usuario');
    });

    it('solo cambia el usuario pulsado: los demás y su resumen quedan igual', () => {
      botonDe('luis').click();
      const guardados = JSON.parse(almacenUsuarios.getItem(CLAVE_USUARIOS));
      expect(guardados).toEqual([
        guardado('ana', 'administrador'),
        { ...guardado('luis'), rol: 'administrador' },
        guardado('eva', 'administrador'),
      ]);
    });

    it('un clic en otra parte de la fila no hace nada', () => {
      fila('luis').querySelector('[data-parte="nombre"]').click();
      fila('luis').click();
      expect(rolGuardado('luis')).toBe('usuario');
      expect(aviso()).toBeNull();
    });

    it('el foco va al botón del usuario cambiado', () => {
      botonDe('luis').click();
      expect(document.activeElement).toBe(botonDe('luis'));
    });

    it('se sigue una sola vez cada clic: un solo oyente en la lista', () => {
      const escribirEnAlmacen = vi.spyOn(almacenUsuarios, 'setItem');
      botonDe('luis').click();
      expect(escribirEnAlmacen).toHaveBeenCalledTimes(1);
    });

    it('el botón de cambiar rol de cada fila ya no apunta a una explicación (solo la propia)', () => {
      expect(botonDe('luis').hasAttribute('aria-describedby')).toBe(false);
      expect(botonDe('luis').disabled).toBe(false);
      expect(fila('luis').querySelector('[data-parte="explicacion"]').hidden).toBe(true);
    });
  });

  describe('el botón propio', () => {
    beforeEach(() => {
      guardar(guardado('ana', 'administrador'), guardado('luis'));
      iniciar();
    });

    it('está desactivado y enlazado a su explicación', () => {
      expect(botonDe('ana').disabled).toBe(true);
      expect(botonDe('ana').getAttribute('aria-describedby')).toBe('usuarios-explicacion-propia');
    });

    it('la explicación se ve, con su texto y su id', () => {
      const explicacion = fila('ana').querySelector('[data-parte="explicacion"]');
      expect(explicacion.hidden).toBe(false);
      expect(explicacion.id).toBe('usuarios-explicacion-propia');
      expect(explicacion.textContent.trim()).toBe(EXPLICACION);
      expect(document.querySelectorAll('#usuarios-explicacion-propia')).toHaveLength(1);
    });

    it('en las demás filas la explicación sigue oculta y sin id', () => {
      const explicacion = fila('luis').querySelector('[data-parte="explicacion"]');
      expect(explicacion.hidden).toBe(true);
      expect(explicacion.id).toBe('');
    });

    it('un clic en el botón desactivado no cambia nada', () => {
      botonDe('ana').click();
      expect(rolGuardado('ana')).toBe('administrador');
      expect(aviso()).toBeNull();
    });

    it('con la sesión escrita de otra forma («ANA»), también es la propia', () => {
      almacenSesion = new AlmacenFalso();
      iniciar({ nombreSesion: 'ANA' });
      expect(botonDe('ana').disabled).toBe(true);
    });

    describe('defensa en profundidad: se fuerza el clic', () => {
      it('sale un aviso de error y el rol no cambia', () => {
        botonDe('ana').disabled = false;
        botonDe('ana').click();
        expect(rolGuardado('ana')).toBe('administrador');
        expect(aviso().classList.contains('alert-danger')).toBe(true);
        expect(aviso().textContent).toContain(EXPLICACION);
        expect(fila('ana').dataset.rol).toBe('administrador');
      });

      it('no escribe nada en el almacén', () => {
        const escribirEnAlmacen = vi.spyOn(almacenUsuarios, 'setItem');
        botonDe('ana').disabled = false;
        botonDe('ana').click();
        expect(escribirEnAlmacen).not.toHaveBeenCalled();
      });

      it('con el nombre de la sesión en mayúsculas, también se impide', () => {
        almacenSesion = new AlmacenFalso();
        iniciar({ nombreSesion: 'ANA' });
        botonDe('ana').disabled = false;
        botonDe('ana').click();
        expect(rolGuardado('ana')).toBe('administrador');
        expect(aviso().classList.contains('alert-danger')).toBe(true);
      });

      it('si se cambia data-rol a «usuario» a mano, pulsar pide «dar» administrador y ana no pierde el rol', () => {
        // La página decide con el data-rol de la fila: con «usuario» el cambio pedido es darlo, nunca quitarlo
        fila('ana').dataset.rol = 'usuario';
        botonDe('ana').disabled = false;
        botonDe('ana').click();
        expect(rolGuardado('ana')).toBe('administrador');
        expect(aviso().classList.contains('alert-success')).toBe(true);
      });
    });
  });

  describe('nombres que solo se distinguen por la tilde', () => {
    it('con la sesión de «José», «Jose» tiene su botón activo y solo la fila propia está desactivada', () => {
      guardar(guardado('José', 'administrador'), guardado('Jose'));
      iniciar({ nombreSesion: 'José' });
      expect(botonDe('José').disabled).toBe(true);
      expect(botonDe('Jose').disabled).toBe(false);
      expect(botonDe('Jose').hasAttribute('aria-describedby')).toBe(false);
      expect(fila('Jose').querySelector('[data-parte="explicacion"]').hidden).toBe(true);
      expect(document.querySelectorAll('#usuarios-explicacion-propia')).toHaveLength(1);
      expect(fila('José').querySelector('#usuarios-explicacion-propia')).not.toBeNull();
    });

    it('el clic en el botón de «Jose» cambia su rol', () => {
      guardar(guardado('José', 'administrador'), guardado('Jose'));
      iniciar({ nombreSesion: 'José' });
      botonDe('Jose').click();
      expect(rolGuardado('Jose')).toBe('administrador');
      expect(rolGuardado('José')).toBe('administrador');
      expect(aviso().classList.contains('alert-success')).toBe(true);
    });

    it('caso inverso: con la sesión de «Jose», «José» queda libre y «Jose» desactivado', () => {
      guardar(guardado('Jose', 'administrador'), guardado('José', 'administrador'));
      iniciar({ nombreSesion: 'Jose' });
      expect(botonDe('Jose').disabled).toBe(true);
      expect(botonDe('José').disabled).toBe(false);
      expect(document.querySelectorAll('#usuarios-explicacion-propia')).toHaveLength(1);
      botonDe('José').click();
      expect(rolGuardado('José')).toBe('usuario');
      expect(rolGuardado('Jose')).toBe('administrador');
    });
  });

  describe('filas pintadas después (delegación)', () => {
    beforeEach(() => {
      const miembros = [];
      for (let i = 1; i <= 14; i++) {
        miembros.push(guardado(`miembro${String(i).padStart(2, '0')}`));
      }
      guardar(guardado('ana', 'administrador'), ...miembros);
    });

    it('funciona en las filas de otra página', () => {
      iniciar();
      botonPagina('2').click();
      botonDe('miembro07').click();
      expect(rolGuardado('miembro07')).toBe('administrador');
    });

    it('funciona en las filas pintadas tras buscar', () => {
      iniciar();
      escribir(document.querySelector('#usuarios-buscar'), 'miembro11');
      vi.advanceTimersByTime(300);
      botonDe('miembro11').click();
      expect(rolGuardado('miembro11')).toBe('administrador');
    });

    it('funciona en las filas pintadas tras un cambio anterior', () => {
      iniciar();
      botonDe('miembro01').click();
      botonDe('miembro02').click();
      expect(rolGuardado('miembro01')).toBe('administrador');
      expect(rolGuardado('miembro02')).toBe('administrador');
    });

    it('tras cambiar el rol se mantiene la página y su dirección', () => {
      iniciar({ busqueda: '?pagina=2' });
      botonDe('miembro08').click();
      expect(botonPagina('2').getAttribute('aria-current')).toBe('page');
      expect(fila('miembro06')).toBeDefined();
      expect(fila('miembro01')).toBeUndefined();
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html?pagina=2');
      expect(document.querySelector('#usuarios-contador').textContent).toBe('15 usuarios');
    });

    it('tras cambiar el rol se mantiene el filtro', () => {
      iniciar();
      escribir(document.querySelector('#usuarios-buscar'), 'miembro1');
      vi.advanceTimersByTime(300); // miembro10 a miembro14
      botonDe('miembro12').click();
      expect([...lista().children].map((li) => li.dataset.nombre)).toEqual([
        'miembro10',
        'miembro11',
        'miembro12',
        'miembro13',
        'miembro14',
      ]);
      expect(document.querySelector('#usuarios-contador').textContent).toBe('5 usuarios');
      expect(document.querySelector('#usuarios-buscar').value).toBe('miembro1');
    });

    it('si la fila cambiada ya no coincide con el filtro, desaparece y el foco va al título', () => {
      iniciar();
      escribir(document.querySelector('#usuarios-buscar'), 'administrador');
      vi.advanceTimersByTime(300); // solo ana
      expect(lista().children).toHaveLength(1);

      // Ana da el rol a otra persona cuya fila no se ve: se hace con un cambio guardado por fuera
      // y un nuevo filtro que muestre a un miembro administrador
      escribir(document.querySelector('#usuarios-buscar'), 'miembro03');
      vi.advanceTimersByTime(300);
      botonDe('miembro03').click(); // ahora es administrador y sigue visible
      expect(document.activeElement).toBe(botonDe('miembro03'));

      escribir(document.querySelector('#usuarios-buscar'), 'administrador');
      vi.advanceTimersByTime(300);
      expect(lista().children).toHaveLength(2); // ana y miembro03
      botonDe('miembro03').click(); // vuelve a usuario: ya no coincide
      expect(fila('miembro03')).toBeUndefined();
      expect(document.activeElement).toBe(titulo());
    });
  });

  describe('usuario que ya no existe', () => {
    beforeEach(() => {
      guardar(guardado('ana', 'administrador'), guardado('luis'), guardado('eva'));
      iniciar();
    });

    it('avisa con una advertencia, vuelve a pintar sin él y da el foco al título', () => {
      guardar(guardado('ana', 'administrador'), guardado('eva')); // otra pestaña ha borrado a luis
      botonDe('luis').click();
      expect(aviso().classList.contains('alert-warning')).toBe(true);
      expect(aviso().textContent).toContain('«luis» ya no existe.');
      expect(fila('luis')).toBeUndefined();
      expect([...lista().children].map((li) => li.dataset.nombre)).toEqual(['ana', 'eva']);
      expect(document.activeElement).toBe(titulo());
    });
  });

  describe('no se puede guardar', () => {
    it('avisa con un error, no cambia el rol y la fila sigue igual', () => {
      guardar(guardado('ana', 'administrador'), guardado('luis'));
      iniciar();
      almacenUsuarios.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      botonDe('luis').click();
      expect(aviso().classList.contains('alert-danger')).toBe(true);
      expect(aviso().textContent).toContain('No se ha podido guardar el cambio de rol');
      expect(rolGuardado('luis')).toBe('usuario');
      expect(botonDe('luis').textContent).toBe('Hacer administrador');
      expect(document.activeElement).toBe(botonDe('luis'));
    });
  });

  describe('nombres con símbolos', () => {
    it('un nombre con comillas funciona al cambiar el rol y al dar el foco', () => {
      const raro = 'Ana "la" O\'Brien <b>';
      guardar(guardado('ana', 'administrador'), guardado(raro));
      iniciar();
      botonDe(raro).click();
      expect(rolGuardado(raro)).toBe('administrador');
      expect(document.activeElement).toBe(botonDe(raro));
      expect(aviso().textContent).toContain(`«${raro}» ahora tiene el rol de administrador.`);
      expect(aviso().querySelector('b')).toBeNull();
    });
  });
});
