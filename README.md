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
| Fecha y hora | `datetime-local` | Sí | No puede ser futura (el `max` lo pone el código con la fecha de hoy) | «La fecha no puede ser futura.» |
| Lugar | Texto | Sí | No puede quedar vacío | «Escribe el lugar.» |
| Coordenadas GPS | Texto | Sí | Regex del formato `36.7213, -4.4214` **y** comprobación con código de los rangos (latitud entre −90 y 90, longitud entre −180 y 180) | «Usa el formato 36.7213, -4.4214.» / «La latitud va de −90 a 90 y la longitud de −180 a 180.» |
| Altitud (m) | Número | Sí | Entre −430 y 8849 | «La altitud va de −430 a 8849 m.» |
| Condiciones del cielo | Lista desplegable: despejado, nubes, niebla, tormenta, aurora… | Sí | Hay que elegir una | «Elige las condiciones del cielo.» |
| Equipo | Lista desplegable: móvil, cámara, prismáticos, telescopio | Sí | Hay que elegir uno | «Elige el equipo.» |
| Código de observatorio | Texto | No | Si se rellena: regex `OBS-NNNN-D` **y** comprobación con código de que el último dígito (D) es el dígito de control: la suma de las cuatro cifras multiplicadas por 3, 1, 3 y 1, módulo 10 (`OBS-4821-7`: 4·3 + 8·1 + 2·3 + 1·1 = 27 → 7) | «Usa el formato OBS-4821-7.» / «El dígito de control no es correcto.» |
| **Campo condicional** (solo si la categoría es «Espacio»; con `hidden` y `disabled` en otro caso) | | | | |
| Código de catálogo | Texto | Sí, si se ve | Regex: `M42`, `NGC 1976`, `IC 434` | «Usa un código como M42, NGC 1976 o IC 434.» |
| Ascensión recta | Texto | Sí, si se ve | Regex del formato `05h 35m 17s` | «Usa el formato 05h 35m 17s.» |
| Declinación | Texto | Sí, si se ve | Regex del formato `-05° 23′ 28″` | «Usa el formato -05° 23′ 28″.» |
| **Grupo dinámico: imágenes** (de 0 a 3, desde un `<template>`) | | | | |
| URL de la imagen | Texto | Sí, en cada imagen añadida | Regex de URL `http://` o `https://` (se guarda la URL, no el fichero, porque `localStorage` solo admite unos 5 MB) | «Escribe una URL que empiece por http:// o https://.» |
| Pie de foto | Texto | No | — | — |

### El registro de usuarios

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| Nombre de usuario | Texto | Regex: de 3 a 20 caracteres entre letras, cifras y `_`; y no puede estar ocupado | «Usa de 3 a 20 letras, cifras o _.» / «Ese nombre ya está en uso.» |
| Correo | Correo (`type="email"`) | Regex de correo | «Escribe un correo válido.» |
| Contraseña | Contraseña | Mínimo 8 caracteres, con una minúscula (`\p{Ll}`), una mayúscula (`\p{Lu}`) y una cifra. Se ve cuáles cumple mientras se escribe | «La contraseña no cumple todos los requisitos.» |
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

En el sprint 2 se añadirán las capturas de cada usuario, en `localStorage` y en una clave propia de
ese usuario.

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

<!-- Qué consigues con el HTML sin escribir oyentes (envío con Intro, novalidate y los atributos de
     validación, dialog, label for…) y por qué no usas atributos on…. -->

### Tipos de eventos

<!-- Tabla con los eventos que usas y por qué has elegido cada uno frente a otros parecidos
     (submit frente a click, input frente a change, blur frente a focusout…). -->

### Propagación

<!-- 1. Tabla con TODOS tus oyentes: evento, dónde lo registras, en qué fase actúa
        (captura, objetivo o burbuja) y para qué.
     2. Dónde usas la delegación y qué ganas con ella.
     3. Tu uso de la captura y por qué no servía la burbuja.
     4. Si usas stopPropagation, por qué. -->

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

<!-- Pendiente: un problema real que encuentre con el depurador de las DevTools y cómo lo resolví.
     Se escribirá cuando ocurra, con mis palabras (las páginas aún no tienen JavaScript). -->

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

`package-lock.json` **sí** se sube: sin él, `npm ci` falla en el *workflow*.

**Versión de entrega:** `v1.0`
