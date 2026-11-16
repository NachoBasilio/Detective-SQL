# Sistema visual de Detective SQL

Fuente de los tokens del frontend. Se implementan como propiedades personalizadas en `:root` de [`frontend/css/estilos.css`](../frontend/css/estilos.css); los componentes no usan colores ni medidas sueltas. Criterios generales: [`Skills/ui-ux/SKILL.md`](../Skills/ui-ux/SKILL.md).

## Dirección

- **Tema: expediente criminal impreso.** La consigna pide "estética de terminal policial o expediente criminal". El tema aporta solo tipografía, paleta, densidad y una firma visual; la navegación, los botones, las pestañas, las tablas y los formularios son controles estándar.
- **Tema claro predeterminado, oscuro opcional.** El juego se usa en notebooks y se presenta proyectado en el aula. Tinta oscura sobre papel claro se lee mejor en un proyector y en lecturas largas (expediente, declaraciones) que el fondo oscuro de una terminal; por eso el juego siempre empieza en claro y no sigue `prefers-color-scheme`. El tema oscuro es una preferencia del jugador para jugar de noche o en pantallas propias: se activa con el botón de la cabecera y se recuerda en el navegador. La única excepción es el favicon (ver la marca, abajo).
- **Firma visual: el sello.** El estado de la partida (`en_curso`, `ganada`, `perdida`, tal como lo devuelve la API) se muestra como un sello de goma: borde doble, mayúsculas espaciadas y una leve rotación. Es chico en la cabecera y grande en el veredicto, donde ocurre la única animación protagonista (`sellar`: `--duracion-sello`, *ease-out*, solo `transform` y `opacity`, desactivada con `prefers-reduced-motion`).
- **Marca: el detective.** Un ícono SVG propio (sombrero de ala, mentón y cuello de gabardina levantado, con el mismo trazo de 2 px y `currentColor` que el resto de los íconos) acompaña el nombre del juego en la cabecera y es el favicon. Reemplaza a la lupa: identifica el juego sin competir con el sello.
  - **Excepción del favicon:** [`frontend/favicon.svg`](../frontend/favicon.svg) usa `@media (prefers-color-scheme: dark)` y dos colores fijos, porque la pestaña del navegador sigue el tema del sistema operativo, no el de la página, y un archivo de favicon no puede leer los tokens. Los dos colores son una copia de `--color-primario` del tema claro (`#1f3b63`) y del oscuro (`#9fbde6`): si cambia ese token, hay que actualizar el favicon en el mismo cambio.

## Color

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--color-fondo` | `#ece4d4` | Fondo de página (carpeta) | — |
| `--color-hoja` | `#fbf8f2` | Hoja donde se apoya el contenido y el diálogo | — |
| `--color-hoja-alterna` | `#f3eee4` | Encabezados de tabla, *hover* | — |
| `--color-texto` | `#1c1a17` | Texto principal | 16.4:1 sobre hoja |
| `--color-texto-suave` | `#595148` | Rótulos y datos secundarios | 7.3:1 sobre hoja, 6.2:1 sobre fondo, 6.7:1 sobre hoja alterna |
| `--color-borde` | `#d9cfbd` | Reglas decorativas | — |
| `--color-borde-control` | `#7c7062` | Bordes de controles | 4.5:1 sobre hoja |
| `--color-primario` | `#1f3b63` | Botón principal, enlaces, selección, preferencia activa | 10.6:1 sobre hoja; blanco encima 11.3:1 |
| `--color-primario-hover` | `#152a48` | *Hover* del botón principal | blanco encima 14.4:1 |
| `--color-sobre-primario` | `#ffffff` | Texto sobre botones de color | — |
| `--color-peligro` | `#9b2a1f` | Orden de arresto, sello "perdida", borde del diálogo | 7.2:1 sobre hoja; blanco encima 7.6:1 |
| `--color-peligro-hover` | `#7d2018` | *Hover* del botón de peligro | blanco encima 10.0:1 |
| `--color-exito` | `#2c5a2e` | Sello "ganada", vínculo "exculpa" | 7.6:1 sobre hoja |
| `--color-foco` | `#b4500f` | Anillo de foco | 4.8:1 sobre hoja, 4.1:1 sobre fondo |
| `--color-error-fondo` / `--color-error-texto` | `#f8e6e1` / `#7a1f16` | Mensajes de error | 8.6:1 |
| `--color-aviso-fondo` / `--color-aviso-texto` | `#e8eef6` / `#1f3b63` | Avisos y opción elegida | 9.7:1 |
| `--color-seleccion` | `#f0d98a` | `::selection` | 12.4:1 con texto |
| `--color-velo` | `rgb(28 26 23 / 0.55)` | Fondo detrás del diálogo (`::backdrop`) | — |

