// Tests de js/controlesPaginacion.js (en happy-dom, con un <ul> creado en el test).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pintarControles, escucharControles } from '../../js/controlesPaginacion.js';

describe('controlesPaginacion', () => {
  let contenedor;

  const pintar = (pagina, totalPaginas) =>
    pintarControles({ documento: document, contenedor, pagina, totalPaginas });
  const botones = () => [...contenedor.querySelectorAll('button')];
  const textos = () => botones().map((boton) => boton.textContent);
  const boton = (texto) => botones().find((candidato) => candidato.textContent === texto);

  beforeEach(() => {
    document.body.innerHTML = '';
    contenedor = document.createElement('ul');
    contenedor.className = 'pagination';
    document.body.append(contenedor);
  });

  describe('pintarControles', () => {
    it('pinta «Anterior», un botón por página y «Siguiente», dentro de li.page-item', () => {
      pintar(2, 3);
      expect(textos()).toEqual(['Anterior', '1', '2', '3', 'Siguiente']);
      expect(contenedor.children).toHaveLength(5);
      for (const elemento of contenedor.children) {
        expect(elemento.tagName).toBe('LI');
        expect(elemento.classList.contains('page-item')).toBe(true);
        expect(elemento.firstElementChild.classList.contains('page-link')).toBe(true);
        expect(elemento.firstElementChild.type).toBe('button');
      }
    });

    it('cada botón lleva en data-pagina la página a la que va', () => {
      pintar(2, 3);
      expect(botones().map((candidato) => candidato.dataset.pagina)).toEqual([
        '1',
        '1',
        '2',
        '3',
        '3',
      ]);
    });

    it('en la primera página, «Anterior» está desactivado y «Siguiente» no', () => {
      pintar(1, 3);
      expect(boton('Anterior').disabled).toBe(true);
      expect(boton('Anterior').parentElement.classList.contains('disabled')).toBe(true);
      expect(boton('Siguiente').disabled).toBe(false);
    });

    it('en la última página, «Siguiente» está desactivado y «Anterior» no', () => {
      pintar(3, 3);
      expect(boton('Siguiente').disabled).toBe(true);
      expect(boton('Siguiente').parentElement.classList.contains('disabled')).toBe(true);
      expect(boton('Anterior').disabled).toBe(false);
    });

    it('en una página del medio, ninguno de los dos está desactivado', () => {
      pintar(2, 3);
      expect(boton('Anterior').disabled).toBe(false);
      expect(boton('Siguiente').disabled).toBe(false);
    });

    it('con una sola página, los dos extremos están desactivados', () => {
      pintar(1, 1);
      expect(boton('Anterior').disabled).toBe(true);
      expect(boton('Siguiente').disabled).toBe(true);
    });

    it('solo la página actual lleva aria-current="page" y la clase active', () => {
      pintar(2, 3);
      const actuales = botones().filter((candidato) => candidato.hasAttribute('aria-current'));
      expect(actuales).toEqual([boton('2')]);
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(boton('2').parentElement.classList.contains('active')).toBe(true);
      expect(boton('1').parentElement.classList.contains('active')).toBe(false);
    });

    it('los números tienen aria-label «Página N»; «Anterior» y «Siguiente», no', () => {
      pintar(2, 3);
      expect(boton('1').getAttribute('aria-label')).toBe('Página 1');
      expect(boton('3').getAttribute('aria-label')).toBe('Página 3');
      expect(boton('Anterior').hasAttribute('aria-label')).toBe(false);
      expect(boton('Siguiente').hasAttribute('aria-label')).toBe(false);
    });

    it('al pintar de nuevo sustituye lo anterior, no lo acumula', () => {
      pintar(1, 5);
      pintar(2, 2);
      expect(textos()).toEqual(['Anterior', '1', '2', 'Siguiente']);
      expect(boton('2').getAttribute('aria-current')).toBe('page');
      expect(boton('1').hasAttribute('aria-current')).toBe(false);
    });
  });

  describe('escucharControles', () => {
    it('un clic en un botón llama a alCambiar con su número de página', () => {
      const alCambiar = vi.fn();
      escucharControles(contenedor, alCambiar);
      pintar(1, 3);
      boton('3').click();
      expect(alCambiar).toHaveBeenCalledTimes(1);
      expect(alCambiar).toHaveBeenCalledWith(3);
    });

    it('«Siguiente» y «Anterior» llevan a la página de al lado', () => {
      const alCambiar = vi.fn();
      escucharControles(contenedor, alCambiar);
      pintar(2, 3);
      boton('Siguiente').click();
      boton('Anterior').click();
      expect(alCambiar.mock.calls).toEqual([[3], [1]]);
    });

    it('un clic en un hijo del botón (closest) cuenta como clic en el botón', () => {
      const alCambiar = vi.fn();
      escucharControles(contenedor, alCambiar);
      pintar(1, 3);
      const hijo = document.createElement('span');
      boton('2').append(hijo);
      hijo.click();
      expect(alCambiar).toHaveBeenCalledWith(2);
    });

    it('un clic fuera de los botones (en el propio contenedor) no hace nada', () => {
      const alCambiar = vi.fn();
      escucharControles(contenedor, alCambiar);
      pintar(1, 3);
      contenedor.click();
      boton('2').parentElement.click(); // el li, no el botón
      expect(alCambiar).not.toHaveBeenCalled();
    });

    it('un clic en un botón desactivado no llama a alCambiar', () => {
      const alCambiar = vi.fn();
      escucharControles(contenedor, alCambiar);
      pintar(1, 3);
      boton('Anterior').click();
      boton('Anterior').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(alCambiar).not.toHaveBeenCalled();
    });

    it('volver a pintar no apila oyentes: un clic llama una sola vez', () => {
      const alCambiar = vi.fn();
      escucharControles(contenedor, alCambiar);
      pintar(1, 3);
      pintar(2, 3);
      pintar(3, 3);
      boton('1').click();
      expect(alCambiar).toHaveBeenCalledTimes(1);
    });

    it('registra un único oyente click en el contenedor', () => {
      const espia = vi.spyOn(contenedor, 'addEventListener');
      escucharControles(contenedor, vi.fn());
      pintar(1, 3);
      pintar(2, 3);
      expect(espia).toHaveBeenCalledTimes(1);
      expect(espia).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
});
