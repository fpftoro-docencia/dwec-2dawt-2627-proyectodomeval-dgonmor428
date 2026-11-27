// Recorrido 2 (requisito 21): el CRUD de capturas. Alta, edición y borrado con la confirmación del
// diálogo, comprobando siempre que lo guardado sigue ahí al recargar la página (y que lo borrado no).
import { test, expect } from '@playwright/test';
import {
  CAPTURA,
  registrarse,
  darDeAltaCaptura,
  editarCaptura,
  capturaDelListado,
} from './ayudas.js';

test.describe('Capturas (CRUD)', () => {
  test.beforeEach(async ({ page }) => {
    await registrarse(page);
  });

  test('una captura nueva aparece en el listado y sigue ahí al recargar', async ({ page }) => {
    await expect(page.getByText('Tu cielo aún está vacío')).toBeVisible();

    await darDeAltaCaptura(page);

    const captura = capturaDelListado(page, CAPTURA.titulo);
    await expect(captura).toBeVisible();
    await expect(captura.getByText(CAPTURA.lugar)).toBeVisible();
    await expect(captura.getByText('120 m')).toBeVisible();

    await page.reload();

    await expect(capturaDelListado(page, CAPTURA.titulo)).toBeVisible();
    await expect(page.getByText('Tu cielo aún está vacío')).toBeHidden();
  });

  test('una ficha incompleta no se guarda y marca los errores', async ({ page }) => {
    await page.goto('/ficha.html');
    await page.getByRole('button', { name: 'Guardar captura' }).click();

    await expect(page.getByText('Escribe un título.')).toBeVisible();
    await expect(page.getByText('Elige una categoría.')).toBeVisible();
    await expect(page).toHaveURL(/ficha\.html$/);
  });

  test('al editar una captura se ven los cambios, también tras recargar', async ({ page }) => {
    await darDeAltaCaptura(page);

    await editarCaptura(page, CAPTURA.titulo, { titulo: 'Amanecer en la sierra', altitud: '980' });
    await expect(
      page.getByText('Has guardado los cambios de «Amanecer en la sierra».'),
    ).toBeVisible();

    await page.reload();

    const editada = capturaDelListado(page, 'Amanecer en la sierra');
    await expect(editada).toBeVisible();
    await expect(editada.getByText('980 m')).toBeVisible();
    await expect(capturaDelListado(page, CAPTURA.titulo)).toHaveCount(0);
  });

  test('cancelar el diálogo de borrado conserva la captura', async ({ page }) => {
    await darDeAltaCaptura(page);

    await capturaDelListado(page, CAPTURA.titulo).getByRole('button', { name: 'Borrar' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByText(`¿Borrar «${CAPTURA.titulo}»?`)).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialogo).toBeHidden();
    await expect(capturaDelListado(page, CAPTURA.titulo)).toBeVisible();

    await page.reload();

    await expect(capturaDelListado(page, CAPTURA.titulo)).toBeVisible();
  });

  test('al borrar con confirmación la captura desaparece, también tras recargar', async ({
    page,
  }) => {
    await darDeAltaCaptura(page);

    await capturaDelListado(page, CAPTURA.titulo).getByRole('button', { name: 'Borrar' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByText(`¿Borrar «${CAPTURA.titulo}»?`)).toBeVisible();
    await dialogo.getByRole('button', { name: 'Borrar' }).click();

    await expect(page.getByText(`Has borrado «${CAPTURA.titulo}».`)).toBeVisible();
    await expect(capturaDelListado(page, CAPTURA.titulo)).toHaveCount(0);

    await page.reload();

    await expect(page.getByText('Tu cielo aún está vacío')).toBeVisible();
    await expect(capturaDelListado(page, CAPTURA.titulo)).toHaveCount(0);
  });

  test('dos clics seguidos en «Añadir imagen» con la primera URL vacía añaden dos imágenes', async ({
    page,
  }) => {
    await page.goto('/ficha.html');
    // Espera a algo que escribe el JavaScript de iniciarFicha (el «max» de la fecha), para que el
    // clic no llegue antes que el oyente (en la web publicada los módulos tardan más)
    await expect(page.getByLabel('Fecha y hora')).toHaveAttribute('max', /T/);
    const anadir = page.getByRole('button', { name: 'Añadir imagen' });

    // El primer clic añade la imagen y le da el foco a su URL, que se queda vacía
    await anadir.click();
    await expect(page.getByLabel('Dirección (URL)')).toBeFocused();

    // El segundo clic, con el ratón de verdad (pulsar y soltar), ya no se pierde aunque el campo
    // vacío tenga el foco: sin el arreglo, su error empujaba el botón hacia abajo entre pulsar y soltar
    await anadir.click();

    await expect(page.getByLabel('Dirección (URL)')).toHaveCount(2);
    await expect(page.getByText('2 de 3')).toBeVisible();
    // El foco está en la segunda URL, la recién añadida
    await expect(page.getByLabel('Dirección (URL)').nth(1)).toBeFocused();
    // El error aparece al validarse la primera URL al salir; la segunda tiene el foco y aún no
    await expect(page.getByText('Escribe la dirección de la imagen.')).toBeVisible();
  });

  test('quitar una imagen recién añadida y vacía no da errores y devuelve el foco a «Añadir imagen»', async ({
    page,
  }) => {
    const errores = [];
    page.on('pageerror', (error) => errores.push(error.message));

    await page.goto('/ficha.html');
    await expect(page.getByLabel('Fecha y hora')).toHaveAttribute('max', /T/);
    const anadir = page.getByRole('button', { name: 'Añadir imagen' });

    await anadir.click();
    await expect(page.getByLabel('Dirección (URL)')).toBeFocused();

    // El foco está en la URL vacía; quitar esa misma imagen hace que el campo pierda el foco
    await page.getByRole('button', { name: 'Quitar' }).click();

    await expect(page.getByLabel('Dirección (URL)')).toHaveCount(0);
    await expect(page.getByText('0 de 3')).toBeVisible();
    await expect(anadir).toBeFocused();
    expect(errores).toEqual([]);
  });
});