En fondos de color el texto se tiñe del tono del fondo; nunca gris sobre color. El tipo de vínculo de una evidencia (incrimina, exculpa, presencia) se escribe siempre como texto: el color solo lo refuerza.

### Tema oscuro

Se define en `:root[data-tema="oscuro"]` con los mismos nombres de token: los componentes no cambian, solo los valores. Mismas familias de color que el tema claro (papel, tinta, azul marino, rojo, verde) con la luminosidad invertida: papel oscuro y tinta clara. `color-scheme: dark` tematiza los controles nativos y las barras de desplazamiento; `<meta name="color-scheme">` cambia junto con el tema. Las sombras (`--sombra-hoja`, `--sombra-dialogo`) se oscurecen para seguir marcando la profundidad.

| Token | Valor | Contraste |
|---|---|---|
| `--color-fondo` | `#141210` | — |
| `--color-hoja` | `#1f1c18` | — |
| `--color-hoja-alterna` | `#2a2621` | — |
| `--color-texto` | `#ede6d8` | 13.7:1 sobre hoja, 15.0:1 sobre fondo |
| `--color-texto-suave` | `#b8ad9c` | 7.7:1 sobre hoja, 8.4:1 sobre fondo, 6.8:1 sobre hoja alterna |
| `--color-borde` | `#3b352d` | — (decorativo) |
| `--color-borde-control` | `#8e8273` | 4.5:1 sobre hoja |
| `--color-primario` | `#9fbde6` | 8.8:1 sobre hoja; `--color-sobre-primario` encima 9.5:1 |
| `--color-primario-hover` | `#bdd2ef` | `--color-sobre-primario` encima 11.9:1 |
| `--color-sobre-primario` | `#10151c` | — (tinta oscura sobre los botones claros) |
| `--color-peligro` | `#f2a194` | 8.3:1 sobre hoja; `--color-sobre-primario` encima 9.0:1 |
| `--color-peligro-hover` | `#f6bcb2` | `--color-sobre-primario` encima 11.1:1 |
| `--color-exito` | `#9fd09b` | 9.7:1 sobre hoja |
| `--color-foco` | `#f2a35a` | 8.2:1 sobre hoja, 9.0:1 sobre fondo |
| `--color-error-fondo` / `--color-error-texto` | `#3b1f1a` / `#f7c4bb` | 9.7:1 |
| `--color-aviso-fondo` / `--color-aviso-texto` | `#1b2636` / `#c5d7f0` | 10.4:1 |
| `--color-seleccion` | `#6a5a1f` | 5.5:1 con texto |
| `--color-velo` | `rgb(0 0 0 / 0.65)` | — |

[`tests/frontend/tema-oscuro.test.js`](../tests/frontend/tema-oscuro.test.js) calcula estos contrastes (y los del tema claro) con la fórmula de WCAG 2.2, comprueba que el tema oscuro redefina cada token de color y de sombra, y que ningún color aparezca fuera de los dos bloques `:root`.

## Tokens reutilizables

Los valores compartidos viven en `:root` de `frontend/css/estilos.css`. Antes de crear una medida o color nuevo, se reutiliza el token que representa la misma decisión visual. Los valores técnicos aislados, como el recorte de contenido solo para lectores de pantalla, no se convierten en tokens.

