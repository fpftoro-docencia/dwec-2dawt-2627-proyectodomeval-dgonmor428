// Prueba de humo: la comprobación más corta posible de que lo publicado «está vivo».
// Su nombre viene de la electrónica: se enciende el aparato y se mira si sale humo. No prueba
// ninguna funcionalidad (para eso están `sesion.spec.js` y `capturas.spec.js`); solo que la web
// responde y enseña su página de inicio. Por eso es tan corta y tan rápida: se ejecuta tras cada
// publicación, y cuanto menos haga, menos motivos tiene para fallar por otra cosa.
//
// Es de solo lectura: no registra usuarios ni toca el almacenamiento, así que no cambia nada en la
// web publicada. La dirección es relativa (`/index.html`) para valer con `serve` y con `BASE_URL`.
// Es `/index.html` y no `/`: en local, `serve` muestra en la raíz un listado de carpetas en vez de
// la página de inicio (en Vercel sí sale `index.html`), y así la prueba vale igual en los dos sitios.
// Lo que NO detecta: solo mira el HTML de la página de inicio, no el JavaScript ni las demás páginas.
import { test, expect } from '@playwright/test';

test('la web responde y muestra el inicio de sesión', async ({ page }) => {
  // `goto` devuelve la respuesta del servidor (o `null` en casos raros, por eso el `?.`)
  const respuesta = await page.goto('/index.html');
  expect(respuesta?.ok()).toBe(true);

  await expect(page).toHaveTitle('Horizonte · ROTO A PROPÓSITO para la evidencia');

  // El formulario de inicio de sesión, tal como lo vería un usuario
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByLabel('Nombre de usuario')).toBeVisible();
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar en mi diario' })).toBeVisible();
});
