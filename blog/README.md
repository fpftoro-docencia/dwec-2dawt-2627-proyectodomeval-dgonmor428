# Blog del proyecto

<!-- Tu diario de aprendizaje: al menos una entrada por sprint, escrita mientras trabajas.
     Copia la plantilla de abajo para cada entrada, de la más antigua a la más reciente.
     Lo que cuentas aquí puede salir en las preguntas de la exposición. -->

## 12/11/2026 · Sprint 1 · Del ordenador que no arrancaba al login que funciona

### Dificultades y cómo las resolví

**El entorno del ordenador de clase.** Para abrir el Dev Container hacía falta VS Code, pero el
icono de la barra de tareas daba el error «El elemento Code.exe… se cambió o se movió». Al buscarlo
vi que en la carpeta de VS Code no había `Code.exe`, sino `new_Code.exe`: el acceso directo apuntaba
a un archivo que ya no existía. Lo resolví abriendo VS Code desde el icono del menú de inicio que sí
funcionaba (el que tenía el logotipo azul). Además, Docker Desktop no estaba encendido, y sin él el
contenedor no arranca. Aprendí que «no funciona» casi siempre tiene una causa concreta que se puede
buscar, y que antes de tocar nada conviene mirar qué hay.

**`format:check` fallaba solo en Windows.** Prettier decía que 16 archivos tenían el formato mal,
incluidos archivos del profesor que no se pueden tocar. Contando los caracteres `\r` dentro del
contenedor vi que todos tenían finales de línea de Windows (CRLF), aunque en GitHub estaban con LF:
Git en Windows (`core.autocrlf=true`) los convertía al descargarlos. La solución fue un
`.gitattributes` con `* text=auto eol=lf`, que obliga a usar LF en cualquier sistema. Desde
entonces `format:check` pasa también aquí, y pasaría igual en otro ordenador con Windows.

**El primer diseño no me gustó.** La primera versión de las páginas (un estilo de señales de
senderos) me pareció muy básica. Además, al revisarla en el navegador, la «baliza» blanca y roja se
veía como la bandera de Polonia. Decidí borrarlo todo y empezar de nuevo con un estilo de cielo
nocturno (estrellas, aurora, cordilleras), hecho solo con CSS y SVG. Aprendí que una tarea no está
hecha porque compile: hay que mirarla con ojos de usuario, y si no convence, se rehace.

**Un test que falló… por culpa del test.** En los tests de los validadores escribí que «Nebulosas»
no tenía mayúscula, y el test falló. El código estaba bien: «Nebulosas» empieza por N. Cambié el
caso por «nebulosas». Aprendí que los tests también son código y también se equivocan.

**Un test que encontró un fallo de verdad.** En el registro, con todos los campos vacíos, el campo
«Repite la contraseña» se daba por bueno: una contraseña vacía «coincidía» con otra vacía. Lo
descubrió el test que comprueba que, con todo vacío, todos los campos salen marcados. Lo arreglé
para que un campo vacío diga «Repite la contraseña.».

**Un aviso que no se veía.** Al probar el inicio de sesión en el navegador con una contraseña
incorrecta, el aviso salía arriba del todo de la página; en una pantalla estrecha el formulario
queda más abajo y no se veía el mensaje mientras escribía. Ningún test automático lo detectó: lo vi
al probarlo. Lo moví dentro del panel del formulario.

### Problemas conceptuales

**Por qué los módulos reciben el almacenamiento como parámetro.** Al principio no entendía por qué
`leerJSON` no usa `localStorage` directamente. Si lo usara, solo se podría probar en un navegador.
Al recibirlo como parámetro, la misma función sirve con `localStorage`, con `sessionStorage` y, en
los tests, con `AlmacenFalso`, que guarda en memoria:

```js
// js/almacen.js
export function leerJSON(almacen, clave, porDefecto) {
  let texto;
  try {
    texto = almacen.getItem(clave);
  …
```

