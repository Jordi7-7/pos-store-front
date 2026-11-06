# Guía de interfaz

Una sola app, un solo estilo. Pensada para **ratón y teclado** en monitores de 1366×768 o más. Antes de crear una pantalla o un componente, usa lo de aquí; si algo falta, se añade aquí y no se inventa en la pantalla.

## Tipografía
- **Familia:** Geist (texto) y Geist Mono (cifras, SKU, códigos), autoalojadas (`index.css`); no hay fuentes de servicios externos.
- **Escala** (no uses tamaños sueltos como `text-[10px]`):

| Uso | Clase | Tamaño |
|---|---|---|
| Título de página | `text-xl font-semibold` (lo pone `PageHeader`) | 20 px |
| Título de tarjeta o sección | `text-base font-semibold` | 16 px |
| Texto normal | `text-sm` | 14 px |
| Tablas y filas densas | `text-[13px]` | 13 px |
| Etiquetas, ayudas, cabeceras de tabla | `text-xs` | 12 px |
| Importe destacado (total a cobrar) | `text-2xl`/`text-3xl font-bold font-mono` | 24–30 px |

- **Mayúsculas:** solo en las cabeceras de tabla y en los títulos de sección del menú lateral. Títulos, etiquetas de formulario, botones y avisos van en minúsculas con la primera mayúscula (no uses `uppercase` ni `tracking-wider`).
- **Redondeos:** un solo radio base (`--radius` = 8 px); botones y campos `rounded-lg`, tarjetas y diálogos `rounded-xl`. No uses `rounded-2xl` en controles.

## Estructura de una pantalla
1. `PageHeader` (`shared/presentation/components`): título, descripción de una línea y, a la derecha, las acciones de la pantalla (exportar, importar, actualizar). Se pone en la ruta (`src/routes/_layout/...`) o al inicio de la vista.
2. Debajo, tarjetas (`Card`). **Una tarjeta no repite el título de la página**: arriba lleva su barra de herramientas (contador, `SearchInput`, filtros y el botón principal a la derecha).
3. El contenedor del layout ya da el ancho máximo (1440 px), el margen y la separación entre bloques; el POS ocupa todo el alto.

## Componentes base (shadcn, ajustados en `components/ui/`)
- **Botón:** alto 36 px (`h-9`), texto 14 px; `size="sm"` 32 px para acciones de fila. Principal = negro; secundario = `variant="outline"`; destructivo = `variant="destructive"`. Iconos sin tamaño (`<Plus />`): el botón los ajusta.
- **Campo:** alto 36 px, fondo de tarjeta, 14 px. Búsqueda: siempre `SearchInput`.
- **Tabla:** cabecera en mayúsculas de 12 px sobre fondo suave, filas de 13 px con `hover`, bordes del color de tarjeta. No sobreescribas el tamaño de letra de las celdas.
- **Tarjeta:** borde fino y sombra ligera, radio mayor; relleno interno de 20 px.
- **Etiqueta (`Badge`):** pastilla de 24 px.

## Diálogos y formularios
Título `text-base font-semibold`; etiquetas de campo en `text-[13px] font-medium`; acción principal en negro (`bg-primary`), secundaria `outline`, y rojo solo para acciones destructivas (eliminar, anular). No se colorea el botón principal según el tipo de diálogo.

## Responsive
Escritorio (≥1024 px): menú abierto. Tablet (<1024 px): menú recogido en iconos. Móvil (<768 px): el menú es un panel lateral y las tarjetas, barras de herramientas y filas se apilan (`flex-wrap`). Toda barra de herramientas debe poder envolverse; las tablas anchas se desplazan dentro de su tarjeta.

## Menú lateral
Secciones con nombre (`NAV_SECTIONS` en `config/navigation.config.ts`): sin sección (Dashboard), **Ventas**, **Inventario**, **Análisis** y **Administración**. Un grupo se despliega solo cuando estás en una de sus páginas. Filas de 32 px; la marca (logo y nombre de la tienda) arriba y la persona con el botón de salir abajo. Los nombres cortos y en minúscula (`Historial de turnos`, `Crear con variantes`) son los mismos en el menú, la miga de pan de la cabecera y el título de la página.

## Teclado en el POS
F5 buscar producto · F7 monto recibido · F8 cobro exacto · F12 completar venta. Están a la vista bajo el buscador y dentro de cada botón; si añades un atajo, añádelo a `KeyboardHints` y a `usePOSHotkeys`.
