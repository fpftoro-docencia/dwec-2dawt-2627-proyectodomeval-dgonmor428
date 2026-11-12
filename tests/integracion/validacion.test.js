// Tests del componente de validación en tiempo real (js/validacion.js) con un formulario de
// prueba que tiene un campo de cada tipo: obligatorio, con data-validar, número con rango,
// opcional, botones de opción, casilla y uno desactivado.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { escribir, salir } from '../pagina.js';
import { activarValidacion, mensajeDeError } from '../../js/validacion.js';
import { escucharAvisos } from '../../js/avisos.js';

const FORMULARIO = `
  <div id="avisos"></div>
  <form id="prueba" novalidate>
    <input name="titulo" required data-vacio="Escribe un título." aria-describedby="titulo-error" />
    <p class="invalid-feedback" id="titulo-error"></p>

    <input name="gps" required data-validar="gps" data-vacio="Escribe las coordenadas."
      aria-describedby="gps-ayuda gps-error" />
    <p id="gps-ayuda">Como 36.7213, -4.4214</p>
    <p class="invalid-feedback" id="gps-error"></p>

    <input name="altitud" type="number" min="-430" max="8849" data-invalido="La altitud va de −430 a 8849 m."
      aria-describedby="altitud-error" />
    <p class="invalid-feedback" id="altitud-error"></p>

    <input name="observatorio" data-validar="observatorio" aria-describedby="observatorio-error" />
    <p class="invalid-feedback" id="observatorio-error"></p>

    <input name="categoria" type="radio" value="paisaje" required data-vacio="Elige una categoría."
      aria-describedby="categoria-error" />
    <input name="categoria" type="radio" value="cielo" aria-describedby="categoria-error" />
    <p class="invalid-feedback" id="categoria-error"></p>

    <input name="clave" aria-describedby="clave-error" />
    <p class="invalid-feedback" id="clave-error"></p>
    <input name="repetir" required aria-describedby="repetir-error" />
    <p class="invalid-feedback" id="repetir-error"></p>

    <input name="catalogo" required disabled data-validar="catalogo" aria-describedby="catalogo-error" />
    <p class="invalid-feedback" id="catalogo-error"></p>

    <button type="submit">Guardar</button>
  </form>`;

