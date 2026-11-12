# AGENTS.md · Memoria del proyecto Horizonte

Este archivo es la memoria del proyecto para cualquier asistente de IA (Claude, Codex, Copilot,
Cursor, Gemini…) o persona que trabaje en él. Recoge el contexto, las reglas, la forma de trabajar,
las libertades y las decisiones ya tomadas, para que todo el que llegue siga las mismas normas.

**Se actualiza en cada commit** si cambia alguna norma, alguna decisión o el estado del proyecto.

## 1. El proyecto

- **Horizonte** es un diario de fotografía y observación de paisajes, del cielo y del espacio. Cada
  usuario guarda sus capturas (lugar, coordenadas, altitud, condiciones del cielo, equipo, hasta tres
  imágenes y, si es del espacio, el código de catálogo y las coordenadas celestes). Un administrador
  gestiona los usuarios.
- Es el **Proyecto DOM** del módulo DWEC (2.º DAW, curso 2026/27): una aplicación web de gestión con
  integración y despliegue continuos, en tres sprints con los tags `v0.1`, `v0.2` y `v1.0` (la que se
  corrige).
- Quien desarrolla es un alumno que tiene que **entender y explicar todo el código** en una exposición.

## 2. Fuentes de verdad, por orden

1. **`ENUNCIADO.md`** (el enunciado del profesor). Manda sobre todo lo demás: si algo de aquí lo
   contradice, gana el enunciado. Se sigue al pie de la letra.
2. **`README.md`**, sección «Mi proyecto»: la entidad, sus campos, validaciones y mensajes.
3. **El tablero de Trello** del proyecto (enlazado en el README): tareas, dependencias y fechas.
4. Este archivo.

## 3. Reglas del enunciado que no se pueden saltar

- JavaScript **sin librerías**. Bootstrap solo como **CSS**, enlazado desde `node_modules/`; nunca su
  JavaScript. Sin APIs remotas ni librerías de mapas.
- Páginas en la raíz: `index.html` (inicio de sesión), `registro.html`, `listado.html`, `ficha.html`
  y `usuarios.html`.
- Usuarios y capturas en `localStorage`; la sesión en `sessionStorage`. Contraseñas **solo** como
  resumen calculado con `resumirClave` de `js/clave.js`.
- Nada de `innerHTML` con datos ni estilos escritos desde el JavaScript. Elementos desde `<template>`
  rellenados con `textContent`.
- Los módulos de datos reciben el almacenamiento como parámetro (para probarlos con
  `tests/AlmacenFalso.js`); las páginas reciben lo que necesitan (almacenamiento, resumen de la
  contraseña, navegación) en lugar de usar `localStorage` o `location` directamente.
- **No se modifican:** `.devcontainer/`, `playwright.config.js`, `serve.json`, `jsdoc.json`,
  `js/clave.js`, `scripts/construir.js`, `tests/AlmacenFalso.js`, `tests/pagina.js`, ni lo que hacen
  los scripts de `package.json`.
- El repositorio y la web publicada son **públicos**: ningún dato real ni personal de nadie.

## 4. Forma de trabajar

- **Una tarjeta de Trello cada vez.** Al empezarla, a «Haciendo»; al terminarla, a «Hecho». Una
  tarjeta solo está «Hecha» cuando cumple la Definición de Hecho del README (sobre todo: ha llegado a
  `main` por pull request).
- **«Haz la siguiente tarjeta»** significa seguir el orden del tablero sin preguntar antes de empezar.
- **Cada tarjeta en su rama**, commits pequeños con mensajes claros, `push` y **pull request** hacia
  `main`. Nunca se empuja directamente a `main`.
- Las PRs se fusionan con **merge commit** (no squash ni rebase) y **las ramas no se borran**. A veces
  fusiona el alumno para ver la PR y a veces pide que lo haga la IA.
- Cada rama nueva se añade a la tabla «Ramas y versiones» del README, con su PR.
- **Doble testeo** en todas las tarjetas: después de los tests, una segunda pasada que repasa cada
  punto de la tarjeta frente a los tests y mira la cobertura del módulo (`vitest --coverage`) para
  encontrar lo que falte por probar, y lo añade.
- Antes de cada PR: `npm run format:check`, `npm run lint` y `npm test` sin errores.
- ESLint tiene, además de `no-var`, `prefer-const` y `eqeqeq`: `no-console` (salvo en `scripts/`),
  `curly`, `no-implicit-coercion` y `camelcase`. El código nuevo tiene que cumplirlas.
- Al terminar cada tarea, un resumen breve: **qué se ha hecho, para qué sirve ahora y para qué
  servirá en el futuro**.
- Todo se explica en **español**, paso a paso y con el porqué.
- Ante cualquier problema (entorno, permisos, algo raro), **parar y comentarlo** en lugar de
  improvisar.
- En cada commit, revisar si hay que actualizar este archivo.

## 5. Entorno

- Se trabaja en el **Dev Container** (`node:24-bookworm` con Chromium). La web se sirve en
  <http://localhost:3901>.
- En Windows, los comandos de npm se ejecutan dentro del contenedor (por ejemplo, con la imagen del
  Dev Container y la carpeta montada en `/workspace`).