Las páginas hacen lo mismo con la navegación: `iniciarRegistro` recibe `navegar`, y en
`registro.html` se le pasa `(url) => location.assign(url)`, mientras que en los tests se le pasa
`vi.fn()` para comprobar adónde iría sin cambiar de página.

**El evento propio `aviso` y la propagación.** No veía cómo un formulario podía mostrar un mensaje
en la región de avisos sin conocerla. La clave es que el evento se crea con `bubbles: true`: sube por
el árbol del DOM hasta `document`, donde hay un único oyente que lo muestra, venga de donde venga.

```js
// js/avisos.js
elemento.dispatchEvent(
  new CustomEvent('aviso', { bubbles: true, detail: { mensaje, tipo } }),
);
```

**`async` y `await` con el resumen de la contraseña.** `resumirClave` devuelve una promesa porque el
navegador calcula el resumen sin bloquear la página. Por eso `registrarUsuario` es `async` y espera
el resumen con `await`. Mientras tanto la página sigue respondiendo, y por eso hacía falta evitar el
doble envío: una variable `enviando` hace que un segundo clic o Intro no haga nada
(`js/paginas/registro.js`).

**`location.replace` frente a `location.assign`.** Las dos cambian de página, pero `assign` añade
una entrada al historial y `replace` sustituye la actual. Por eso, sin sesión, las páginas privadas
llevan a `index.html` con `replace`: si usaran `assign`, el botón «Atrás» volvería a la página
privada, que volvería a echarte (`js/paginas/privada.js`).

**`localStorage` frente a `sessionStorage`.** Los usuarios tienen que durar para siempre, así que van
en `localStorage`. La sesión tiene que acabarse al cerrar la pestaña, así que va en
`sessionStorage`: al abrir de nuevo la web hay que volver a entrar.

**Qué hace `needs` en el workflow.** En `ci.yml`, el trabajo `Tests` tiene `needs: calidad`: no
empieza hasta que `Calidad` termina bien. Si el código no pasa ESLint, no se gastan minutos en los
tests. Lo vi en la pestaña «Checks» de la pull request 18: primero `Calidad` y después `Tests`.

## 24/11/2026 · Sprint 2 · Un CRUD que funciona y tests que no lo cuentan todo

### Dificultades y cómo las resolví

**El entorno, otra vez.** En el ordenador de clase no hay Node: todos los `npm run …` se ejecutan
dentro de Docker con la imagen del Dev Container. Un día Docker Desktop estaba apagado y las pruebas
de extremo a extremo no podían ni empezar; lo arranqué y seguí. Otro problema más raro: dos veces
`npm run coverage` falló con `EACCES: permission denied` al borrar `coverage/`. La carpeta se había
creado ejecutando el contenedor como `root`, y después el usuario normal no podía borrarla. La borré
(como `root`, una vez) y desde entonces el contenedor se usa siempre con el usuario por defecto. Lo
dejé escrito como regla para no repetirlo.

**«José» y «Jose» eran la misma persona.** En la zona de administración, el botón del propio
administrador está desactivado (no se puede quitar el rol a sí mismo). Para saber qué fila era la
suya comparaba nombres con `normalizar`, la función del buscador, que quita las tildes. Resultado: con
la sesión de «José», la fila de otro usuario «Jose» también salía bloqueada. Los tests pasaban porque
ninguno tenía dos nombres que solo se diferenciaran por una tilde. Lo encontró la revisión. Lo
arreglé con una función propia, `mismoNombre`, que no distingue mayúsculas pero sí tildes, y añadí un
test con «José» y «Jose».

**La ficha podía guardar dos veces la misma captura.** El inicio de sesión y el registro ya evitaban
el doble envío, pero la ficha no: si se enviaba dos veces muy rápido, se guardaban dos capturas, cada
una con su `id`. Tampoco lo veía ningún test, porque todos enviaban el formulario una sola vez. Lo vi
al escribir la sección del README sobre formularios: el texto decía que estaba resuelto y al
comprobarlo no lo estaba. Hice una tarjeta aparte, añadí `ponerEnviando` y una variable `enviando`, y
un test que envía dos veces y comprueba que solo hay una captura.

