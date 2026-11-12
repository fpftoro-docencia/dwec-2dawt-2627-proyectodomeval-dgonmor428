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