- `.gitattributes` fuerza los finales de línea LF; sin él, `format:check` falla en Windows.

## 6. Libertades

- **El diseño visual es libre** y lo propone la IA: ahora es un cielo nocturno (estrellas, aurora,
  cordilleras, paneles de cristal) hecho solo con CSS y SVG, en `css/estilos.css`. El alumno puede
  cambiarlo cuando quiera.
- Los textos de la interfaz, los mensajes y los ejemplos se pueden proponer, siempre sin datos reales
  de personas.

## 7. Decisiones tomadas

- **Merge** frente a rebase (justificado en el README).
- **Requisito 13** (validador con regla de control): el campo «código de observatorio» con formato
  `OBS-NNNN-D`, cuyo último dígito es la suma de las cuatro cifras multiplicadas por 3, 1, 3 y 1,
  módulo 10 (`OBS-4821-7`). Los rangos de las coordenadas GPS se comprueban además, como extra.
- Los **validadores** devuelven el mensaje de error o `''` si el valor es válido (listo para
  `setCustomValidity`).
- Los **nombres de usuario no distinguen mayúsculas** («Ana» = «ana»).
- Los usuarios se guardan en `localStorage` con la clave `horizonte.usuarios`. La función de resumen
  de la contraseña se recibe como parámetro (por defecto `resumirClave`) para poder sustituirla en los
  tests de integración.
- La **sesión** se guarda en `sessionStorage` con la clave `horizonte.sesion` y solo contiene el
  nombre y el rol (nunca el correo ni la contraseña). Si está estropeada, se lee como `null`.
- **Páginas:** cada página tiene su módulo en `js/paginas/` con una función `iniciarX({ documento,
  almacenUsuarios, almacenSesion, navegar, resumir })`. El HTML la llama desde un
  `<script type="module">` pasándole `document`, `localStorage`, `sessionStorage` y
  `(url) => location.assign(url)`; los tests de integración le pasan `AlmacenFalso` y `vi.fn()`.
- **Formularios:** al enviar se validan todos los campos; los errores van a su caja
  `#<pagina>-<campo>-error` (enlazada con `aria-describedby`), con `setCustomValidity`,
  `aria-invalid` y `is-invalid`; aviso de error y foco en el primero. Un campo con error se
  revalida al escribir. Sin doble envío: botón desactivado y `aria-busy` mientras se envía.
  Lo común está en `js/formularios.js` (`mostrarEstadoCampo` y `ponerEnviando`): las páginas nuevas
  lo reutilizan en lugar de repetirlo. En las páginas con un formulario principal, la región de
  avisos va dentro de su panel, encima del título, para que el aviso se vea donde se está escribiendo.
- **Inicio de sesión:** si hay sesión, va al listado. Con datos incorrectos, un único mensaje
  («El usuario o la contraseña no son correctos.») que no dice cuál falla; vacía la contraseña y le
  da el foco.
- **Páginas privadas** (`listado`, `ficha`, `usuarios`): las protege `iniciarPaginaPrivada` de
  `js/paginas/privada.js`, que recibe `reemplazar: (url) => location.replace(url)`. Sin sesión, a
  `index.html` con `replace` (el botón «Atrás» no vuelve); en `usuarios.html`
  (`soloAdministradores: true`), un usuario normal vuelve al listado con un aviso de error. Rellena la
  cabecera (nombre, rol, «Usuarios» solo para administradores) y gestiona «Cerrar sesión». Las demás
  partes de cada página privada se inician después, con la sesión que devuelve.
- **Avisos:** evento propio `aviso` (`CustomEvent`, `bubbles: true`, `detail: { mensaje, tipo }`) con
  un único oyente en `document`. Tipos: `exito`, `error`, `advertencia` e `info` (las clases de
  alerta de Bootstrap). El aviso para la página siguiente se guarda en `sessionStorage` con la clave
  `horizonte.aviso` y se borra al mostrarse.
- Las herramientas de diseño Impeccable, Taste Skill y Playwright MCP se probaron y se
  **desinstalaron a petición del alumno**: no se vuelven a instalar sin que lo pida.

## 8. Estado

- **Sprint 1** (6–15 de noviembre, tag `v0.1`). Hechos: entorno, tablero, README «Mi proyecto»,
  Definición de Hecho, `.gitignore`, `.gitattributes`, las cinco páginas con su diseño, esta memoria
  (`AGENTS.md` y `CLAUDE.md`), `js/almacen.js`, `js/validadores.js`, `js/usuarios.js`,
  `js/sesion.js`, `js/avisos.js` y `js/formularios.js` (con sus tests al 100 % de cobertura), las
  reglas de ESLint, las páginas de registro e inicio de sesión y la cabecera común con la protección
  de las páginas privadas (`js/paginas/`, con tests de integración): el ciclo de sesión completo
  (registrarse, entrar, ver la cabecera, cerrar sesión) funciona.
- **Siguiente:** el workflow de integración continua (`ci.yml`); después, la entrada del blog, la
  reflexión del sprint en el README y el tag `v0.1` (cierre del sprint 1, 15 de noviembre).
- **Pendiente del alumno:** en el README («ESLint y Prettier»), contar con sus palabras un problema
  real que encuentre con el depurador de las DevTools. No se inventa.
