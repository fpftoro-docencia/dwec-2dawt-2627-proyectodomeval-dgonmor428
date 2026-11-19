# Horizonte

![Integración continua](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/actions/workflows/ci.yml/badge.svg)

<!-- Completa cada sección a medida que avanzas en los sprints. Borra los comentarios como este
     cuando termines. Este README es también la portada de la documentación que genera `npm run docs`.
     No cambies los títulos de las secciones (##): la corrección los busca por su nombre. -->

## Mi proyecto

**Horizonte** es un diario personal de fotografía y observación de **paisajes, del cielo y del espacio**. Cada usuario guarda sus capturas (un atardecer, una tormenta, una aurora, la Vía Láctea, una nebulosa…) con su lugar, sus coordenadas, sus imágenes y la información de cómo las hizo. El administrador gestiona a los usuarios de la aplicación. Se inspira en Locationscout (paisajes con coordenadas) y AstroBin (astrofotografía).

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

### La entidad

La entidad es la **captura**. Cada usuario ve solo las suyas. Hay un **campo condicional** (los datos astronómicos, solo si la categoría es «Espacio») y un **grupo dinámico** (las imágenes, de 0 a 3).

| Campo | Control | Obligatorio | Regla de validación | Mensaje si no se cumple |
|-------|---------|:-----------:|---------------------|-------------------------|
| Título | Texto | Sí | No puede quedar vacío | «Escribe un título.» |
| Categoría | Botones de opción: Paisaje, Cielo, Espacio | Sí | Hay que elegir una | «Elige una categoría.» |
| Fecha y hora | `datetime-local` | Sí | No puede ser futura (el `max` lo pone el código con la fecha y la hora de ahora) | «Escribe la fecha y la hora.» / «La fecha no puede ser futura.» |
| Lugar | Texto | Sí | No puede quedar vacío | «Escribe el lugar.» |
| Coordenadas GPS | Texto | Sí | Regex del formato `36.7213, -4.4214` **y** comprobación con código de los rangos (latitud entre −90 y 90, longitud entre −180 y 180) | «Escribe las coordenadas.» / «Usa el formato 36.7213, -4.4214.» / «La latitud va de −90 a 90 y la longitud de −180 a 180.» |
| Altitud (m) | Número | Sí | Entre −430 y 8849 | «Escribe la altitud.» / «La altitud va de −430 a 8849 m.» |
| Condiciones del cielo | Lista desplegable: despejado, nubes, niebla, lluvia, tormenta, nieve, aurora | Sí | Hay que elegir una | «Elige las condiciones del cielo.» |
| Equipo | Lista desplegable: móvil, cámara, prismáticos, telescopio | Sí | Hay que elegir uno | «Elige el equipo.» |
| Código de observatorio | Texto | No | Si se rellena: regex `OBS-NNNN-D` **y** comprobación con código de que el último dígito (D) es el dígito de control: la suma de las cuatro cifras multiplicadas por 3, 1, 3 y 1, módulo 10 (`OBS-4821-7`: 4·3 + 8·1 + 2·3 + 1·1 = 27 → 7) | «Usa el formato OBS-4821-7.» / «El dígito de control no es correcto.» |
| **Campo condicional** (solo si la categoría es «Espacio»; con `hidden` y `disabled` en otro caso) | | | | |
| Código de catálogo | Texto | Sí, si se ve | Regex: `M42`, `NGC 1976`, `IC 434` | «Escribe el código de catálogo.» / «Usa un código como M42, NGC 1976 o IC 434.» |
| Ascensión recta | Texto | Sí, si se ve | Regex del formato `05h 35m 17s` | «Escribe la ascensión recta.» / «Usa el formato 05h 35m 17s.» |
| Declinación | Texto | Sí, si se ve | Regex del formato `-05° 23′ 28″` (también con `'` y `"` del teclado) | «Escribe la declinación.» / «Usa el formato -05° 23′ 28″.» |
| **Grupo dinámico: imágenes** (de 0 a 3, desde un `<template>`) | | | | |
| URL de la imagen | Texto | Sí, en cada imagen añadida | Regex de URL `http://` o `https://` (se guarda la URL, no el fichero, porque `localStorage` solo admite unos 5 MB) | «Escribe la dirección de la imagen.» / «Escribe una URL que empiece por http:// o https://.» |
| Pie de foto | Texto | No | Como mucho 120 caracteres | «Usa 120 caracteres como mucho.» |

### El registro de usuarios

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| Nombre de usuario | Texto | Obligatorio; regex: de 3 a 20 caracteres entre letras, cifras y `_`; y no puede estar ocupado | «Escribe un nombre de usuario.» / «Usa de 3 a 20 letras, cifras o _.» / «Ese nombre ya está en uso.» |
| Correo | Correo (`type="email"`) | Obligatorio; regex de correo | «Escribe tu correo.» / «Escribe un correo válido.» |
| Contraseña | Contraseña | Obligatoria; mínimo 8 caracteres, con una minúscula (`\p{Ll}`), una mayúscula (`\p{Lu}`) y una cifra. Se ve cuáles cumple mientras se escribe | «Escribe una contraseña.» / «La contraseña no cumple todos los requisitos.» |
| Repetir contraseña | Contraseña | Obligatoria e igual que la contraseña | «Repite la contraseña.» / «Las contraseñas no coinciden.» |
| Aceptación | Casilla | Obligatoria | «Tienes que aceptar las condiciones.» |

### Páginas

| Página | Acceso | Qué hace |
|--------|--------|----------|
| `index.html` | Pública | Inicio de sesión. Si ya hay sesión, lleva al listado |
| `registro.html` | Pública | Alta de un usuario. El primero que se registra es administrador |
| `listado.html` | Usuarios | Lista, busca, pagina y borra las capturas del usuario |
| `ficha.html` | Usuarios | Da de alta una captura o edita una existente (`ficha.html?id=…`) |
| `usuarios.html` | Administradores | Lista y busca usuarios, y da o quita el rol de administrador |

## Arquitectura y módulos

<!-- 1. Un diagrama (Mermaid) de tus módulos y de qué usa cada uno.
     2. Tabla con cada módulo: qué hace, si usa el DOM y qué exporta.
     3. Cómo están hechos tus objetos (funciones fábrica o clases) y qué patrones de diseño usas
        (al menos dos): dónde y por qué.
     4. Cómo reciben las páginas lo que necesitan (almacenamiento, sesión, navegación) y por qué así
        se pueden probar.
     5. Qué documenta tu JSDoc y cómo se genera la documentación (`npm run docs`). -->

## Cómo ejecutarlo

### Abrir el proyecto

El proyecto trae su **Dev Container** en `.devcontainer/`: un entorno con Node.js 24 y Chromium (para
las pruebas de extremo a extremo), igual en cualquier ordenador.

1. Con **Docker Desktop** en marcha, abre en VS Code la carpeta del repositorio (la que contiene
   `.devcontainer/`).
2. Ejecuta **Dev Containers: Reopen in Container**. La primera vez tarda, porque construye la imagen.
3. Al crearse, el contenedor ejecuta `npm install`; al abrirse, arranca el servidor de la web.
4. Abre **<http://localhost:3901>** (si no responde, búscala en el panel **Puertos** de VS Code).

La web usa módulos de JavaScript, así que necesita un servidor: abrir los HTML con doble clic no
funciona. Las órdenes de abajo se escriben en la terminal de VS Code, que ya es la del contenedor.

### Órdenes

| Orden | Qué hace |
|-------|----------|
| `npm test` | Pasa los tests unitarios (`tests/unitarios/`) y de integración (`tests/integracion/`) con Vitest. |
| `npm run coverage` | Pasa los mismos tests y mide la cobertura; el informe queda en `coverage/`. |
| `npm run e2e` | Pasa las pruebas de extremo a extremo de `e2e/` con Playwright, en Chromium. Arranca la web solo; con la variable `BASE_URL` las pasa contra otra dirección (por ejemplo, la web publicada). |
| `npm run lint` | Revisa el JavaScript con ESLint y sus reglas (explicadas en «ESLint y Prettier»). |
| `npm run format:check` | Comprueba que todo el código tiene el formato de Prettier, sin cambiar nada. |
| `npm run format` | Le da el formato de Prettier a todo el código. |
| `npm run docs` | Genera la documentación del código a partir de los comentarios JSDoc, en `docs/`. |
| `npm run build` | Prepara la web publicable en `dist/`: las páginas, `css/`, `js/`, `img/` y el CSS de Bootstrap. |

`coverage/`, `docs/`, `dist/`, `playwright-report/` y `test-results/` se generan al ejecutar estas
órdenes y no se suben al repositorio (ver el `.gitignore`).

### Al terminar

Cierra VS Code y borra el contenedor para liberar memoria (tu trabajo está en la carpeta, no se
pierde). En una terminal de Windows (PowerShell):

```bash
docker rm -f $(docker ps -aq --filter label=devcontainer.local_folder)
```

## Almacenamiento y sesión

Horizonte no tiene servidor: todo se guarda en el navegador, siempre como texto JSON y siempre a
través de `js/almacen.js`, cuyas lecturas nunca fallan (si lo guardado está estropeado, devuelven un
valor por defecto).

### Las claves

| Clave | Dónde | Qué guarda | Ejemplo |
|-------|-------|------------|---------|
| `horizonte.usuarios` | `localStorage` | La lista de usuarios: nombre, correo, **resumen** SHA-256 de la contraseña (nunca la contraseña) y rol. | `[{"nombre":"ana","correo":"ana@ejemplo.es","resumen":"4f7e57cc…47e5","rol":"administrador"}]` |
| `horizonte.sesion` | `sessionStorage` | Quién ha entrado y con qué rol. Nada más: ni correo ni contraseña. | `{"nombre":"ana","rol":"administrador"}` |
| `horizonte.aviso` | `sessionStorage` | Un aviso que espera a la página siguiente («Te has registrado»). Se borra al mostrarse. | `{"mensaje":"Te has registrado…","tipo":"exito"}` |
| `horizonte.capturas.<usuario>` | `localStorage` | Las capturas de **un** usuario, cada una con su `id` único (`crypto.randomUUID()`). Hay una clave por usuario, con el nombre en minúsculas. | `horizonte.capturas.ana` → `[{"titulo":"Vía Láctea en el Teide","categoria":"espacio",…,"id":"3b241101-…"}]` |

**Una clave por usuario** (`js/capturas.js`): cada uno lee solo la suya, así que no puede ver ni
cambiar las capturas de otro, ni aunque conozca su `id`. Si lo guardado está estropeado, se
descartan las entradas que no son capturas (sin `id` de texto) y se quedan las buenas.

### Por qué cada dato va donde va

- **`localStorage` dura para siempre** (hasta que se borra). Los usuarios tienen que seguir ahí
  mañana, así que van en `localStorage`. Las capturas, igual.
- **`sessionStorage` dura lo que dura la pestaña.** La sesión tiene que acabarse al cerrarla: si
  vuelves a abrir la web, tienes que entrar otra vez. El aviso pendiente solo tiene sentido al pasar
  de una página a la siguiente, así que también va aquí.

### El rol y la protección de las páginas

- **El rol se decide al registrarse:** el primer usuario de la lista es `administrador` y los demás,
  `usuario` (`js/usuarios.js`). Al entrar, el rol se copia a la sesión.
- **Por sesión:** cada página privada (listado, ficha y usuarios) llama al empezar a
  `iniciarPaginaPrivada` (`js/paginas/privada.js`). Si no hay sesión, o está estropeada, lleva a
  `index.html` con `location.replace`, que sustituye la página en el historial: el botón «Atrás» no
  devuelve a la página privada.
- **Por rol:** `usuarios.html` se inicia con `soloAdministradores: true`. Si la sesión no es de un
  administrador, la página lleva al listado y deja el aviso «La página de usuarios es solo para
  administradores.». Además, el enlace «Usuarios» del menú solo se muestra a los administradores.
- **Al revés:** si ya hay sesión, `index.html` lleva directamente al listado.

### Por qué este inicio de sesión no es seguro

Toda la comprobación ocurre **en el navegador de quien usa la web**, y ese navegador lo controla esa
persona. Con las DevTools (pestaña **Aplicación** o la consola) puede leer y cambiar
`localStorage` y `sessionStorage` a su gusto. Lo comprobé: sin ningún usuario registrado, escribí
esto en la consola y abrí `usuarios.html`:

```js
sessionStorage.setItem('horizonte.sesion', JSON.stringify({ nombre: 'intruso', rol: 'administrador' }));
```

La página me dejó entrar y la cabecera decía «intruso · Administrador». Con las DevTools también se
puede:

- ver los resúmenes de las contraseñas en `localStorage` e intentar adivinarlas probando contraseñas
  típicas (el resumen SHA-256 no se puede «deshacer», pero sí comparar con el de contraseñas comunes);
- cambiarse el rol a `administrador` en la lista de usuarios;
- leer o borrar los datos de cualquier usuario de ese navegador.

**Cómo se hace en una aplicación real:** los usuarios y las contraseñas están en un **servidor**, que
es quien comprueba la contraseña (guardada con un resumen lento y con «sal», como bcrypt o Argon2) y
entrega una sesión firmada (una cookie `HttpOnly` o un token) que el navegador no puede inventar. El
servidor comprueba esa sesión y el rol **en cada petición**: aunque alguien cambie la página en su
navegador, el servidor no le da los datos. La conexión va siempre por HTTPS. Aquí el inicio de sesión
es una simulación para practicar el DOM y el almacenamiento, y por eso el repositorio insiste en no
usar datos reales.

## Funcionalidad y formularios

<!-- Una subsección por parte de la aplicación (sesión y registro, listado y paginación, ficha,
     zona de administración): qué hace y cómo lo has resuelto. Incluye:
     - cómo lees los datos (FormData: get, getAll), cómo creas y numeras el grupo dinámico, cómo
       funciona el campo condicional, qué atributos pones desde el código y cómo rellenas el
       formulario al editar;
     - la validación: cuándo validas cada campo, de dónde salen los mensajes (validity,
       setCustomValidity y tus validadores), qué haces para que los errores sean accesibles y cómo
       evitas el doble envío;
     - las expresiones regulares: tabla con cada una, en qué validador está, qué acepta (un ejemplo)
       y qué significan sus partes y sus flags; qué parte de la validación hace la expresión y qué
       parte el código. -->

## Eventos

### Eventos en el HTML

Antes de escribir un oyente me pregunto si el HTML ya hace el trabajo. Esto es lo que consigo sin
JavaScript:

| Qué uso en el HTML | Qué consigo sin escribir un oyente |
|--------------------|-------------------------------------|
| `<form>` con un `<button type="submit">` | Que Intro envíe el formulario desde cualquier campo. Solo escucho `submit` (no el `click` del botón), y se dispara con el ratón, con Intro y con `requestSubmit()` |
| `novalidate` en los formularios | Que el navegador no pare el envío con sus globos de error: los mensajes los pongo yo en `js/validacion.js`. Los **atributos de validación** (`required`, `type="email"`, `minlength`, `max`…) siguen funcionando: el navegador calcula `validity` y mi código solo lo lee |
| `<label for="…">` | Que pulsar la etiqueta dé el foco al campo (o marque el botón de opción) y que el lector de pantalla lea el nombre del campo. Sin oyente |
| `<dialog>` con `<form method="dialog">` | Que los botones «Cancelar» y «Borrar» cierren el diálogo solos, que Escape lo cierre y que `returnValue` guarde el `value` del botón pulsado. Solo escucho `close` |
| `<a href="ficha.html?id=…">` («Editar», «Nueva captura») | Navegar sin oyente: es un enlace de verdad, se abre en otra pestaña y funciona con el teclado |
| `<input type="search">` | Que el lector de pantalla lo anuncie como cuadro de búsqueda y, según el navegador, que Escape lo vacíe o aparezca un botón para borrar el texto. Con `<div role="search">` y sin `<form>`, Intro no envía nada |
| `disabled` en los botones | Que un botón desactivado no reciba clics (los límites de las imágenes, el administrador que no puede quitarse el rol) |

Todos estos casos están en el código: `novalidate` en `index.html`, `registro.html` y `ficha.html`,
y el `<dialog>` en `listado.html`.

**Por qué no uso atributos `on…`** (`onclick="…"`, `onsubmit="…"`):

- **Separo las capas:** el HTML dice qué hay y el JavaScript qué hace. Con `on…` se mezclan.
- **Todos los oyentes están en un sitio:** si quiero saber qué pasa al hacer clic, busco
  `addEventListener` en `js/` (la tabla de «Propagación» los lista todos). Con `on…` tendría que
  mirar también cada HTML.
- **Seguridad:** una política de seguridad de contenido (CSP) que bloquee el JavaScript escrito en
  el HTML solo se puede activar si no hay atributos `on…`. Este proyecto aún no tiene CSP, pero así
  podría tenerla sin cambiar nada.
- **`addEventListener` es más flexible:** admite varios oyentes del mismo evento en el mismo
  elemento. `#form-ficha` tiene dos oyentes `change` (`ficha.js`, para la categoría, y
  `validacion.js`, para validar), cosa que un atributo `on…` no permite. También tiene opciones,
  como la fase de captura, y se puede quitar con `removeEventListener` (lo hace `escucharAvisos` al
  devolver su función de limpieza).
- **Se prueba mejor:** las funciones reciben `documento` y así los tests de integración pueden
  simular al usuario sin tocar el HTML.

### Tipos de eventos

| Evento | Dónde se usa | Por qué este y no otro parecido |
|--------|--------------|---------------------------------|
| `submit` | Formularios de `index.html`, `registro.html` y `ficha.html` | Se dispara siempre que se envía el formulario: con el botón, con Intro o con `requestSubmit()`. `click` en el botón no cubre `requestSubmit()` y mezcla el botón con el envío, que es cosa del formulario. Llamo a `preventDefault()` para que el navegador no recargue la página y hago yo el trabajo |
| `input` | Buscadores (listado y usuarios), la contraseña del registro y `js/validacion.js` | Salta con **cada cambio** del valor (teclear, pegar, borrar). Es lo que necesito para filtrar mientras se escribe, marcar los requisitos de la contraseña y revalidar un campo ya tocado |
| `change` | `js/validacion.js` y los botones de categoría de la ficha | Salta al **confirmar** el valor. En los botones de opción, casillas y `datetime-local` no hay un «escribir» que valga: el cambio es el momento. En la validación lo uso junto a `input` como red de seguridad, por si algún control o navegador solo lanza `change`. Validar dos veces no hace daño: `validarCampo` da el mismo resultado si se repite |
| `blur` | `js/validacion.js` (fase de captura) | Para la **primera** validación de cada campo: no quiero decirle «obligatorio» a alguien que aún no ha empezado a escribir, sino cuando se va del campo. Uso `blur` en la fase de captura (no `focusout`): lo justifico en «Propagación» |
| `click` | Cerrar sesión, «Cerrar» del aviso, botones de la paginación, «Añadir/Quitar imagen», «Borrar» del listado y «Hacer/Quitar administrador» | Para botones que no envían nada. Los pongo siempre con delegación, salvo «Cerrar sesión» (un botón fijo) |
| `close` | `<dialog id="dialogo-borrar">` en `listado.js` | El diálogo se cierra con «Cancelar», con «Borrar» **y con Escape**. Si escuchara `click` en «Borrar», no sabría reaccionar al resto y tendría que repetir la lógica en cada botón. Con `close` hay un solo punto de salida, y `returnValue` me dice cuál fue |
| `aviso` (propio) | Se lanza desde las páginas y la validación, se recoge en `document` (`js/avisos.js`) | Un `CustomEvent` con `bubbles: true` y `detail: { mensaje, tipo }`. Quien avisa no necesita saber dónde está la región de avisos: solo lanza el evento y sube hasta `document` |

**`preventDefault`** lo uso solo en los tres `submit` (`entrar.js`, `registro.js` y `ficha.js`):
cancela el envío normal del navegador, que recargaría la página y perdería los datos. No lo uso en
los enlaces ni en el diálogo porque ahí quiero el comportamiento nativo.

**`input` frente a `change`, dónde se usa cada uno:**

- Solo `input`: los dos buscadores y los requisitos de la contraseña. Con `change` no pasaría nada
  hasta salir del campo.
- Solo `change`: la categoría de la ficha, para mostrar u ocultar los datos del espacio.
- Los dos: `js/validacion.js`, con la misma función `alCambiar` para ambos.

### Propagación

Un evento recorre tres fases: **captura** (baja desde `document` hasta el elemento), **objetivo**
(llega al elemento) y **burbuja** (sube de vuelta hasta `document`). Un oyente normal actúa en la
burbuja; con `true` (o `{ capture: true }`) actúa en la captura. Si el oyente está en el propio
elemento que recibe el evento, actúa en el objetivo.

#### Todos los oyentes

Hay **18 llamadas a `addEventListener`** en `js/` (más un evento que se lanza, `aviso`). Todos se
registran una sola vez al iniciar la página.

| N.º | Evento | Dónde se registra | Fase | Para qué |
|-----|--------|-------------------|------|----------|
| 1 | `aviso` | `js/avisos.js` (`escucharAvisos`), en `document` | Burbuja (u objetivo si se lanza sobre `document`, como el aviso pendiente) | Recoger el aviso que sube desde cualquier elemento y pintarlo en la región de avisos |
| 2 | `click` | `js/avisos.js` (`escucharAvisos`), en la región `#avisos` | Burbuja (delegación) | El botón «Cerrar» de cualquier aviso, también los creados después (`closest('.aviso__cerrar')`) |
| 3 | `click` | `js/controlesPaginacion.js` (`escucharControles`), en la lista de controles | Burbuja (delegación) | Los botones de página del listado y de la administración (`closest('[data-pagina]')`) |
| 4 | `submit` | `js/paginas/entrar.js`, en `#form-entrar` | Objetivo | Iniciar sesión (`preventDefault`) |
| 5 | `change` | `js/paginas/ficha.js`, en `#form-ficha` | Burbuja (delegación) | Mostrar u ocultar los datos del espacio cuando cambia el botón de la categoría |
| 6 | `click` | `js/paginas/ficha.js`, en `#ficha-imagenes` | Burbuja (delegación) | «Añadir imagen» y «Quitar» de cada imagen (`closest('[data-accion]')`) |
| 7 | `submit` | `js/paginas/ficha.js`, en `#form-ficha` | Objetivo | Validar y guardar la captura (`preventDefault`) |
| 8 | `input` | `js/paginas/listado.js`, en el campo de búsqueda | Objetivo | Filtrar las capturas, con una pausa (`retardar`, _debounce_) de 300 ms |
| 9 | `click` | `js/paginas/listado.js`, en la lista de capturas | Burbuja (delegación) | «Borrar»: guarda la captura pendiente y abre el diálogo (`closest`) |
| 10 | `close` | `js/paginas/listado.js`, en `#dialogo-borrar` | Objetivo (`close` no sube) | Borrar solo si `returnValue === 'borrar'`; con «Cancelar» o Escape no hace nada |
| 11 | `click` | `js/paginas/privada.js`, en `#cerrar-sesion` | Objetivo | Cerrar la sesión y volver a `index.html` |
| 12 | `input` | `js/paginas/registro.js`, en el campo de la contraseña | Objetivo | Marcar los requisitos que cumple la contraseña mientras se escribe |
| 13 | `submit` | `js/paginas/registro.js`, en `#form-registro` | Objetivo | Crear la cuenta (`preventDefault`) |
| 14 | `input` | `js/paginas/usuarios.js`, en el campo de búsqueda | Objetivo | Filtrar los usuarios, con la misma pausa |
| 15 | `click` | `js/paginas/usuarios.js`, en la lista de usuarios | Burbuja (delegación) | «Hacer/Quitar administrador» (`closest('[data-accion="cambiar-rol"]')`) |
| 16 | `blur` | `js/validacion.js`, en cada formulario | **Captura** (`true`) | La primera validación de un campo al salir de él |
| 17 | `input` | `js/validacion.js`, en cada formulario | Burbuja (delegación) | Revalidar mientras se escribe un campo que ya se ha tocado, y sus dependientes |
| 18 | `change` | `js/validacion.js`, en cada formulario | Burbuja (delegación) | Lo mismo para los cambios que no son escribir (opciones, fecha) |

Los números 16, 17 y 18 están escritos una sola vez en `js/validacion.js`, pero `activarValidacion`
se llama desde `entrar.js`, `registro.js` y `ficha.js`: en el navegador se registran una vez por
formulario (nunca dos en la misma página, salvo que se llamara dos veces a la función).

**El evento que se dispara:** `aviso` se lanza con `lanzarAviso` (`js/avisos.js`, `dispatchEvent` de
un `CustomEvent` con `bubbles: true`) desde `validacion.js` (al enviar con errores), `entrar.js`,
`registro.js`, `ficha.js`, `listado.js` y `usuarios.js`, y también con `mostrarAvisoPendiente`
(`js/avisos.js`), que muestra el aviso guardado por la página anterior y se llama desde `entrar.js`,
`registro.js` y `privada.js`. Los primeros se lanzan sobre un elemento (el formulario o el título) y
suben hasta `document`, donde los recoge el oyente número 1 en la burbuja. El aviso pendiente se
lanza **sobre `document`**, así que el mismo oyente lo recibe en la fase de objetivo.

**Lo que no tiene oyente gracias al HTML:** el envío con Intro (solo `submit`), pulsar una etiqueta
(`label for`), los botones del diálogo (`method="dialog"`), «Editar» y «Nueva captura» (enlaces) y
los límites de los botones (`disabled`).

#### Delegación

Un oyente en el contenedor atiende a todos sus hijos, incluso los que se crean después, porque el
clic sube hasta él. `evento.target.closest(selector)` busca desde lo que se pulsó (puede ser el
texto o un icono dentro del botón) hacia arriba hasta el botón que interesa. Se usa en:

- **Listado:** «Borrar» (número 9).
- **Paginación:** los botones se vuelven a crear en cada cambio (número 3).
- **Administración:** los botones de rol (número 15).
- **Grupo dinámico de imágenes:** «Quitar» de imágenes que no existían al cargar (número 6).
- **Avisos:** «Cerrar» de cada aviso nuevo (número 2).
- **Formularios:** `input` y `change` en el formulario en vez de uno por campo (números 5, 17 y 18).

Lo que gano: un oyente en vez de uno por elemento, no tengo que quitarlos ni volverlos a poner al
repintar la lista, y los elementos nuevos funcionan sin hacer nada más.

#### Mi uso de la captura

`js/validacion.js` escucha `blur` en el formulario con `true`. El motivo: **`blur` no sube** (no hay
fase de burbuja), así que un oyente normal en el formulario nunca lo recibiría. Sí **baja** (la fase de
captura lo recorre), y por eso con `true` el formulario lo ve antes de llegar al campo. Así tengo un
único oyente para todos los campos, incluidos los que se crean después, en vez de uno por campo.

Alternativas que descarté: poner un `blur` en cada campo (muchos oyentes y los campos dinámicos
quedarían fuera) o usar `focusout`, que sí sube y valdría sin captura. Elegí `blur` con captura
porque es el ejemplo que propone el enunciado y deja ver las fases: `blur` solo baja, así que hay
que escuchar en la captura; `focusout` sube y habría sido igual de válido.

#### `stopPropagation`

**No lo uso en ningún sitio.** Ningún oyente necesita que el evento deje de subir, y cortarlo
rompería la delegación (por ejemplo, el `aviso` tiene que llegar a `document`).

## Pruebas y cobertura

<!-- 1. Tabla de la pirámide: tipo (unitario, de integración o de extremo a extremo), fichero,
        qué prueba y cuántos tests tiene. Por qué cada cosa se prueba en ese nivel y no en otro.
     2. Cómo simulas al usuario (eventos, requestSubmit), los servicios (AlmacenFalso, el resumen
        de la contraseña, la navegación) y el tiempo (temporizadores falsos).
     3. Cómo se ejecutan las mismas pruebas de extremo a extremo con serve y contra la web
        desplegada (BASE_URL).
     4. Pega la salida de `npm run coverage` (con el resumen de la cobertura) y de `npm run e2e`.
        Explica qué umbral has puesto, a qué ficheros y qué queda sin probar y por qué. -->

## Integración continua

### ESLint y Prettier

**ESLint** revisa el código JavaScript y avisa de errores y malas costumbres antes de ejecutarlo.
**Prettier** se encarga solo del formato (sangría, comillas, saltos de línea), para que todo el
código tenga el mismo aspecto.

La plantilla ya traía tres reglas (`no-var`, `prefer-const` y `eqeqeq`). He añadido cuatro más en
`eslint.config.js`, cada una relacionada con algo que pide la rúbrica:

| Regla | Qué comprueba | Por qué la quiero |
|-------|---------------|-------------------|
| `no-console` | Que no quede ningún `console.log` (ni `console.error`…) en el código. | Los `console.log` son para depurar y se olvidan; en Horizonte los mensajes a la persona van por el sistema de avisos. Solo se permite en `scripts/`, porque `npm run build` escribe en la terminal. |
| `curly` | Que `if`, `else`, `for` y `while` lleven siempre llaves `{ }`, aunque tengan una sola instrucción. | Sin llaves, añadir una segunda línea «dentro» del `if` la deja fuera sin darte cuenta. Con llaves, el bloque siempre está claro. |
| `no-implicit-coercion` | Que las conversiones de tipo sean explícitas: `Number(x)` y no `+x`, `Boolean(x)` y no `!!x`, `String(x)` y no `'' + x`. | La rúbrica pide «conversiones explícitas»: así se lee qué tipo se quiere obtener, sin trucos. |
| `camelcase` | Que los nombres de variables y funciones estén en *camelCase* (`nombreUsuario`, no `nombre_usuario`). Las constantes en MAYÚSCULAS (`CLAVE_USUARIOS`) se aceptan. | Un solo estilo de nombres en todo el proyecto. No se aplica a las propiedades de los objetos (`properties: 'never'`), que a veces vienen de fuera. |

Para comprobar que las cuatro funcionan, las probé con un archivo con un error de cada tipo:
ESLint encontró los cuatro. Al activarlas también encontraron dos problemas reales en el proyecto:
un `if` sin llaves en el test de ejemplo (corregido) y los `console.log` de `scripts/construir.js`
(que no se puede modificar y que sí debe escribir en la terminal; por eso `no-console` no se aplica
a `scripts/`).

Salida de `npm run lint` (sin errores, no muestra nada después de la orden):

```text
> mi-aplicacion@1.0.0 lint
> eslint .
```

Salida de `npm run format:check`:

```text
> mi-aplicacion@1.0.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
```

### El workflow

`.github/workflows/ci.yml` es el *workflow* de integración continua: GitHub Actions lo ejecuta en sus
servidores **con cada `push` y con cada *pull request* a `main`**. Así cada cambio se comprueba solo,
antes de fusionarlo, sin depender de que me acuerde de pasar las pruebas. Solo pide permiso para
**leer** el código (`permissions: contents: read`).

Cada trabajo empieza en una máquina limpia (`ubuntu-latest`): descarga el código, instala Node.js 24
(con la caché de npm, para que sea más rápido) e instala las dependencias con `npm ci`, que usa las
versiones exactas de `package-lock.json`.

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | Descargar el código, Node.js 24, `npm ci`, `npm run lint` y `npm run format:check` | — |
| `Tests` | `Calidad` | Descargar el código, Node.js 24, `npm ci` y `npm test` | — (sprint 2: informe de cobertura) |
| `E2E` | `Tests` | Sprint 2 | Sprint 2: informe de Playwright si falla |

**Por qué en ese orden:** `Calidad` es lo más rápido y lo que más a menudo falla (un `if` sin llaves,
un archivo sin formatear). `Tests` espera a `Calidad` con `needs`: si el código ni siquiera pasa
ESLint, no tiene sentido gastar minutos en los tests. En el sprint 2, `E2E` esperará a `Tests` por la
misma razón, porque instalar el navegador es lo más lento.

<!-- Sprint 2: los artefactos (cobertura e informe de Playwright), concurrency y la insignia. -->

**Ejecución en verde con sus artefactos:** <!-- enlace -->

## Despliegue continuo

<!-- Sprint 3. 1. Cómo has configurado Vercel: build, carpeta de salida, protección de los
        despliegues y Deployment Checks (qué comprobaciones exige y por qué).
     2. Qué hacen despliegue.yml y release.yml, y qué comprueba tu prueba de humo.
     3. El camino de un cambio, con tus palabras: desde tu git push en una rama hasta que se ve en
        la web, qué se comprueba en cada paso y qué pasa si algo falla. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

| Evidencia | Enlace | Captura |
|-----------|--------|---------|
| *Pull request* con su vista previa y `E2E desplegado` | <!-- enlace a la pull request --> | `img/pr-comprobaciones.png` |
| Versión retenida por Vercel | <!-- enlace a la ejecución en rojo --> | `img/vercel-retenido.png` |
| Release `v1.0` | <!-- enlace a la Release --> | — |

<!-- Qué rompiste a propósito para la versión retenida, qué viste en Vercel y cómo comprobaste que la
     web seguía con la versión anterior. -->

## Organización del trabajo

### Definición de Hecho

Una tarjeta del tablero solo pasa a «Hecho» cuando cumple **todas** estas condiciones. Cada una se puede comprobar:

- [ ] **Hace lo que dice su tarjeta:** cada punto de la descripción de la tarjeta está hecho y las tarjetas de las que depende ya están en «Hecho».
- [ ] **Rama y pull request:** el trabajo está en su propia rama, ha llegado a `main` por *pull request* y la rama no se ha borrado.
- [ ] **Calidad:** `npm run lint` y `npm run format:check` terminan sin errores.
- [ ] **Tests:** `npm test` pasa. Si la tarea añade lógica (validadores, módulos de datos, `paginar`…), incluye sus tests en `tests/unitarios/` o `tests/integracion/`.
- [ ] **Workflow en verde:** desde que existe `ci.yml`, todos los trabajos de la *pull request* (`Calidad`, `Tests` y, después, `E2E`) salen en verde antes de fusionar.
- [ ] **Reglas del proyecto:** no hay librerías (solo el CSS de Bootstrap), ni APIs remotas, ni `innerHTML` con datos, ni estilos en el JavaScript. Se comprueba buscando `innerHTML` y `style` en `js/`.
- [ ] **Probada a mano:** si la tarea cambia lo que se ve o se hace en la web, se ha probado en el navegador, en una ventana privada para empezar con el almacenamiento vacío.
- [ ] **Documentada:** si la tarea cambia el comportamiento o la estructura, el README (y el JSDoc, desde el sprint 3) está al día. Los *commits* son pequeños y con mensajes que dicen qué cambia.

- [ ] **Doble testeo:** después de los tests, una segunda pasada repasa cada punto de la tarjeta
  frente a los tests y mira la cobertura del módulo (`npx vitest run --coverage`): no quedan líneas
  sin probar, o lo que queda está justificado.

*Cambios en la Definición de Hecho:*

- **Cierre del sprint 1 (12/11/2026):** añadida la condición «Doble testeo». La aplicaba desde la
  mitad del sprint y encontró fallos reales que la primera pasada no vio (una contraseña repetida
  vacía que se daba por buena, `npm run docs` roto). Si la uso siempre, tiene que estar en la lista.
  La condición del *workflow* en verde ya se cumple de verdad desde la *pull request* 18.

### Sprints

<!-- Una fila por sprint. La reflexión: qué salió bien, qué no, qué cambias para el siguiente
     (cuatro o cinco líneas, sobre tu trabajo y no sobre el enunciado). -->

| Sprint | *Tag* | Qué incluye | Reflexión |
|--------|-------|-------------|-----------|
| 1 | `v0.1` | Las cinco páginas con su diseño; usuarios, sesión y roles; registro e inicio de sesión; cabecera común y protección de páginas; avisos; ESLint con cuatro reglas propias; 191 tests (unitarios y de integración); `ci.yml` con `Calidad` y `Tests` | **Bien:** módulos pequeños, cada uno con sus tests desde el principio (100 % de cobertura), y probar en el navegador además de con tests, que encontró fallos que los tests no veían. **Mal:** empecé tarde (las primeras tarjetas de código se pasaron de fecha), deseché el primer diseño entero y dos tarjetas de documentación se quedaron olvidadas hasta el cierre. **Cambio para el sprint 2:** repasar el tablero completo al empezar cada día, ir por orden de fecha y hacer la documentación de cada parte junto a su código, no al final. |
| 2 | `v0.2` | Validadores de la captura, `paginar`, CRUD (ficha y listado), administración, validación en tiempo real, tests de integración y e2e, cobertura y `ci.yml` completo | *(al cerrar el sprint)* |
| 3 | `v1.0` | Vercel, Deployment Checks, `despliegue.yml`, prueba de humo, `release.yml`, evidencias, JSDoc y entrega | *(al cerrar el sprint)* |

**Tablero de Trello:** [Horizonte](https://trello.com/b/e5RiblPh/horizonte)

**Blog del proyecto:** [blog/README.md](blog/README.md) <!-- dificultades y problemas conceptuales de cada sprint -->

### Ramas y versiones

| Rama | Funcionalidad | *Pull request* |
|------|---------------|----------------|
| `definicion-de-hecho` | Definición de Hecho en el README | [#3](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/3) |
| `readme-mi-proyecto` | Sección «Mi proyecto» del README | [#4](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/4) |
| `gitignore-y-merge` | `.gitignore` y elección entre *merge* y *rebase* | [#5](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/5) |
| `gitattributes-lf` | `.gitattributes` para los finales de línea LF | [#6](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/6) |
| `paginas-html` | Las cinco páginas y el diseño (`css/estilos.css`) | [#7](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/7) |
| `almacenamiento` | Módulo de lectura segura del almacenamiento (`js/almacen.js`) | [#8](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/8) |
| `validadores-registro` | Validadores del registro (`js/validadores.js`) | [#9](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/9) |
| `modulo-usuarios` | Módulo de usuarios (`js/usuarios.js`) | [#10](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/10) |
| `memoria-ia` | Memoria del proyecto para la IA (`AGENTS.md` y `CLAUDE.md`) | [#11](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/11) |
| `modulo-sesion` | Módulo de sesión (`js/sesion.js`) | [#12](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/12) |
| `sistema-avisos` | Sistema de avisos (`js/avisos.js`) | [#13](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/13) |
| `reglas-eslint` | Reglas de ESLint y su explicación | [#14](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/14) |
| `pagina-registro` | Página de registro conectada a sus módulos | [#15](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/15) |
| `pagina-entrar` | Página de inicio de sesión y utilidades comunes de formularios | [#16](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/16) |
| `cabecera-comun` | Cabecera común y protección de las páginas privadas | [#17](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/17) |
| `ci-paso-1` | Integración continua, paso 1 (`ci.yml`) | [#18](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/18) |
| `blog-sprint-1` | Entrada del sprint 1 en el blog | [#19](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/19) |
| `readme-como-ejecutarlo` | Sección «Cómo ejecutarlo» del README y tipos JSDoc para `npm run docs` | [#20](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/20) |
| `readme-almacenamiento` | Sección «Almacenamiento y sesión» del README | [#21](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/21) |
| `cierre-sprint-1` | Cierre del sprint 1: reflexión y repaso de la Definición de Hecho | [#22](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/22) |
| `quitar-pendiente-devtools` | Quita del README el pendiente de las DevTools, que no pide el enunciado | [#23](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/23) |
| `validadores-captura` | Validadores de la captura, el objeto `validadores` para `data-validar` y sus tests | [#24](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/24) |
| `paginar` | Función pura `paginar` y sus tests | [#25](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/25) |
| `modulo-capturas` | Módulo de capturas (una clave por usuario, `id` único, lecturas seguras) y sus tests | [#26](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/26) |
| `validacion-tiempo-real` | Componente común de validación en tiempo real, usado en el registro y el inicio de sesión | [#27](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/27) |
| `ficha-campos` | Ficha: los campos de la captura, el campo condicional del espacio y el `max` de la fecha | [#28](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/28) |
| `ficha-guardar` | Ficha: grupo dinámico de imágenes, guardar con `FormData` y editar con `?id=…` | [#29](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/29) |
| `listado-elementos` | Listado: un elemento por captura desde un `<template>`, «Editar» y «Borrar» con `<dialog>` | [#30](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/30) |
| `subagentes-ia` | Equipo de subagentes de IA en `.claude/agents/` y su flujo en `AGENTS.md` | [#31](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/31) |
| `listado-buscador-paginacion` | Listado: buscador con pausa (sin tildes ni mayúsculas), paginación de 6 en 6 con `?pagina=` y controles reutilizables (`js/buscar.js`, `js/controlesPaginacion.js`) | [#32](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/32) |
| `zona-administracion` | Administración (`usuarios.html`): lista, buscador y paginación de usuarios, dar o quitar el rol de administrador (`cambiarRol`) y `js/direccion.js` común con el listado | [#33](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/33) |
| `tests-integracion` | Tests de integración (happy-dom) de la ficha, el listado y la protección por rol, auditados frente al enunciado | [#34](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/34) |
| `readme-eventos` | Sección «Eventos» del README: eventos en el HTML, tipos de eventos y tabla de todos los oyentes | [#35](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-dgonmor428/pull/35) |

#### *Merge* o *rebase*

Integro con ***merge***: cada *pull request* se fusiona con el botón «Merge» de GitHub, que crea un *commit* de fusión (por ejemplo, `c75761a` para la pull request 3).

- **No reescribe historia.** *Rebase* cambia los *commits* de mi rama (les da otro identificador) para ponerlos en línea recta sobre `main`. Mis ramas ya están subidas y enlazadas desde su *pull request*, y no quiero cambiar *commits* que ya están publicados.
- **Se ve la historia del trabajo.** Con `git log --graph` se ve que cada funcionalidad nació en su rama y se unió a `main` en un punto concreto, que es lo que pide el enunciado (una rama por funcionalidad, sin borrarlas).
- **Es la opción más segura trabajando solo y con ramas cortas.** Si hay un conflicto, se resuelve una sola vez en el *commit* de fusión, no *commit* por *commit*.
- **Lo que pierdo:** el historial de `main` no es una línea recta y tiene *commits* de fusión extra. Lo acepto a cambio de lo anterior.

#### Qué deja fuera el `.gitignore`

| Entrada | Por qué no se sube |
|---------|--------------------|
| `node_modules/` | Son las dependencias: las instala `npm install` desde `package.json` y `package-lock.json`. Pesan mucho y se recrean en cualquier equipo |
| `dist/` | La web preparada para publicar la genera `npm run build`; Vercel la construye por su cuenta |
| `coverage/` | El informe de cobertura lo genera `npm run coverage`; el *workflow* lo sube como artefacto |
| `docs/` | La documentación JSDoc la genera `npm run docs` |
| `playwright-report/` y `test-results/` | Los genera cada ejecución de los tests e2e |
| `*.log` | Registros de errores de npm y de las herramientas |
| `.DS_Store` y `Thumbs.db` | Ficheros que crea el sistema operativo |
| `.env` y `.env.*` | Por si algún día hubiera claves: el repositorio es público |
| `.claude/settings.local.json` | Los permisos que Claude Code guarda en cada equipo: son de quien trabaja, no del proyecto |
| `blog/BORRADOR.md` | El borrador del blog que escribe el subagente documentador: el blog de verdad lo escribe el alumno |

`package-lock.json` **sí** se sube: sin él, `npm ci` falla en el *workflow*.

**Versión de entrega:** `v1.0`