**Escribí cosas falsas en el README.** Al documentar, varias frases sonaban bien pero no eran
verdad, y las encontró la revisión comparándolas con el código:

- que el umbral de cobertura «bloquea la *pull request*» (en GitHub no hay protección de rama: no
  fusionar con una comprobación en rojo es una norma mía, no una regla de GitHub);
- que con el botón desactivado Intro vuelve a enviar el formulario (no: lo que sí envía es
  `requestSubmit()` desde el código);
- que una «ñ» ocupa dos posiciones en `.length` (ocupa una; los que ocupan dos son los emojis).

Aprendí que la documentación también se prueba: cada afirmación tiene que poder comprobarse.

**Un test que no podía fallar.** Al revisar los tests de integración había uno que comprobaba que la
lista de usuarios quedaba vacía para un usuario normal, pero la lista solo quedaba vacía porque el
propio test no iniciaba la página. Nunca habría fallado. Lo quité y lo sustituí por uno que lee el
script real de `usuarios.html` y comprueba que pasa `soloAdministradores: true`: si alguien lo borra
del HTML, el test falla.

**Perdí parte del borrador del blog.** El borrador (`blog/BORRADOR.md`) se sobrescribió entero sin
leerlo antes, y como está en el `.gitignore` git no tenía copia. Se perdieron varias secciones. Lo
regeneré a partir del historial de commits y de `AGENTS.md`. Lección: lo que no está en git no tiene
«deshacer».

### Problemas conceptuales

**Desactivar el botón no es lo mismo que evitar el doble envío.** Con el botón de envío desactivado,
ni el clic ni Intro envían el formulario. Pero `formulario.requestSubmit()` sí, y cualquier código
puede llamarlo. Por eso, además del botón, el oyente comprueba una variable:

```js
// js/paginas/ficha.js
formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (enviando) {
    return;
  }
  …
```

`aria-busy` también se pone, pero es para el lector de pantalla, no para guardar el estado del
programa.

**Delegación de eventos con `closest`.** En el listado, en la administración, en la paginación y en
las imágenes de la ficha hay un solo oyente en el contenedor, no uno por botón. `closest` sube desde
lo que se ha pulsado (que puede ser el texto de dentro del botón) hasta el botón, y sirve también para
los elementos que se pintan después:

```js
const boton = evento.target.closest('[data-accion="borrar"]');
if (boton === null) {
  return;
}
```

**El _debounce_ es un cierre.** El buscador no filtra con cada tecla, sino 300 ms después de la
última. `retardar` guarda el temporizador en una variable que solo ve la función que devuelve; cada
llamada cancela el anterior:

```js
// js/buscar.js
export function retardar(funcion, ms) {
  let temporizador = null;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...argumentos), ms);
  };
}
```

En los tests no se espera de verdad: con `vi.useFakeTimers()` se avanza el reloj a mano
(`advanceTimersByTime(299)`: todavía no filtra; uno más: ya sí).

**`blur` no sube.** La validación de cada campo empieza al salir de él. `blur` no hace burbuja, así que
un oyente en el formulario no lo recibiría; en la fase de captura sí, porque baja desde `document`
hasta el campo. Con un solo `addEventListener('blur', …, true)` en el formulario valen todos los
campos, también los de las imágenes que se añaden después.

**Qué mide de verdad la cobertura.** El 90 % de `vitest.config.js` cuenta las líneas de
`validadores.js` y `paginar.js` que ejecuta **cualquier** test. Si quito un caso de los tests de un
validador, los tests de la ficha siguen pasando por esa línea y `npm run coverage` no falla. Que una
línea se ejecute no quiere decir que su regla esté comprobada. Para eso está el doble testeo: repasar
cada punto de la tarjeta frente a los tests.