| Grupo | Tokens | Uso |
|---|---|---|
| Color | `--color-*` | Superficies, texto, estados, foco, selección y velo del diálogo. Los hexadecimales se declaran solo aquí y en el bloque del tema oscuro. |
| Tipografía | `--fuente-*`, `--texto-*`, `--interlineado` | Lectura, datos y jerarquía de títulos. |
| Espaciado | `--espacio-1` a `--espacio-7` | Separación y relleno de componentes. |
| Forma y controles | `--radio`, `--borde-ancho`, `--borde-ancho-activo`, `--borde-ancho-sello`, `--borde-ancho-sello-grande`, `--control-altura-minima` | Bordes, foco visual y áreas táctiles de navegación, botones, pestañas, selectores, opciones, preferencias y sellos. |
| Profundidad | `--sombra-hoja`, `--sombra-dialogo` | La hoja y el diálogo; cambian con el tema. |
| Anchos | `--ancho-hoja`, `--ancho-lectura`, `--ancho-tabla-estandar`, `--ancho-tabla-evidencias`, `--ancho-confirmacion` | Lectura, tablas desplazables y diálogo de confirmación de la acusación. |
| Movimiento | `--duracion`, `--duracion-pestana`, `--duracion-sello`, `--curva-salida`, `--curva-pestana` | Transiciones cortas, el deslizamiento entre pestañas y entre pantallas, y la animación única del veredicto. |

Los puntos de corte se mantienen literales en las reglas `@media`, porque las propiedades personalizadas no se pueden usar de forma interoperable en las condiciones de media queries.

## Tipografía

Dos familias, ambas del sistema (sin CDN, el juego funciona sin conexión):

- `--fuente-texto`: Charter, Bitstream Charter, Sitka Text, Cambria, Iowan Old Style, Georgia, serif. Títulos, lectura y controles.
- `--fuente-datos`: ui-monospace, Cascadia Mono, SF Mono, Menlo, Consolas, Liberation Mono, monospace. Solo datos: fechas, horas, números de tablas, identificadores y el sello de estado.

Escala: 0.875 / 1.0625 (base, 17 px) / 1.3125 / 1.75 rem y títulos con `clamp(1.75rem, …, 2.5rem)`. Interlineado 1.55; texto de lectura con `max-width: 70ch`; números con `tabular-nums`.

## Espaciado y forma

Escala de 4 px: `--espacio-1` 0.25 rem, `-2` 0.5, `-3` 0.75, `-4` 1, `-5` 1.5, `-6` 2, `-7` 3 rem. Más espacio arriba de un título (`-7`) que debajo (`-3`). Radio único de 4 px. Una sombra suave (`--sombra-hoja`) para la hoja y otra (`--sombra-dialogo`) para el diálogo; adentro, las secciones se separan con reglas `--borde-ancho`, sin tarjetas anidadas. Los controles usan `--control-altura-minima`, con un piso efectivo de 44 px y 8 px o más de separación.

## Movimiento

