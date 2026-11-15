---
name: ui-ux
description: >
  Criterios de UI/UX para el frontend de Detective SQL (HTML, CSS y
  JavaScript), adaptados de UI UX Pro Max (https://uupm.cc/): prioridades de
  accesibilidad, interacción, layout responsive, tipografía, color y animación,
  más un checklist previo a la entrega. Usar al diseñar, crear o revisar
  pantallas, componentes, estilos o interacciones dentro de frontend/.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "diseñar pantalla"
    - "crear componente"
    - "estilos CSS"
    - "revisar UI"
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
- Revisar la usabilidad, la accesibilidad o la consistencia visual de la interfaz.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: fija los criterios de diseño que el equipo eligió para la interfaz, tomando como base las prioridades y el checklist de UI UX Pro Max. No caduca con mejoras del modelo; cambia solo si el equipo cambia sus criterios.

UI UX Pro Max incluye una base de datos y un buscador propio; este repositorio **no** los instala. Acá se usan sus reglas, no su herramienta.

## Cuándo NO usar

- Rutas, controladores o acceso a la base: usar `Skills/express-api/SKILL.md`.
- Esquema, consultas o reglas del juego: usar `Skills/sqlite-schema/SKILL.md`.

## Flujo de trabajo

1. **Analizar el pedido:** qué pantalla o componente, qué datos muestra y qué acción espera del jugador.
2. **Respetar el sistema visual:** reutilizar los tokens existentes (colores, tipografía, espaciado). Si todavía no existen, definirlos primero como variables CSS en `:root` y acordarlos con el equipo.
3. **Construir:** HTML semántico, luego CSS mobile-first, luego JavaScript.
4. **Verificar:** recorrer el checklist previo a la entrega antes de abrir el PR.

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
- **Íconos en SVG, nunca emoji.** Los botones que solo tienen ícono llevan `aria-label`.
- **Nunca deshabilitar el zoom** (`user-scalable=no` o `maximum-scale=1` están prohibidos).
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Reglas por categoría

### Accesibilidad

- HTML semántico: `header`, `main`, `nav`, `section`, `button` (no `div` con `onclick`).
- Toda imagen informativa tiene `alt` descriptivo; las decorativas, `alt=""`.
- Un solo `h1` por pantalla y jerarquía de títulos sin saltos.
- La información nunca depende solo del color (por ejemplo, sospechoso descartado: color más ícono o texto).

### Interacción

- Áreas táctiles de al menos 44×44 px y 8 px de separación entre ellas.
- Todo elemento interactivo tiene estado `:hover`, `:focus-visible`, `:active` y `:disabled`.
- Nada depende solo del `hover`: en pantallas táctiles no existe.
- Mientras se espera a la API: indicador de carga y botón deshabilitado para evitar dobles envíos (por ejemplo, la orden de arresto).
- Las acciones irreversibles, como la acusación, piden confirmación explícita.

### Rendimiento

- Imágenes en WebP o SVG, con `width` y `height` declarados para evitar saltos de layout.
- `loading="lazy"` en imágenes fuera de la primera pantalla.
- Leer y escribir el DOM en bloques separados; no medir el layout dentro de un bucle que lo modifica.

### Estilo visual

- Un único estilo visual coherente con la temática detective, aplicado en las cuatro pantallas.
- Colores, radios, sombras y espaciados salen de variables CSS; nada de valores sueltos repetidos en los componentes.

### Layout responsive

- Mobile-first: estilos base para pantallas chicas y `min-width` en los media queries.
- `<meta name="viewport" content="width=device-width, initial-scale=1">` en todo HTML.
- Sin scroll horizontal a 320 px de ancho; contenedores con `max-width`, no anchos fijos en píxeles.

### Navegación

- El jugador siempre sabe en qué pantalla está y cómo volver a la anterior.
- El botón "atrás" del navegador no rompe el estado del caso.

### Tipografía y color

- Texto base de 16 px como mínimo e interlineado cercano a 1.5.
- Como máximo dos familias tipográficas.
- Tokens semánticos (`--color-primary`, `--color-text`, `--color-danger`) en lugar de hexadecimales en cada componente.

### Animación

- Duraciones de 150 a 300 ms para microinteracciones.
- Animar solo `transform` y `opacity`, nunca `width`, `height` ni `top`.
- Respetar `prefers-reduced-motion: reduce`.
- La animación comunica algo (carga, cambio de estado, resultado); no se usa como decoración.

### Formularios y feedback

- Toda entrada tiene `<label>` visible; el `placeholder` no reemplaza a la etiqueta.
- Los errores aparecen junto al campo, explican qué pasó y cómo corregirlo.
- Toda acción confirma su resultado: éxito, error o estado vacío.

### Gráficos y datos

- Tablas con `<th>` y `scope` para listar evidencias o coartadas.
- Si hay gráficos: leyenda, etiquetas legibles y diferencias que no dependan solo del color.

## Checklist previo a la entrega

- [ ] Ningún dato de la interfaz permite deducir al culpable antes del arresto.
- [ ] Contraste verificado (4.5:1 en texto normal).
- [ ] Recorrido completo de las pantallas usando solo el teclado, con foco visible.
- [ ] Íconos en SVG y botones de solo ícono con `aria-label`.
- [ ] Estados `hover`, `focus-visible`, `active` y `disabled` en todo elemento interactivo.
- [ ] Sin scroll horizontal a 320 px, 768 px y 1280 px.
- [ ] Indicador de carga y prevención de doble envío en las llamadas a la API.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Errores de la API mostrados con un mensaje claro.

## Comandos

```bash
npm run validate:skills
# Pendientes de definir hasta que exista el frontend:
# npm start   # levanta la API y sirve el frontend para probarlo en el navegador
```

## Recursos

- UI UX Pro Max: https://uupm.cc/ (repositorio: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).
- Pautas de contraste WCAG 2.2: https://www.w3.org/TR/WCAG22/#contrast-minimum