**Cada nivel de la pirámide ve cosas distintas.** Los unitarios prueban funciones sueltas; los de
integración, una página entera en happy-dom con el almacenamiento falso; los e2e, el navegador real.
Al escribir el e2e de editar, mi test esperaba el botón «Guardar captura», pero al editar el código lo
cambia a «Guardar cambios». Ese detalle solo lo vio el navegador.

**Los trabajos del workflow se esperan unos a otros.** En el paso 2 de la integración continua,
`Tests` espera a `Calidad` y `E2E` espera a `Tests` (`needs`): si falla lo barato, no se gastan
minutos en instalar Chromium. El informe de cobertura se sube con `if: always()` (también cuando el
umbral falla, que es cuando más hace falta verlo) y el de Playwright con `if: failure()` (solo si
algo falla).

## 27/11/2026 · Sprint 3 · Publicar solo lo que funciona

### Dificultades y cómo las resolví

**Las pruebas pasaban en local y fallaban en Vercel.** La primera vez que pasé los e2e contra la web
publicada (con `BASE_URL`) fallaron 3 de 10. Eran las que cierran la sesión y vuelven a entrar: el
clic en «Cerrar sesión» llegaba antes de que el JavaScript de la página pusiera su oyente. En local
los módulos cargan casi al instante; en Vercel tardan un poco más, y Playwright es más rápido que una
persona. La solución no fue esperar un tiempo fijo (`waitForTimeout` está prohibido en mis pruebas),
sino esperar a ver algo que escribe **la misma función** que pone el oyente:

```js
// e2e/ayudas.js
export async function cerrarSesion(page, nombre = USUARIO.nombre) {
  await expect(page.getByRole('banner').getByText(nombre)).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  …
```

El nombre de la cabecera lo pinta `iniciarPaginaPrivada`, que también engancha «Cerrar sesión»: si
se ve el nombre, el oyente ya está. Lo dejé como regla para todas las pruebas nuevas.

**Bloqueé la publicación en producción.** Puse `E2E desplegado` como Deployment Check de Vercel y lo
lanzaba con el evento `deployment_status`. Para las vistas previas funcionaba. Pero en producción
Vercel no publicaba nunca: esperaba a que `E2E desplegado` pasara, y `E2E desplegado` esperaba a un
aviso que Vercel solo manda **después** de publicar. Cada uno esperaba al otro. Paré, lo apunté y
quité el check para no dejar la web sin publicar. Después, leyendo la documentación de Deployment
Checks de Vercel, encontré el evento correcto: `repository_dispatch` de tipo
`vercel.deployment.ready`, que llega con la versión construida pero **todavía retenida**. Con eso
`E2E desplegado` volvió a ser un check y ahora cada versión de `main` se prueba antes de publicarse.