- **Protagonista:** el sello del veredicto (`sellar`). Si el veredicto se vuelve a dibujar (por ejemplo, al cambiar el idioma), el sello aparece quieto (`.sello--quieto`).
- **Microinteracción de las pestañas:** al cambiar de pestaña en la investigación, el panel que sale se desliza hacia un costado y el que entra llega desde el otro, según el orden de las pestañas (la siguiente entra por la derecha, la anterior por la izquierda). Dura `--duracion-pestana` (300 ms) con `--curva-pestana` (`ease-out`) y solo anima `transform` y `opacity`: el panel que entra no se desvanece y el que sale se apaga mientras se va. No usa `--curva-salida` porque esa curva recorre casi todo el trayecto en los primeros cuadros: sirve para un botón, pero en un panel de ancho completo el movimiento terminaba antes de que el contenido se viera. El panel nuevo entra al flujo enseguida y el que sale se superpone arriba, así la lista de pestañas no se mueve; en reposo, los paneles inactivos tienen `hidden`. Cambiar varias veces seguidas termina el movimiento anterior antes de empezar el siguiente.
- **Cambio de pantalla (decisión del Product Owner):** las cuatro pantallas principales (expediente, investigación, acusación y resultado) usan la misma microinteracción que las pestañas, con la misma duración y la misma curva. La skill `ui-ux` pide un único momento protagonista y considera un anti-patrón repetir la misma entrada en cada sección; el Product Owner probó el deslizamiento de las pestañas y pidió explícitamente extenderlo a las pantallas, para que el recorrido del juego se lea como un expediente que se hojea hacia adelante y hacia atrás. Se acepta como excepción porque es una transición de navegación corta (300 ms) y no una entrada decorativa; **el sello del veredicto sigue siendo la única animación protagonista.** La dirección sigue el orden del juego (expediente, investigación, acusación, resultado): avanzar trae la pantalla nueva desde la derecha y retroceder, desde la izquierda, también con los botones "atrás" y "adelante" del navegador. No se animan la carga inicial, el reemplazo por el expediente cuando la pantalla pedida no está disponible ni el cambio de idioma, y no hay gesto táctil entre pantallas. Las secciones se deslizan dentro de `.pantallas`: la pantalla nueva entra al flujo y la anterior se superpone mientras sale, así la cabecera y la navegación no se mueven. El foco pasa al `h1` de la pantalla nueva antes de que empiece el movimiento, para que la página no se desplace a mitad del deslizamiento.
- **Un solo mecanismo:** [`frontend/js/deslizamiento.js`](../frontend/js/deslizamiento.js) hace el deslizamiento de las pestañas (`js/pestanas.js`) y de las pantallas (`js/app.js`). El contenedor lleva la clase `.deslizable`; `.deslizable--en-movimiento` recorta el desborde y `.deslizable__superpuesto` ubica el elemento que sale, y las dos existen solo mientras dura el movimiento.
- **Gesto táctil:** en pantallas táctiles, arrastrar el panel en horizontal lo mueve con el dedo; al soltar, pasa a la pestaña vecina si se arrastró un 25 % del ancho o con un movimiento rápido, y si no, vuelve a su lugar. En la primera y la última pestaña el contenido resiste y vuelve (no hay vuelta completa). El área de los paneles usa `touch-action: pan-y pinch-zoom`: el desplazamiento vertical y el zoom siguen siendo del navegador. Los gestos que empiezan sobre una tabla desplazable o un control se ignoran, para conservar el desplazamiento horizontal de las tablas. Las pestañas siguen funcionando con clic y teclado.
- **Diálogo:** aparece con un fundido y una escala breves (`--duracion`).
- Con `prefers-reduced-motion: reduce`, la regla global desactiva las animaciones de CSS, y las pestañas y las pantallas cambian sin movimiento (en el gesto, sin seguir al dedo).

## Idioma

- La interfaz está en español (predeterminado) e inglés. El selector ES / EN de la cabecera usa dos botones con `aria-pressed`, y la elección se guarda en `localStorage` (`detective-sql:idioma`).
- Los textos viven en [`frontend/js/i18n/`](../frontend/js/i18n/): `catalogos.js` (interfaz, con las mismas claves en los dos idiomas y plurales con `Intl.PluralRules`), `contenido.js` (valores fijos de la base, textos de la semilla y mensajes de error de la API) y `traductor.js` (`t()`, traducción con respaldo al texto original y formato de fechas). Son módulos puros que se prueban desde Node.js. [`frontend/package.json`](../frontend/package.json) (`"type": "module"`) existe solo para que Node.js trate `frontend/js/**/*.js` como ES modules cuando `tests/frontend/i18n.test.js` los importa. Sin ese archivo, Node.js 22.0 a 22.6 (que `engines` admite) no puede importarlos y el test falla; las versiones posteriores los importan igual, pero con la advertencia `MODULE_TYPELESS_PACKAGE_JSON` y un segundo análisis de cada archivo.
- La base y la API siguen en español: el frontend traduce solo lo que muestra. Los nombres de personas no se traducen; los nombres descriptivos de lugares, sí. Un texto sin traducción se muestra en su idioma original.
- Las fechas usan el formato de cada idioma y el reloj de 24 horas en los dos, porque las pistas se comparan al minuto (21:29, 21:30).
- Cambiar el idioma vuelve a dibujar la pantalla actual sin perder la partida ni el resultado, y actualiza `<html lang>`, el título del documento y los `aria-label`.

## Pantallas

| Pantalla | Modo | Decisión |
|---|---|---|
| Expediente | Lectura | Título del caso como `h1`, descripción a 70ch, ficha de hechos, inicio de partida, partidas en curso para retomar y sospechosos en lista con reglas. |
| Investigación | Operación | Cuatro pestañas estándar (escenas, interrogatorios, coartadas, matriz) con tablas densas desplazables dentro de su contenedor; el cambio de pestaña se desliza y admite el gesto táctil. |
| Acusación | Operación | Opciones de radio y confirmación explícita en un diálogo modal, con el botón deshabilitado mientras se envía. |
| Resultado | Experiencia | Veredicto con el sello grande animado y la ficha del resultado. |

