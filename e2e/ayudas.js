// Funciones de ayuda de las pruebas de extremo a extremo: los pasos que se repiten en los recorridos.
// Todas usan direcciones relativas (`/registro.html`) y buscan los elementos como un usuario
// (por su rol, su etiqueta o su texto), así que valen igual con `serve` que contra la web desplegada.
import { expect } from '@playwright/test';

/** Un usuario de ejemplo (ficticio) que cumple las reglas del registro. */
export const USUARIO = {
  nombre: 'ana_cielo',
  correo: 'ana@ejemplo.es',
  clave: 'Estrellas2026',
};

/** Una captura de ejemplo (ficticia) con datos válidos: fecha pasada, GPS «lat, lon» y de paisaje. */
export const CAPTURA = {
  titulo: 'Amanecer en el valle',
  categoria: 'Paisaje',
  fecha: '2020-05-10T06:15',
  lugar: 'Valle de ejemplo',
  gps: '36.7213, -4.4214',
  altitud: '120',
  condiciones: 'Despejado',
  equipo: 'Cámara',
};

/**
 * Crea una cuenta desde `registro.html` y espera a llegar al listado (donde ya hay sesión).
 *
 * @param {object} page - La página de Playwright.
 * @param {object} [usuario] - El usuario a registrar (nombre, correo y clave).
 * @returns {Promise<void>}
 */
export async function registrarse(page, usuario = USUARIO) {
  await page.goto('/registro.html');
  await page.getByLabel('Nombre de usuario').fill(usuario.nombre);
  await page.getByLabel('Correo electrónico').fill(usuario.correo);
  // exact: sin él también casa «Repite la contraseña» y Playwright falla por haber dos campos
  await page.getByLabel('Contraseña', { exact: true }).fill(usuario.clave);
  await page.getByLabel('Repite la contraseña').fill(usuario.clave);
  await page.getByLabel('Acepto las condiciones').check();
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mis capturas' })).toBeVisible();
}

/**
 * Entra con un usuario ya registrado desde `index.html` y espera a llegar al listado.
 *
 * @param {object} page - La página de Playwright.
 * @param {object} [usuario] - El usuario que entra (nombre y clave).
 * @returns {Promise<void>}
 */
export async function iniciarSesion(page, usuario = USUARIO) {
  await page.goto('/index.html');
  await page.getByLabel('Nombre de usuario').fill(usuario.nombre);
  // exact: sin él también casa «Repite la contraseña» y Playwright falla por haber dos campos
  await page.getByLabel('Contraseña', { exact: true }).fill(usuario.clave);
  await page.getByRole('button', { name: 'Entrar en mi diario' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mis capturas' })).toBeVisible();
}

/**
 * Cierra la sesión con el botón de la cabecera y espera a llegar al inicio de sesión.
 *
 * @param {object} page - La página de Playwright.
 * @returns {Promise<void>}
 */
export async function cerrarSesion(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
}

/**
 * Rellena los campos de la ficha (alta o edición) con los datos que se le pasen.
 *
 * @param {object} page - La página de Playwright, en `ficha.html`.
 * @param {object} captura - Los datos de la captura (como `CAPTURA`).
 * @returns {Promise<void>}
 */
async function rellenarFicha(page, captura) {
  await page.getByLabel('Título', { exact: true }).fill(captura.titulo);
  await page.getByRole('radio', { name: captura.categoria }).check();
  await page.getByLabel('Fecha y hora').fill(captura.fecha);
  await page.getByLabel('Lugar', { exact: true }).fill(captura.lugar);
  await page.getByLabel('Coordenadas GPS').fill(captura.gps);
  await page.getByLabel('Altitud (m)').fill(captura.altitud);
  await page.getByLabel('Condiciones del cielo').selectOption({ label: captura.condiciones });
  await page.getByLabel('Equipo', { exact: true }).selectOption({ label: captura.equipo });
}

/**
 * Da de alta una captura desde el listado («Nueva captura») y espera a volver a él con el aviso.
 *
 * @param {object} page - La página de Playwright, con la sesión abierta.
 * @param {object} [captura] - Los datos de la captura. Por defecto, `CAPTURA`.
 * @returns {Promise<void>}
 */
export async function darDeAltaCaptura(page, captura = CAPTURA) {
  await page.goto('/ficha.html');
  await expect(page.getByRole('heading', { level: 1, name: 'Nueva captura' })).toBeVisible();
  await rellenarFicha(page, captura);
  await page.getByRole('button', { name: 'Guardar captura' }).click();
  await expect(page.getByText(`Has guardado «${captura.titulo}» en tu cuaderno.`)).toBeVisible();
}

/**
 * Edita una captura del listado: pulsa su «Editar», cambia los campos que se pasen y guarda.
 *
 * @param {object} page - La página de Playwright, en `listado.html`.
 * @param {string} tituloActual - El título con el que está guardada.
 * @param {object} cambios - Los campos que cambian.
 * @returns {Promise<void>}
 */
export async function editarCaptura(page, tituloActual, cambios) {
  await capturaDelListado(page, tituloActual).getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar captura' })).toBeVisible();
  // `?id=` ha cargado la captura guardada en el formulario antes de cambiar nada
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue(tituloActual);
  await rellenarFicha(page, { ...CAPTURA, ...cambios });
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
}

/**
 * La captura del listado con ese título (un elemento de la lista).
 *
 * @param {object} page - La página de Playwright, en `listado.html`.
 * @param {string} titulo - El título de la captura.
 * @returns {object} El localizador de esa captura.
 */
export function capturaDelListado(page, titulo) {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: titulo, exact: true }) });
}