**Romper a propósito para demostrar algo.** La evidencia de la versión retenida pide fusionar en
`main` un cambio que rompa una prueba. Me costó hacerlo: era ir contra mi propia regla de no
fusionar nunca en rojo. Cambié el título que espera la prueba de humo (#53), vi el workflow en rojo
y Vercel marcó la versión «Checks Failed». Lo difícil fue demostrar que **no** se había publicado,
porque la web se veía igual (solo había roto una prueba, no la página). La prueba estaba en Vercel:
el distintivo «Production» seguía en el commit anterior. Después lo revertí (#54) y todo volvió a
verde.

**Un clic que se perdía.** En la comprobación final, con la dirección de una imagen vacía, un clic
en «Añadir imagen» no hacía nada. Al pulsar, el campo perdía el foco, salía su error, el botón
bajaba unos píxeles y al soltar el ratón ya no estaba encima: no hay `click` si pulsar y soltar
caen en sitios distintos. Ningún test de happy-dom lo podía ver (no hay ratón ni posiciones); hizo
falta un e2e con clics de verdad (ningún e2e tocaba las imágenes), y comprobé que ese e2e fallaba
sin el arreglo y pasaba con él.

**Herramientas que se pisan.** Vitest empezó a fallar porque recogía las pruebas de unas copias de
trabajo del proyecto que había dentro de `.claude/`. Lo arreglé excluyendo esa carpeta en
`vitest.config.js` y en ESLint. Y la prueba de humo abre `/index.html` y no `/`, porque en local
`serve` enseña en la raíz un listado de carpetas.

### Problemas conceptuales

**Vista previa y producción.** Al principio pensaba que Vercel publicaba cada `push`. No: cada
`push` a una rama crea una **vista previa** con su propia dirección, y solo lo que llega a `main`
va a producción. Además, con los Deployment Checks, producción no cambia hasta que las cuatro
comprobaciones (`Calidad`, `Tests`, `E2E` y `E2E desplegado`) están en verde. Si una falla, la
versión se queda **retenida** y la web sigue con la anterior. Por eso la evidencia 3 se ve igual
desde fuera.

**Dos eventos para lo mismo.** `despliegue.yml` escucha dos eventos porque llegan en momentos
distintos (resumido, sin los comentarios del archivo):

```yaml
on:
  deployment_status:
  repository_dispatch:
    types: [vercel.deployment.ready]
```

- `deployment_status` llega cuando una vista previa termina. También llega para producción, pero
  después de publicar, así que el trabajo lo ignora con su `if`.
- `repository_dispatch` llega cuando la versión de producción está construida pero aún sin
  publicar.

Con `repository_dispatch`, además, la acción `vercel/repository-dispatch/actions/status@v1` escribe
el estado `E2E desplegado` en el commit, que es lo que lee Vercel. Para eso el workflow necesita en
`permissions`, además de `contents: read`, `statuses: write` (escribir el estado) y `actions: read`
(la acción lee los trabajos de la ejecución para saber cómo ha terminado). Aprendí que los permisos se piden uno a uno, solo los necesarios.

**Una prueba de humo prueba poco a propósito.** `e2e/humo.spec.js` solo abre la página de inicio y
mira que salga el formulario. Si fallara, sería porque la web no responde, no por un detalle de una
funcionalidad. Y prueba **la web publicada**, no el commit del *tag*: por eso el *tag* `v1.0` se pone
en un commit de `main` que Vercel ya ha publicado.

**No meter `${{ }}` dentro de un `run`.** En `release.yml` el nombre de la versión llega por `env`:

```yaml
run: (cd dist && zip -r "../$VERSION.zip" .)
env:
  VERSION: ${{ github.ref_name }}
```

Si escribiera `${{ github.ref_name }}` directamente en el `run`, GitHub lo pegaría en el script
antes de ejecutarlo, y un nombre de *tag* raro podría colar órdenes. Como variable de entorno es
solo texto.

**Cancelar el `mousedown` no cancela el clic.** Para arreglar el clic perdido, `activarValidacion`
hace `preventDefault()` en el `mousedown` de los botones del formulario. Lo que el navegador hace
por defecto al pulsar es mover el foco; si se cancela, no hay `blur`, el botón no se mueve y el
`click` llega. El campo se valida después, al enviar o cuando el código del clic mueve el foco. El
orden con el ratón es `mousedown` → `blur` → `mouseup` → `click`; con el teclado no hay `mousedown`,
así que no cambia nada.

**La documentación del código también se comprueba.** Con JSDoc, `npm run docs` falla si un tipo está
mal escrito (por ejemplo, `(x: string) => void`, que es de TypeScript; en JSDoc es
`function(string): void`). `@listens` y `@fires` dicen qué eventos escucha o lanza cada función:
cuando añadí el `mousedown`, tuve que añadir su `@listens` y su fila en la tabla de oyentes del
README, que pasó de 18 a 19.
