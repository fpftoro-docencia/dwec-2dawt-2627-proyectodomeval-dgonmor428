// Test de integración de la zona de administración (lista, buscador y paginación): usuarios.html
// en happy-dom con sus módulos reales. Se sustituyen el almacenamiento (AlmacenFalso), la dirección
// (vi.fn()) y el tiempo (vi.useFakeTimers() para el debounce).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaPrivada } from '../../js/paginas/privada.js';
import {
  iniciarUsuarios,
  ordenarPorNombre,
  textoBuscable,
  TEXTOS_ROL,
} from '../../js/paginas/usuarios.js';
import { iniciarSesion } from '../../js/sesion.js';
import { CLAVE_USUARIOS } from '../../js/usuarios.js';

/** Un usuario guardado de ejemplo (el correo sale del nombre). */
function guardado(nombre, rol = 'usuario', correo = undefined) {
  const slug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  return { nombre, correo: correo ?? `${slug}@ejemplo.es`, resumen: `resumen-${slug}`, rol };
}

describe('usuarios: lista, buscador y paginación', () => {
  let almacenUsuarios;
  let almacenSesion;
  let actualizarDireccion;

  const lista = () => document.querySelector('#usuarios-lista');
  const nombres = () =>
    [...lista().children].map((li) => li.querySelector('[data-parte="nombre"]').textContent);
  const buscador = () => document.querySelector('#usuarios-buscar');
  const contador = () => document.querySelector('#usuarios-contador');
  const sinResultados = () => document.querySelector('#usuarios-sin-resultados');
  const paginacion = () => document.querySelector('#usuarios-paginacion');
  const controles = () => document.querySelector('#usuarios-controles');
  const titulo = () => document.querySelector('#usuarios-titulo');
  const boton = (texto) =>
    [...controles().querySelectorAll('button')].find((b) => b.textContent === texto);

  /** Guarda los usuarios en el almacén (el orden de guardado no es el de la pantalla). */
  function guardar(...usuarios) {
    almacenUsuarios.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
  }

  /** ana (administradora, con la sesión abierta) y `n` más: miembro01…miembroNN. */
  function guardarConMiembros(n) {
    const miembros = [];
    for (let i = 1; i <= n; i++) {
      miembros.push(guardado(`miembro${String(i).padStart(2, '0')}`));
    }
    guardar(guardado('ana', 'administrador'), ...miembros);
  }

  function iniciar(busqueda = '') {
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

  /** Escribe en el buscador y deja pasar la pausa del debounce. */
  function buscar(texto) {
    escribir(buscador(), texto);
    vi.advanceTimersByTime(300);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    actualizarDireccion = vi.fn();
    iniciarSesion(almacenSesion, { nombre: 'ana', rol: 'administrador' });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('la lista', () => {
    beforeEach(() => {
      guardar(
        guardado('ana', 'administrador', 'ana@ejemplo.es'),
        guardado('luis', 'usuario', 'luis@ejemplo.es'),
      );
      iniciar();
    });

    it('cada usuario muestra su nombre, su correo y su rol', () => {
      const luis = lista().children[1];
      expect(luis.querySelector('[data-parte="nombre"]').textContent).toBe('luis');
      expect(luis.querySelector('[data-parte="correo"]').textContent).toBe('luis@ejemplo.es');
      expect(luis.querySelector('[data-parte="rol"]').textContent).toBe('Usuario');
      const ana = lista().children[0];
      expect(ana.querySelector('[data-parte="rol"]').textContent).toBe('Administrador');
    });

    it('cada fila guarda el nombre y el rol en data-nombre y data-rol', () => {
      expect(lista().children[0].dataset.nombre).toBe('ana');
      expect(lista().children[0].dataset.rol).toBe('administrador');
      expect(lista().children[1].dataset.nombre).toBe('luis');
      expect(lista().children[1].dataset.rol).toBe('usuario');
    });

    it('solo la chapa del administrador lleva la clase de color', () => {
      const chapa = (fila) => lista().children[fila].querySelector('[data-parte="rol"]');
      expect(chapa(0).classList.contains('chapa--espacio')).toBe(true);
      expect(chapa(1).classList.contains('chapa--espacio')).toBe(false);
    });

    it('el botón dice lo que hará según el rol y su aria-label incluye el nombre', () => {
      const ana = lista().children[0].querySelector('[data-accion="cambiar-rol"]');
      const luis = lista().children[1].querySelector('[data-accion="cambiar-rol"]');
      expect(ana.textContent).toBe('Quitar administrador');
      expect(ana.getAttribute('aria-label')).toBe('Quitar administrador: ana');
      expect(luis.textContent).toBe('Hacer administrador');
      expect(luis.getAttribute('aria-label')).toBe('Hacer administrador: luis');
    });

    it('la lista y el contador se ven; sin resultados y paginación, no', () => {
      expect(lista().hidden).toBe(false);
      expect(contador().textContent).toBe('2 usuarios');
      expect(sinResultados().hidden).toBe(true);
      expect(paginacion().hidden).toBe(true);
    });

    it('la plantilla no se toca: sigue vacía para las siguientes copias', () => {
      expect(document.querySelectorAll('#plantilla-usuario').length).toBe(1);
      expect(
        document.querySelector('#plantilla-usuario').content.querySelector('[data-parte="nombre"]')
          .textContent,
      ).toBe('');
    });

    it('la dirección se escribe al cargar, limpia (usuarios.html)', () => {
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html');
    });
  });

  describe('orden', () => {
    it('por nombre sin distinguir mayúsculas ni tildes, no por orden de registro', () => {
      guardar(
        guardado('Zoe'),
        guardado('ana', 'administrador'),
        guardado('émilie'),
        guardado('Beatriz'),
        guardado('Carlos'),
      );
      iniciar();
      expect(nombres()).toEqual(['ana', 'Beatriz', 'Carlos', 'émilie', 'Zoe']);
    });

    it('ordenarPorNombre no cambia la lista que recibe', () => {
      const original = [guardado('b'), guardado('A')];
      const copia = [...original];
      expect(ordenarPorNombre(original).map((u) => u.nombre)).toEqual(['A', 'b']);
      expect(original).toEqual(copia);
    });
  });

  describe('buscador', () => {
    beforeEach(() => {
      guardar(
        guardado('ana', 'administrador', 'ana@ejemplo.es'),
        guardado('Luis', 'usuario', 'luis@correo.es'),
        guardado('Ñoño', 'usuario', 'nono@ejemplo.es'),
        guardado('Beatriz', 'administrador', 'bea@ejemplo.es'),
      );
      iniciar();
    });

    it('con debounce: antes de 300 ms no filtra y después sí', () => {
      escribir(buscador(), 'luis');
      vi.advanceTimersByTime(299);
      expect(nombres()).toHaveLength(4);
      vi.advanceTimersByTime(1);
      expect(nombres()).toEqual(['Luis']);
    });

    it('varias teclas seguidas filtran una sola vez, con el último texto', () => {
      const pintadas = vi.spyOn(lista(), 'replaceChildren');
      escribir(buscador(), 'l');
      vi.advanceTimersByTime(100);
      escribir(buscador(), 'lu');
      vi.advanceTimersByTime(100);
      escribir(buscador(), 'luis');
      vi.advanceTimersByTime(300);
      expect(pintadas).toHaveBeenCalledTimes(1);
      expect(nombres()).toEqual(['Luis']);
    });

    it.each([
      ['mayúsculas', 'LUIS', ['Luis']],
      ['minúsculas', 'beatriz', ['Beatriz']],
      ['tilde que el nombre no tiene', 'lúis', ['Luis']],
      ['la ñ sin escribirla', 'nono', ['Ñoño']],
      ['la ñ escrita', 'ÑOÑO', ['Ñoño']],
      ['el correo', 'luis@correo', ['Luis']],
      ['el dominio del correo', 'correo.es', ['Luis']],
      ['el rol Administrador', 'administrador', ['ana', 'Beatriz']],
      ['el rol en mayúsculas con tilde', 'ADMINISTRADÓR', ['ana', 'Beatriz']],
      ['el rol Usuario', 'usuario', ['Luis', 'Ñoño']],
      ['con espacios alrededor', '  luis  ', ['Luis']],
    ])('encuentra por %s', (_motivo, texto, esperado) => {
      buscar(texto);
      expect(nombres()).toEqual(esperado);
    });

    it('no busca por el valor guardado del rol sino por el visible', () => {
      // Se guarda «usuario» (minúscula) y se ve «Usuario»: ambos coinciden sin distinguir mayúsculas,
      // pero un texto que solo está en el valor guardado no existe: no hay otros campos escondidos
      buscar('resumen');
      expect(nombres()).toEqual([]);
    });

    it('borrar el texto vuelve a mostrar todos, ordenados', () => {
      buscar('luis');
      buscar('');
      expect(nombres()).toEqual(['ana', 'Beatriz', 'Luis', 'Ñoño']);
    });

    it('el contador va en singular con uno y en plural con varios o ninguno', () => {
      expect(contador().textContent).toBe('4 usuarios');
      buscar('luis');
      expect(contador().textContent).toBe('1 usuario');
      buscar('zzz');
      expect(contador().textContent).toBe('0 usuarios');
    });

    it('el contador avisa a los lectores de pantalla (aria-live)', () => {
      expect(contador().getAttribute('aria-live')).toBe('polite');
    });

    it('sin coincidencias: mensaje de sin resultados y la lista oculta; el buscador sigue', () => {
      buscar('zzz');
      expect(sinResultados().hidden).toBe(false);
      expect(lista().hidden).toBe(true);
      expect(paginacion().hidden).toBe(true);
      expect(document.querySelector('#usuarios-herramientas').hidden).toBe(false);
      buscar('luis');
      expect(sinResultados().hidden).toBe(true);
      expect(lista().hidden).toBe(false);
    });

    it('el texto buscado no va a la dirección', () => {
      buscar('luis');
      for (const [url] of actualizarDireccion.mock.calls) {
        expect(url).toBe('usuarios.html');
      }
    });
  });

  describe('textoBuscable', () => {
    it('junta nombre, correo y rol visible, normalizados', () => {
      const texto = textoBuscable({
        nombre: 'Ñoño',
        correo: 'Nono@Ejemplo.es',
        rol: 'administrador',
      });
      expect(texto).toContain('nono');
      expect(texto).toContain('nono@ejemplo.es');
      expect(texto).toContain('administrador');
    });

    it('TEXTOS_ROL tiene los dos roles', () => {
      expect(TEXTOS_ROL).toEqual({ usuario: 'Usuario', administrador: 'Administrador' });
    });
  });

  describe('XSS', () => {
    beforeEach(() => {
      guardar(
        guardado('ana', 'administrador'),
        guardado('<b>Mala</b>', 'usuario', '<i>mala</i>@ejemplo.es'),
        guardado('<img src=x onerror=alert(1)>', 'usuario', 'x@ejemplo.es'),
      );
      iniciar();
    });

    it('el nombre y el correo con etiquetas se pintan como texto', () => {
      expect(nombres()).toContain('<b>Mala</b>');
      expect(lista().querySelector('b')).toBeNull();
      expect(lista().querySelector('i')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      const fila = [...lista().children].find((li) => li.dataset.nombre === '<b>Mala</b>');
      expect(fila.querySelector('[data-parte="correo"]').textContent).toBe(
        '<i>mala</i>@ejemplo.es',
      );
    });

    it('buscar «<b>» lo encuentra y sigue siendo texto', () => {
      buscar('<b>');
      expect(nombres()).toEqual(['<b>Mala</b>']);
      expect(lista().querySelector('b')).toBeNull();
    });

    it('un texto con etiquetas en el buscador no crea elementos', () => {
      buscar('<script>alert(1)</script>');
      expect(sinResultados().hidden).toBe(false);
      expect(document.querySelector('#usuarios-lista script')).toBeNull();
    });
  });

  describe('paginación', () => {
    beforeEach(() => {
      guardarConMiembros(14); // 15 en total: 3 páginas de 6 (ana + 5, 6 y 3)
    });

    it('la primera página tiene 6 usuarios y controles de 3 páginas', () => {
      iniciar();
      expect(nombres()).toEqual([
        'ana',
        'miembro01',
        'miembro02',
        'miembro03',
        'miembro04',
        'miembro05',
      ]);
      expect(paginacion().hidden).toBe(false);
      expect(contador().textContent).toBe('15 usuarios');
      expect(boton('3')).toBeDefined();
      expect(boton('4')).toBeUndefined();
      expect(boton('1').getAttribute('aria-current')).toBe('page');
      expect(boton('Anterior').disabled).toBe(true);
    });

    it('con 6 o menos usuarios los controles se ocultan', () => {
      guardarConMiembros(5);
      iniciar();
      expect(paginacion().hidden).toBe(true);
      expect(nombres()).toHaveLength(6);
    });

    it('un clic en un número cambia de página, da el foco al título y escribe la dirección', () => {
      iniciar();
      boton('2').click();
      expect(nombres()[0]).toBe('miembro06');
      expect(nombres()).toHaveLength(6);
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(document.activeElement).toBe(titulo());
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html?pagina=2');
    });

    it('«Siguiente» y «Anterior» recorren las páginas; la última tiene 3', () => {
      iniciar();
      boton('Siguiente').click();
      boton('Siguiente').click();
      expect(nombres()).toEqual(['miembro12', 'miembro13', 'miembro14']);
      expect(boton('Siguiente').disabled).toBe(true);
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html?pagina=3');
      boton('Anterior').click();
      expect(nombres()[0]).toBe('miembro06');
    });

    it('volver a la página 1 deja la dirección limpia (usuarios.html)', () => {
      iniciar();
      boton('2').click();
      boton('1').click();
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html');
    });

    it('al cargar, con ?pagina=2 se ve la página 2', () => {
      iniciar('?pagina=2');
      expect(nombres()[0]).toBe('miembro06');
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html?pagina=2');
    });

    it('?pagina=99 va a la última y corrige la dirección', () => {
      iniciar('?pagina=99');
      expect(nombres()).toHaveLength(3);
      expect(boton('3').getAttribute('aria-current')).toBe('page');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html?pagina=3');
    });

    it.each([
      ['abc', '?pagina=abc'],
      ['vacío', '?pagina='],
      ['sin el parámetro', ''],
      ['0', '?pagina=0'],
      ['negativo', '?pagina=-4'],
    ])('?pagina %s va a la 1 y deja la dirección limpia', (_motivo, busqueda) => {
      iniciar(busqueda);
      expect(nombres()[0]).toBe('ana');
      expect(boton('1').getAttribute('aria-current')).toBe('page');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html');
    });

    it('al buscar desde otra página se vuelve a la 1', () => {
      iniciar('?pagina=3');
      buscar('miembro');
      expect(nombres()[0]).toBe('miembro01');
      expect(actualizarDireccion).toHaveBeenLastCalledWith('usuarios.html');
    });

    it('el resultado de la búsqueda también se pagina', () => {
      iniciar();
      buscar('miembro0'); // miembro01 a miembro09: 9 en 2 páginas
      expect(contador().textContent).toBe('9 usuarios');
      expect(paginacion().hidden).toBe(false);
      buscar('miembro10'); // solo uno
      expect(contador().textContent).toBe('1 usuario');
      expect(paginacion().hidden).toBe(true);
    });
  });

  describe('sin actualizarDireccion ni opciones', () => {
    it('funciona con los valores por defecto (6 por página, sin dirección)', () => {
      guardarConMiembros(7);
      cargarPagina('usuarios.html');
      iniciarUsuarios({
        documento: document,
        sesion: { nombre: 'ana', rol: 'administrador' },
        almacenUsuarios,
      });
      expect(nombres()).toHaveLength(6);
      boton('2').click();
      expect(nombres()).toHaveLength(2);
    });

    it('porPagina y esperaBusqueda se pueden cambiar', () => {
      guardarConMiembros(4);
      cargarPagina('usuarios.html');
      iniciarUsuarios({
        documento: document,
        sesion: { nombre: 'ana', rol: 'administrador' },
        almacenUsuarios,
        porPagina: 2,
        esperaBusqueda: 50,
      });
      expect(nombres()).toHaveLength(2);
      escribir(buscador(), 'miembro03');
      vi.advanceTimersByTime(50);
      expect(nombres()).toEqual(['miembro03']);
    });
  });

  describe('sin usuarios o con datos estropeados', () => {
    it('sin nada guardado, la lista está vacía y se ve «sin resultados»', () => {
      iniciar();
      expect(nombres()).toEqual([]);
      expect(contador().textContent).toBe('0 usuarios');
      expect(sinResultados().hidden).toBe(false);
    });

    it('las entradas estropeadas no salen en la lista', () => {
      almacenUsuarios.setItem(
        CLAVE_USUARIOS,
        JSON.stringify([null, { nombre: 'roto' }, guardado('ana', 'administrador')]),
      );
      iniciar();
      expect(nombres()).toEqual(['ana']);
    });
  });
});