describe('validación en tiempo real (componente común)', () => {
  let formulario;
  let campos;
  let validacion;

  const errorDe = (nombre) => document.querySelector(`#${nombre}-error`).textContent;
  const marcado = (campo) => campo.classList.contains('is-invalid');

  function rellenarValido() {
    escribir(campos.titulo, 'Aurora');
    escribir(campos.gps, '69.6492, 18.9553');
    campos.categoria[0].checked = true;
    escribir(campos.clave, 'x');
    escribir(campos.repetir, 'x');
  }

  beforeEach(() => {
    document.body.innerHTML = FORMULARIO;
    formulario = document.querySelector('#prueba');
    campos = formulario.elements;
    escucharAvisos(document, document.querySelector('#avisos'));
    validacion = activarValidacion(formulario, {
      reglas: {
        repetir: (campo) => (campo.value === campos.clave.value ? '' : 'No coinciden.'),
      },
      dependencias: { clave: ['repetir'] },
      avisoErrores: 'Hay errores.',
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('cuándo se valida', () => {
    it('mientras se escribe por primera vez, no', () => {
      escribir(campos.gps, '1');
      expect(errorDe('gps')).toBe('');
      expect(marcado(campos.gps)).toBe(false);
    });

    it('al salir del campo, sí: blur en la fase de captura del formulario', () => {
      escribir(campos.gps, '1');
      salir(campos.gps);
      expect(errorDe('gps')).toBe('Usa el formato 36.7213, -4.4214.');
    });

    it('el formulario recibe el blur aunque no suba: lo escucha en la captura', () => {
      const espia = vi.spyOn(formulario, 'addEventListener');
      activarValidacion(formulario);
      expect(espia).toHaveBeenCalledWith('blur', expect.any(Function), true);
    });

    it('desde que se sale, con cada cambio (input)', () => {
      salir(campos.gps);
      escribir(campos.gps, '69.6492, 18.9553');
      expect(errorDe('gps')).toBe('');
      escribir(campos.gps, '69.6492');
      expect(errorDe('gps')).toBe('Usa el formato 36.7213, -4.4214.');
    });

    it('también con change (botones de opción, casillas, listas)', () => {
      salir(campos.categoria[0]);
      expect(errorDe('categoria')).toBe('Elige una categoría.');
      campos.categoria[1].checked = true;
      campos.categoria[1].dispatchEvent(new Event('change', { bubbles: true }));
      expect(errorDe('categoria')).toBe('');
    });

    it('una regla que depende de otro campo se revalida cuando cambia el otro', () => {
      escribir(campos.clave, 'a');
      escribir(campos.repetir, 'a');
      salir(campos.repetir);
      expect(errorDe('repetir')).toBe('');
      escribir(campos.clave, 'b');
      expect(errorDe('repetir')).toBe('No coinciden.');
    });

    it('el campo dependiente no se revalida si aún no se ha tocado', () => {
      escribir(campos.clave, 'b');
      expect(errorDe('repetir')).toBe('');
    });

    it('un cambio en un campo desactivado no lo valida', () => {
      validacion.validarFormulario();
      escribir(campos.catalogo, 'mal');
      expect(errorDe('catalogo')).toBe('');
    });

    it('un campo dependiente desactivado no se revalida', () => {
      salir(campos.repetir);
      campos.repetir.disabled = true;
      escribir(campos.repetir, 'distinto'); // no cambia nada: está desactivado
      escribir(campos.clave, 'b');
      expect(errorDe('repetir')).toBe('Rellena este campo.'); // el de antes de desactivarlo
    });

    it('una dependencia con un nombre que no existe no rompe nada', () => {
      document.body.innerHTML = FORMULARIO;
      const otro = document.querySelector('#prueba');
      activarValidacion(otro, { dependencias: { clave: ['noExiste'] } });
      expect(() => escribir(otro.elements.clave, 'a')).not.toThrow();
    });

    it('salir de un botón no hace nada', () => {
      salir(formulario.querySelector('button'));
      expect(formulario.querySelectorAll('.is-invalid')).toHaveLength(0);
    });
  });

  describe('de dónde sale el mensaje', () => {
    it('de validity.valueMissing, con el texto de data-vacio', () => {
      salir(campos.titulo);
      expect(errorDe('titulo')).toBe('Escribe un título.');
    });

    it('sin data-vacio, un mensaje por defecto', () => {
      salir(campos.repetir);
      expect(errorDe('repetir')).toBe('Rellena este campo.');
    });

    it('de los demás errores de validity (rango), con el texto de data-invalido', () => {
      escribir(campos.altitud, '9000');
      salir(campos.altitud);
      expect(errorDe('altitud')).toBe('La altitud va de −430 a 8849 m.');
    });

    it('sin data-invalido, el mensaje del navegador (validationMessage)', () => {
      campos.altitud.removeAttribute('data-invalido');
      escribir(campos.altitud, '-500');
      salir(campos.altitud);
      expect(errorDe('altitud')).toBe(campos.altitud.validationMessage);
      expect(errorDe('altitud')).not.toBe('');
    });

    it('del validador que nombra data-validar', () => {
      escribir(campos.observatorio, 'OBS-4821-3');
      salir(campos.observatorio);
      expect(errorDe('observatorio')).toBe('El dígito de control no es correcto.');
    });

    it('un campo opcional vacío no pasa por su validador y es válido', () => {
      salir(campos.observatorio);
      expect(errorDe('observatorio')).toBe('');
    });

    it('validity va antes que data-validar: vacío dice que falta, no que el formato está mal', () => {
      salir(campos.gps);
      expect(errorDe('gps')).toBe('Escribe las coordenadas.');
    });

    it('de la regla propia de la página', () => {
      escribir(campos.clave, 'a');
      escribir(campos.repetir, 'b');
      salir(campos.repetir);
      expect(errorDe('repetir')).toBe('No coinciden.');
    });

    it('el mensaje también va a setCustomValidity', () => {
      salir(campos.titulo);
      expect(campos.titulo.validationMessage).toBe('Escribe un título.');
      escribir(campos.titulo, 'Aurora');
      expect(campos.titulo.validity.valid).toBe(true);
    });

    it('lanza un error si data-validar nombra un validador que no existe', () => {
      campos.titulo.dataset.validar = 'noExiste';
      escribir(campos.titulo, 'Aurora');
      expect(() => mensajeDeError(campos.titulo)).toThrow('No hay ningún validador «noExiste»');
    });
  });

  describe('qué se ve', () => {
    it('el mensaje va a la caja con invalid-feedback de su aria-describedby, aunque haya más', () => {
      salir(campos.gps);
      expect(errorDe('gps')).toBe('Escribe las coordenadas.');
      expect(document.querySelector('#gps-ayuda').textContent).toBe('Como 36.7213, -4.4214');
    });

    it('el campo con error lleva aria-invalid="true" y la clase is-invalid', () => {
      salir(campos.titulo);
      expect(campos.titulo.getAttribute('aria-invalid')).toBe('true');
      expect(marcado(campos.titulo)).toBe(true);
    });

    it('al corregirlo, aria-invalid="false" y sin is-invalid', () => {
      salir(campos.titulo);
      escribir(campos.titulo, 'Aurora');
      expect(campos.titulo.getAttribute('aria-invalid')).toBe('false');
      expect(marcado(campos.titulo)).toBe(false);
    });

    it('los botones de opción se marcan todos juntos, con una sola caja', () => {
      salir(campos.categoria[1]);
      expect(marcado(campos.categoria[0])).toBe(true);
      expect(marcado(campos.categoria[1])).toBe(true);
      expect(errorDe('categoria')).toBe('Elige una categoría.');
    });

    it('lanza un error si un campo no tiene caja de error', () => {
      campos.titulo.removeAttribute('aria-describedby');
      expect(() => salir(campos.titulo)).toThrow('no tiene una caja de error');
    });
  });

  describe('al enviar', () => {
    it('valida todos los campos, avisa y lleva el foco al primero con error', () => {
      expect(validacion.validarFormulario()).toBe(false);
      expect(errorDe('titulo')).toBe('Escribe un título.');
      expect(errorDe('gps')).toBe('Escribe las coordenadas.');
      expect(errorDe('categoria')).toBe('Elige una categoría.');
      expect(document.querySelector('#avisos').textContent).toContain('Hay errores.');
      expect(document.activeElement).toBe(campos.titulo);
    });

    it('el foco va al primero con error aunque no sea el primero del formulario', () => {
      rellenarValido();
      escribir(campos.altitud, '9000');
      validacion.validarFormulario();
      expect(document.activeElement).toBe(campos.altitud);
    });

    it('con todo bien, devuelve true y no avisa', () => {
      rellenarValido();
      expect(validacion.validarFormulario()).toBe(true);
      expect(document.querySelector('#avisos').textContent).toBe('');
      expect(formulario.querySelectorAll('.is-invalid')).toHaveLength(0);
    });

    it('no valida los campos desactivados (el campo condicional cuando no se ve)', () => {
      rellenarValido();
      expect(validacion.validarFormulario()).toBe(true);
      expect(errorDe('catalogo')).toBe('');
    });

    it('un campo desactivado se valida en cuanto se activa', () => {
      rellenarValido();
      campos.catalogo.disabled = false;
      expect(validacion.validarFormulario()).toBe(false);
      expect(errorDe('catalogo')).toBe('Rellena este campo.');
      expect(document.activeElement).toBe(campos.catalogo);
    });

    it('después de enviar, todos los campos se validan con cada cambio', () => {
      validacion.validarFormulario();
      escribir(campos.titulo, 'Aurora');
      expect(errorDe('titulo')).toBe('');
    });

    it('validarCampo permite a la página validar un campo cuando quiera', () => {
      expect(validacion.validarCampo(campos.titulo)).toBe(false);
      escribir(campos.titulo, 'Aurora');
      expect(validacion.validarCampo(campos.titulo)).toBe(true);
    });

    it('sin aviso propio, usa uno por defecto', () => {
      document.body.innerHTML = FORMULARIO;
      escucharAvisos(document, document.querySelector('#avisos'));
      activarValidacion(document.querySelector('#prueba')).validarFormulario();
      expect(document.querySelector('#avisos').textContent).toContain(
        'Revisa los campos marcados en rojo.',
      );
    });

    it('pone novalidate al formulario aunque al HTML se le olvide', () => {
      document.body.innerHTML = '<form id="sin"></form>';
      const sin = document.querySelector('#sin');
      activarValidacion(sin);
      expect(sin.noValidate).toBe(true);
    });
  });
});
