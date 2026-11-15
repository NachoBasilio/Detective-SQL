---
name: ui-ux
description: >
  Criterios de UI/UX para el frontend de Detective SQL (HTML, CSS y
  JavaScript). Combina las prioridades y el checklist de UI UX Pro Max
  (https://uupm.cc/) con el enfoque de Impeccable (https://impeccable.style/):
  contexto de diseño antes de construir, modo de cada pantalla, vocabulario de
  pedidos, piso de calidad y anti-patrones de interfaces genéricas. Usar al
  diseñar, crear, criticar o pulir pantallas, componentes, estilos o
  interacciones dentro de frontend/.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.1.0"
  scope:
    - root
  auto_invoke:
    - "diseñar pantalla"
    - "crear componente"
    - "estilos CSS"
    - "revisar UI"
    - "criticar diseño"
    - "pulir UI"
    - "UX"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: medium
  allowed_tools:
    - read
    - glob
    - apply_patch
---

# ui-ux

## Cuándo usar

- Crear o modificar archivos en `frontend/` (`index.html`, `css/`, `js/`).
- Diseñar una de las cuatro pantallas del juego: expediente, investigación, acusación o resultado.
- Criticar, auditar o pulir la usabilidad, la accesibilidad o la consistencia visual de la interfaz.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: fija los criterios de diseño que eligió el equipo. No caduca con mejoras del modelo; cambia solo si el equipo cambia sus criterios. Toma dos fuentes:

- **UI UX Pro Max:** qué revisar primero (prioridades) y el checklist de entrega.
- **Impeccable:** cómo pensar el diseño (contexto, modos, vocabulario) y qué evitar para que la interfaz no parezca generada en serie.

Ninguna de las dos herramientas está instalada: el repositorio no incluye el buscador de UI UX Pro Max ni el CLI y el detector de Impeccable. Acá se usan sus criterios, no sus herramientas.

## Cuándo NO usar

- Rutas, controladores o acceso a la base: usar `Skills/express-api/SKILL.md`.
- Esquema, consultas o reglas del juego: usar `Skills/sqlite-schema/SKILL.md`.

## Contexto antes de diseñar

- Leer la consigna del juego en `README.md` y el sistema visual en `docs/design.md`.
- `docs/design.md` registra tokens de color, tipografías, escala de espaciado y la firma visual del juego. Si no existe, proponer su contenido al equipo antes de construir la primera pantalla; nunca inventar el sistema visual en silencio dentro del CSS.
- **El brief gana:** si el equipo fijó paleta, tipografía o estilo, se respeta aunque contradiga la preferencia del agente.
- **Refinar conserva; rediseñar reemplaza:** un ajuste mantiene identidad, textos y comportamiento; un rediseño se acuerda con el equipo y actualiza `docs/design.md`. No mezclar ambos.

## Modo de cada pantalla

El modo define qué significa que el jugador tenga éxito en esa pantalla.

| Pantalla | Modo | Qué prioriza |
|---|---|---|
| Expediente del caso | Lectura | Comprensión: jerarquía clara, largo de línea cómodo, la historia antes que los adornos. |
| Investigación | Operación | Completar la tarea: escaneo rápido, controles estándar, densidad y consistencia. |
| Acusación | Operación | Acción irreversible: foco protegido, confirmación explícita, sin distracciones. |
| Resultado | Experiencia | El momento del juego: acá cabe la única animación protagonista. |

En las pantallas de operación, la temática detective aporta solo cuatro cosas: tipografía, paleta, densidad y **una** firma visual. Nunca define la navegación ni los controles: nada de disfrazar botones, tablas o formularios de papeles viejos, máquinas de escribir o tableros de corcho.

## Vocabulario de pedidos

Palabras precisas para pedirle trabajo de diseño a un agente, en lugar de "que quede más lindo". Los nombres vienen de Impeccable.

| Pedido | Qué hace el agente |
|---|---|
| `shape` | Planificar la UX/UI de una pantalla antes de escribir código. |
| `critique` | Revisión de UX: jerarquía, claridad y modo de la pantalla, con hallazgos priorizados. |
| `audit` | Revisión técnica: accesibilidad, rendimiento y responsive. |
| `polish` | Pasada final de calidad antes de entregar. |
| `distill` | Quitar complejidad hasta dejar lo esencial. |
| `clarify` | Mejorar textos, etiquetas y mensajes de error. |
| `harden` | Cubrir casos borde: errores de la API, estados vacíos, textos largos. |
| `typeset` | Mejorar la jerarquía tipográfica, los tamaños y el largo de línea. |
| `layout` | Corregir espaciado, ritmo y jerarquía visual. |
| `colorize` | Sumar color con intención a una interfaz apagada. |
| `animate` | Agregar movimiento con propósito. |
| `adapt` | Ajustar a distintos tamaños de pantalla. |
| `quieter` / `bolder` | Bajar o subir la intensidad visual. |

Un pedido de refinamiento no cambia nada fuera de su alcance.

## Prioridades

Ante un conflicto, gana la categoría de mayor prioridad.

| Prioridad | Categoría | Impacto |
|---|---|---|
| 1 | Accesibilidad | Crítico |
| 2 | Interacción | Crítico |
| 3 | Rendimiento | Alto |
| 4 | Estilo visual | Alto |
| 5 | Layout responsive | Alto |
| 6 | Navegación | Alto |
| 7 | Tipografía y color | Medio |
| 8 | Animación | Medio |
| 9 | Formularios y feedback | Medio |
| 10 | Gráficos y datos | Bajo |

## Reglas críticas

- **Culpable oculto también en la UI:** ningún texto, atributo `data-*`, clase CSS, orden ni estilo delata al culpable antes del arresto. El frontend solo muestra lo que la API ya devolvió.
- **Las reglas del juego no se duplican en JavaScript:** la interfaz muestra el error que devuelve la API en un mensaje claro; no valida por su cuenta lo que impone la base.
- **Contraste mínimo 4.5:1** para texto normal y 3:1 para texto grande e íconos, en todos los estados.
- **Teclado completo:** todo lo que se hace con el mouse se puede hacer con el teclado; nunca quitar el foco visible (`outline`) sin reemplazarlo.
- **Íconos en SVG, nunca emoji ni caracteres Unicode,** con trazo y grosor consistentes. Los botones que solo tienen ícono llevan `aria-label`.
- **Nunca deshabilitar el zoom** (`user-scalable=no` o `maximum-scale=1` están prohibidos).
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Piso de calidad

Se verifica sobre el resultado renderizado en el navegador, a 320, 768 y 1280 px, no como intención. Agrupar las verificaciones en una misma revisión.

- **Accesibilidad:** HTML semántico (`header`, `main`, `nav`, `section`, `button`); `alt` descriptivo, o `alt=""` si la imagen es decorativa; un solo `h1` por pantalla y títulos sin saltos de nivel; la información nunca depende solo del color.
- **Contraste sobre color:** en fondos de color, el texto secundario se tiñe del tono del fondo; nunca gris sobre color.
- **Interacción:** áreas táctiles de 44×44 px con 8 px de separación; nada depende solo del `hover`; indicador de carga y botón deshabilitado mientras se espera a la API; confirmación explícita antes de la acusación.
- **Estados:** todo componente contempla `hover`, `focus-visible`, `active`, `disabled`, carga, error y vacío, probados con contenido real.
- **Tipografía:** base de 16 px como mínimo, interlineado cercano a 1.5, líneas de 65 a 75 caracteres (`max-width: 70ch`), como máximo dos familias y escalas de tamaño y peso evidentes.
- **Espaciado:** grupos compactos, separación generosa entre grupos y más espacio arriba de un título que debajo.
- **Color:** tokens semánticos en `:root` (`--color-primary`, `--color-text`, `--color-danger`), sin hexadecimales sueltos en los componentes. Modo claro u oscuro elegido según cómo y dónde se juega, no por costumbre.
- **Profundidad:** las sombras tienen desplazamiento y desenfoque suave; un halo de color sin desplazamiento es decoración.
- **Movimiento:** un único momento protagonista, como el veredicto, en lugar de la misma entrada en cada sección. Microinteracciones de 150 a 300 ms con *ease-out*; animar `transform` y `opacity` (o `filter` y `clip-path` si se mantienen fluidos), nunca `width`, `height` ni `top`; respetar `prefers-reduced-motion: reduce`.
- **Superficies del navegador:** tematizar con la paleta la selección (`::selection`), el cursor de texto (`caret-color`), las barras de desplazamiento, los anillos de foco y `text-underline-offset`; números tabulares (`font-variant-numeric: tabular-nums`) en datos.
- **Rendimiento:** imágenes en WebP o SVG con `width` y `height` declarados; `loading="lazy"` fuera de la primera pantalla; no medir el layout dentro de un bucle que lo modifica.
- **Responsive:** mobile-first con `min-width`; `<meta name="viewport" content="width=device-width, initial-scale=1">` en todo HTML; sin scroll horizontal a 320 px; contenedores con `max-width`, no anchos fijos.
- **Navegación:** el jugador sabe en qué pantalla está y cómo volver; el botón "atrás" del navegador no rompe el estado del caso.
- **Textos:** el lenguaje del juego. Cada botón nombra su acción ("Emitir orden de arresto", no "Aceptar"); cada error dice qué pasó y cómo seguir; toda entrada tiene `<label>` visible y el `placeholder` no la reemplaza.
- **Datos:** tablas con `<th>` y `scope` para evidencias y coartadas; si hay gráficos, leyenda y diferencias que no dependan solo del color.

## Anti-patrones

Son los atajos por defecto de las interfaces generadas en serie. Si aparece uno sin que el diseño lo haya pedido, se reescribe el elemento; no alcanza con suavizarlo.

**Prohibidos siempre:**

- Etiqueta o *eyebrow* encima de un título: el título se sostiene solo.
- Tarjetas dentro de tarjetas.
- Emoji o caracteres Unicode en lugar de íconos.
- Texto gris sobre fondos de color.

**Evitar salvo que `docs/design.md` lo pida:**

- Estructura de tarjetas iguales con ícono, título y texto como esqueleto de la pantalla.
- Plantilla de número grande, etiqueta chica y estadísticas de apoyo.
- Numeración de secciones (01 / 02 / 03) cuando el orden no le aporta nada al jugador.
- Modales para tareas que no necesitan interrumpir.
- Texto con degradé y degradés violeta-azul.
- Vidrio y desenfoque (*glassmorphism*) como decoración.
- Bordes de color de más de 1 px a la izquierda o a la derecha de tarjetas, listas o alertas.
- Sombras duras sin desenfoque (`box-shadow: 4px 4px 0`).
- Tipografía monoespaciada como disfraz "técnico" fuera del código SQL o de los datos.
- Inter o la fuente del sistema para todo, incluidos los títulos.
- Un ícono dentro de un cuadrado redondeado arriba de cada título.
- Puntos que laten, animaciones de "pensando" y chips de estado por todas partes.
- Textos genéricos ("Empezar", "Saber más") y títulos vagos.

## Checklist previo a la entrega

- [ ] Ningún dato de la interfaz permite deducir al culpable antes del arresto.
- [ ] La pantalla respeta su modo y `docs/design.md`.
- [ ] Contraste verificado (4.5:1 en texto normal, 3:1 en texto grande).
- [ ] Recorrido completo de las pantallas usando solo el teclado, con foco visible.
- [ ] Estados `hover`, `focus-visible`, `active`, `disabled`, carga, error y vacío.
- [ ] Sin scroll horizontal a 320, 768 y 1280 px.
- [ ] Indicador de carga y prevención de doble envío en las llamadas a la API.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Selección, foco y barras de desplazamiento tematizados.
- [ ] Ningún anti-patrón sin justificación en `docs/design.md`.
- [ ] Errores de la API mostrados con un mensaje claro.

## Comandos

```bash
npm run validate:skills
# Pendientes de definir hasta que exista el frontend:
# npm start   # levanta la API y sirve el frontend para probarlo en el navegador
```

## Recursos

- UI UX Pro Max: https://uupm.cc/ (repositorio: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
- Impeccable: https://impeccable.style/ (repositorio: https://github.com/pbakaus/impeccable, licencia Apache 2.0).
- Pautas de contraste WCAG 2.2: https://www.w3.org/TR/WCAG22/#contrast-minimum
