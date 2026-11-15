# Sistema visual de Detective SQL

Fuente de los tokens del frontend. Se implementan como propiedades personalizadas en `:root` de [`frontend/css/estilos.css`](../frontend/css/estilos.css); los componentes no usan colores ni medidas sueltas. Criterios generales: [`Skills/ui-ux/SKILL.md`](../Skills/ui-ux/SKILL.md).

## Dirección

- **Tema: expediente criminal impreso.** La consigna pide "estética de terminal policial o expediente criminal". El tema aporta solo tipografía, paleta, densidad y una firma visual; la navegación, los botones, las pestañas, las tablas y los formularios son controles estándar.
- **Modo claro.** El juego se usa en notebooks y se presenta proyectado en el aula. Tinta oscura sobre papel claro se lee mejor en un proyector y en lecturas largas (expediente, declaraciones) que el fondo oscuro de una terminal.
- **Firma visual: el sello.** El estado de la partida (`en_curso`, `ganada`, `perdida`, tal como lo devuelve la API) se muestra como un sello de goma: borde doble, mayúsculas espaciadas y una leve rotación. Es chico en la cabecera y grande en el veredicto, donde ocurre la única animación protagonista (`sellar`: 360 ms, *ease-out*, solo `transform` y `opacity`, desactivada con `prefers-reduced-motion`).

## Color

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--color-fondo` | `#ece4d4` | Fondo de página (carpeta) | — |
| `--color-hoja` | `#fbf8f2` | Hoja donde se apoya el contenido | — |
| `--color-hoja-alterna` | `#f3eee4` | Encabezados de tabla, *hover* | — |
| `--color-texto` | `#1c1a17` | Texto principal | 16.4:1 sobre hoja |
| `--color-texto-suave` | `#595148` | Rótulos y datos secundarios | 7.3:1 sobre hoja, 6.2:1 sobre fondo |
| `--color-borde` | `#d9cfbd` | Reglas decorativas | — |
| `--color-borde-control` | `#7c7062` | Bordes de controles | 4.5:1 sobre hoja |
| `--color-primario` | `#1f3b63` | Botón principal, enlaces, selección | 10.6:1 sobre hoja; blanco encima 11.3:1 |
| `--color-peligro` | `#9b2a1f` | Orden de arresto, sello "perdida" | 7.2:1 sobre hoja; blanco encima 7.6:1 |
| `--color-exito` | `#2c5a2e` | Sello "ganada", vínculo "exculpa" | 7.6:1 sobre hoja |
| `--color-foco` | `#b4500f` | Anillo de foco | 4.8:1 sobre hoja, 4.1:1 sobre fondo |
| `--color-error-fondo` / `--color-error-texto` | `#f8e6e1` / `#7a1f16` | Mensajes de error | 8.6:1 |
| `--color-aviso-fondo` / `--color-aviso-texto` | `#e8eef6` / `#1f3b63` | Avisos y opción elegida | 9.7:1 |
| `--color-seleccion` | `#f0d98a` | `::selection` | 12.4:1 con texto |

En fondos de color el texto se tiñe del tono del fondo; nunca gris sobre color. El tipo de vínculo de una evidencia (incrimina, exculpa, presencia) se escribe siempre como texto: el color solo lo refuerza.

## Tipografía

Dos familias, ambas del sistema (sin CDN, el juego funciona sin conexión):

- `--fuente-texto`: Charter, Bitstream Charter, Sitka Text, Cambria, Iowan Old Style, Georgia, serif. Títulos, lectura y controles.
- `--fuente-datos`: ui-monospace, Cascadia Mono, SF Mono, Menlo, Consolas, Liberation Mono, monospace. Solo datos: fechas, horas, números de tablas, identificadores y el sello de estado.

Escala: 0.875 / 1.0625 (base, 17 px) / 1.3125 / 1.75 rem y títulos con `clamp(1.75rem, …, 2.5rem)`. Interlineado 1.55; texto de lectura con `max-width: 70ch`; números con `tabular-nums`.

## Espaciado y forma

Escala de 4 px: `--espacio-1` 0.25 rem, `-2` 0.5, `-3` 0.75, `-4` 1, `-5` 1.5, `-6` 2, `-7` 3 rem. Más espacio arriba de un título (`-7`) que debajo (`-3`). Radio único de 4 px. Una sola sombra suave (`--sombra-hoja`) para la hoja; adentro, las secciones se separan con reglas de 1 px, sin tarjetas anidadas. Áreas táctiles de 44 px como mínimo con 8 px o más de separación.

## Pantallas

| Pantalla | Modo | Decisión |
|---|---|---|
| Expediente | Lectura | Título del caso como `h1`, descripción a 70ch, ficha de hechos, inicio de partida y sospechosos en lista con reglas. |
| Investigación | Operación | Cuatro pestañas estándar (escenas, interrogatorios, coartadas, matriz) con tablas densas desplazables dentro de su contenedor. |
| Acusación | Operación | Opciones de radio, paso de confirmación explícito en línea (sin modal) y botón deshabilitado mientras se envía. |
| Resultado | Experiencia | Veredicto con el sello grande animado y la ficha del resultado. |

La navegación es una lista ordenada porque sigue el flujo del juego; no se muestran números de paso. Las pantallas que necesitan una partida aparecen deshabilitadas hasta iniciarla.

## Excepciones justificadas

- Los rótulos de las fichas y los encabezados de tabla van en mayúsculas chicas: son nombres de campo, no *eyebrows* sobre un título.
- La fuente monoespaciada se limita a datos y al sello (que muestra un dato de la API), nunca a títulos ni textos de interfaz.
