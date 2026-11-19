// Recorrido 1 (requisito 21): la sesión. Registrarse como primer usuario, cerrar sesión y volver a
// entrar. Cada prueba empieza con el almacenamiento vacío (contexto nuevo de Playwright), así que el
// primer usuario que se registra es administrador.
import { test, expect } from '@playwright/test';
import { USUARIO, registrarse, iniciarSesion, cerrarSesion } from './ayudas.js';

test.describe('Sesión', () => {
  test('la primera persona que se registra es administradora y ve «Usuarios»', async ({ page }) => {
    await registrarse(page);

    // Solo el principio del aviso: el resto lleva el nombre y la frase del administrador
    await expect(page.getByText('Te has registrado.')).toBeVisible();
    await expect(page.getByText(USUARIO.nombre, { exact: true })).toBeVisible();
    await expect(page.getByText('Administrador', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();
  });

  test('se cierra la sesión y se vuelve a entrar con los mismos datos', async ({ page }) => {
    await registrarse(page);

    await cerrarSesion(page);
    await expect(page.getByText('Has cerrado la sesión.')).toBeVisible();

    await iniciarSesion(page);
    await expect(page.getByText(`Hola de nuevo, ${USUARIO.nombre}.`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();
  });

  test('con una contraseña incorrecta no se entra y se avisa sin decir cuál falla', async ({
    page,
  }) => {
    await registrarse(page);
    await cerrarSesion(page);

    await page.getByLabel('Nombre de usuario').fill(USUARIO.nombre);
    await page.getByLabel('Contraseña', { exact: true }).fill('OtraClave2026');
    await page.getByRole('button', { name: 'Entrar en mi diario' }).click();

    await expect(page.getByText('El usuario o la contraseña no son correctos.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  });

  test('sin sesión, el listado lleva a la página de inicio de sesión', async ({ page }) => {
    await page.goto('/listado.html');

    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/index\.html$/);
  });

  test('tras cerrar la sesión, el listado vuelve a estar protegido', async ({ page }) => {
    await registrarse(page);
    await cerrarSesion(page);

    await page.goto('/listado.html');

    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  });
});