La navegación es una lista ordenada porque sigue el flujo del juego; no se muestran números de paso. Las pantallas que necesitan una partida aparecen deshabilitadas hasta iniciarla.

**Por qué la confirmación pasó a un diálogo modal.** Antes se confirmaba en línea, sin modal. La orden de arresto es la única acción irreversible del juego (un arresto por partida, impuesto por SQLite): justo el caso en que interrumpir está justificado. El diálogo aísla la decisión del resto de la pantalla (el fondo queda inerte), no se cierra con un clic afuera y, mientras se envía la orden, tampoco con Escape. Elegir otro sospechoso o Escape cierran el diálogo y devuelven el foco a la opción marcada.

**Partidas en curso.** El expediente lista las partidas del caso que siguen en curso (`GET /api/partidas?estado=en_curso&casoId=…`) con su número, su hora de inicio y el botón "Retomar"; la partida actual se marca con el texto "Partida actual", no solo con color. Las partidas terminadas no se listan: mostrar su resultado obligaría a la API a revelar el culpable por GET.

## Componentes reutilizables

### Botones

`.boton` establece tamaño táctil, espaciado y transición. Sus variantes son `.boton--primario`, `.boton--secundario` y `.boton--peligro`; comparten estados `hover`, `active`, `disabled` y `aria-busy`.

### Avisos

`.aviso`, `.alerta`, `.estado` y `.error-campo` comunican información, carga o error. El texto explica qué pasó y cómo seguir; el color nunca es la única señal.

### Fichas

`.ficha` presenta pares de etiqueta y valor en el expediente y el resultado. `.dato` se usa solo para números, fechas, horas e identificadores.

### Pestañas

`.pestanas` y `[role="tab"]` siguen el patrón ARIA de pestañas: clic, flechas izquierda y derecha (con vuelta), Inicio y Fin, y `tabindex` móvil. El estado seleccionado se expresa con `aria-selected`, no solo con color. `.paneles` (con `.deslizable`) agrupa los paneles para el deslizamiento y el gesto táctil (ver [Movimiento](#movimiento)).

### Tablas

`.tabla-contenedor` administra el desplazamiento horizontal y `.tabla` define la tabla base. `.tabla--evidencias` usa un ancho mínimo mayor para preservar la lectura de todas sus columnas.

### Sellos

`.sello` representa el estado de la partida y `.sello--grande` se reserva para el veredicto. Es la única animación protagonista y respeta `prefers-reduced-motion`. `.sello--quieto` muestra el mismo veredicto sin repetir la animación.

### Diálogo

`.dialogo` es un `<dialog>` nativo abierto con `showModal()`, con `aria-labelledby` hacia su título, que recibe el foco al abrirse. Usa la hoja como superficie, borde `--color-peligro`, `--sombra-dialogo`, ancho `--ancho-confirmacion` y `::backdrop` con `--color-velo`, en los dos temas. Se reserva para confirmar acciones irreversibles.

### Preferencias

`.preferencia` es el botón de la cabecera para el idioma (ES / EN) y el tema oscuro: 44 × 44 px como mínimo, 8 px de separación y `aria-pressed`. El estado activo se ve como botón relleno y se anuncia como presionado. El botón de tema solo tiene ícono SVG (luna), con `aria-label` y `title` en el idioma activo.

### Partidas en curso

`.lista-partidas` lista las partidas para retomar con reglas, igual que los sospechosos. `.partida__actual` marca la partida actual con texto y color primario.

## Excepciones justificadas

- Los rótulos de las fichas y los encabezados de tabla van en mayúsculas chicas: son nombres de campo, no *eyebrows* sobre un título.
- La fuente monoespaciada se limita a datos y al sello (que muestra un dato de la API), nunca a títulos ni textos de interfaz.
- El diálogo modal de la acusación: la skill pide evitar modales para tareas que no necesitan interrumpir; emitir la orden de arresto es irreversible y sí lo necesita.
