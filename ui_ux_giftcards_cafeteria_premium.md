# UI/UX Redesign Brief — Cafetería Premium Gift Card System

## 1. Objetivo

Rediseñar la interfaz del sistema de Gift Cards de **Cafetería Premium** para que se sienta como un producto propio, premium y operativo, no como un dashboard genérico.

La nueva UI debe mantener la identidad visual actual de la cafetería —tonos café, crema y dorado— pero mejorar:

- jerarquía visual;
- legibilidad;
- densidad de información;
- claridad de acciones;
- navegación;
- percepción de calidad;
- consistencia entre módulos;
- experiencia operativa en caja y administración;
- adaptación responsive.

El sistema debe transmitir tres ideas:

1. **Premium:** coherente con una cafetería de gama alta.
2. **Ágil:** las operaciones frecuentes deben requerir pocos clics.
3. **Confiable:** saldo, consumos, emisión y auditoría deben sentirse seguros y claros.

---

# 2. Contexto actual

La pantalla actual ya tiene una base visual coherente:

- Header oscuro en tono espresso.
- Fondo crema.
- Acentos dorados.
- Cards blancas.
- Tipografía serif en títulos.
- Tipografía sans-serif para navegación y datos.
- Verde para métricas positivas.
- Rojo para cierre de sesión.

Sin embargo, actualmente se perciben algunos problemas:

- El header concentra demasiados elementos en una sola línea.
- Los KPI tienen demasiado espacio vacío y poca información contextual.
- El CTA principal compite con otras acciones.
- La sección “Rendimiento reciente” ocupa mucho espacio para mostrar muy poca información.
- “Acciones rápidas” funciona, pero visualmente parece una lista genérica.
- No existe una jerarquía suficientemente clara entre acciones operativas y datos gerenciales.
- Hay varios contenedores de gran tamaño que no aprovechan bien la pantalla.
- El dashboard se siente más como una colección de cards que como un centro de control.
- Falta feedback visual sobre tendencias, actividad reciente y estado operativo.
- El icono decorativo junto a “Panel Gerencial” no aporta información y rompe la composición.
- Las métricas actuales no permiten entender rápidamente si el día va mejor o peor que el anterior.

---

# 3. Dirección visual

## Personalidad de marca

Evitar estética SaaS genérica.

La interfaz debe sentirse como un producto diseñado específicamente para una cafetería premium.

Referencias conceptuales:

- café de especialidad;
- madera oscura;
- papel crema;
- metal dorado;
- tarjetas físicas premium;
- recibos y POS modernos;
- hospitality / retail premium.

No utilizar:

- exceso de gradients;
- colores neón;
- sombras fuertes;
- glassmorphism exagerado;
- cards flotando sin propósito;
- dashboards financieros genéricos.

---

# 4. Sistema visual recomendado

## Colores

Mantener la paleta existente, pero normalizarla mediante tokens.

```css
--color-bg: #FAF7F2;
--color-surface: #FFFFFF;
--color-surface-soft: #F5EFE8;

--color-espresso-950: #241307;
--color-espresso-900: #321A09;
--color-espresso-800: #4A280F;
--color-espresso-700: #603916;

--color-gold-600: #C99716;
--color-gold-500: #E2B420;
--color-gold-400: #F0C84A;
--color-gold-soft: #FFF5D6;

--color-success-600: #138A45;
--color-success-100: #DCF8E8;

--color-danger-600: #C62828;
--color-danger-100: #FDE7E7;

--color-warning-600: #AA6F00;
--color-warning-100: #FFF0C7;

--color-text-primary: #28170D;
--color-text-secondary: #725D50;
--color-border: #E9DFD6;
```

## Tipografía

Mantener contraste entre una serif con personalidad para títulos y una sans-serif moderna para interfaz.

Sugerencia:

```text
Headings / branding:
Fraunces, Cormorant Garamond o equivalente.

UI / datos / navegación:
Inter, Manrope, DM Sans o equivalente.
```

Reglas:

- No utilizar serif en tablas, botones ni datos operativos.
- Los números KPI deben usar sans-serif.
- Serif únicamente para branding, títulos de páginas y encabezados editoriales.

---

# 5. Layout general

Usar un contenedor central consistente:

```text
max-width: 1440px
padding desktop: 28–32px
padding tablet: 20–24px
padding mobile: 16px
```

Grid recomendado:

```text
Desktop: 12 columnas
Tablet: 8 columnas
Mobile: 4 columnas
```

Separación:

```text
section gap: 24px
card gap: 16px
internal card spacing: 20–24px
```

Border radius:

```text
cards: 18px
buttons: 12px
chips: 999px
```

Sombras:

```text
usar sombras extremadamente suaves;
priorizar bordes y separación tonal.
```

---

# 6. Header / navegación

## Problema actual

El header concentra:

- logo;
- navegación;
- usuario;
- rol;
- cerrar sesión.

Todo está al mismo nivel visual.

## Rediseño

Mantener el header oscuro, pero simplificarlo.

### Desktop

Estructura:

```text
[Brand]     [Dashboard] [Tarjetas] [Auditoría] [Terminal POS] [Corte de Caja]      [Usuario ▾]
```

Eliminar el botón rojo permanente “Salir”.

Mover logout a un menú de usuario.

Menú usuario:

```text
davis.hernandez
Gerente

----------------
Mi perfil
Preferencias
Cerrar sesión
```

### Estado activo

El módulo activo debe utilizar:

- fondo dorado oscuro/transparente;
- borde inferior o contorno dorado;
- icono y texto claros.

Evitar un botón demasiado elevado respecto al resto de navegación.

### Sticky header

El header debe permanecer visible al hacer scroll:

```css
position: sticky;
top: 0;
z-index: 50;
```

Aplicar una sombra muy ligera cuando exista scroll.

---

# 7. Encabezado del Dashboard

Actualmente:

```text
Panel Gerencial
Bienvenido, davis.hernandez...
```

Rediseñar como:

```text
Panel Gerencial

Resumen operativo
Domingo, 21 de septiembre

[Terminal POS] [Emitir tarjeta]
```

Mostrar el saludo en texto secundario si se desea:

```text
Buenos días, Davis.
```

No repetir el username técnico si existe nombre visible.

Eliminar el icono decorativo al lado del título.

---

# 8. Jerarquía de acciones

## Acción principal

En este sistema, la acción comercial principal debe ser:

**Emitir tarjeta**

Debe destacarse como Primary CTA.

```text
[ + Emitir tarjeta ]
```

Estilo:

- fondo dorado;
- texto espresso;
- icono;
- shadow suave;
- hover ligeramente más oscuro.

## Acción secundaria

```text
[ Abrir Terminal POS ]
```

Debe ser outline / neutral.

Esto evita que ambas acciones compitan visualmente.

---

# 9. KPIs del Dashboard

Actualmente existen:

- Total tarjetas
- Ventas de hoy
- Consumos hoy
- Saldo en tarjetas

Mantenerlos, pero mejorar su contenido.

## Nuevo diseño de KPI

Cada KPI debe contener:

```text
LABEL
Valor principal

Indicador secundario
Comparación / contexto
```

Ejemplo:

```text
VENTAS DE HOY

Q1,350.00

↑ 12.4% vs ayer
8 operaciones
```

Otro:

```text
TOTAL TARJETAS

124

112 activas
12 bloqueadas
```

Otro:

```text
CONSUMOS HOY

Q850.00

23 transacciones
Ticket promedio Q36.95
```

Otro:

```text
SALDO EN CIRCULACIÓN

Q18,420.00

Disponible en tarjetas activas
```

### Importante

Evitar usar verde solo porque una cifra es dinero.

El verde debe indicar:

- comportamiento positivo;
- éxito;
- saldo disponible;
- estado activo.

El color del KPI debe tener significado semántico.

---

# 10. Grid de KPI

Desktop:

```text
4 cards x 1 fila
```

Tablet:

```text
2 x 2
```

Mobile:

```text
1 columna
```

Los KPI deben tener altura uniforme pero más compacta que actualmente.

Recomendación:

```text
min-height aproximado: 150–170px
```

---

# 11. Dashboard principal

Después de los KPI utilizar una distribución:

```text
| Actividad del día           | Operación rápida |
| 8 columnas                  | 4 columnas       |
```

Actualmente “Acciones rápidas” ocupa demasiado ancho.

La zona principal debería dedicar más espacio a información gerencial.

---

# 12. Nueva sección: Actividad del día

Crear una card grande:

```text
Actividad del día
```

Debe mostrar visualmente:

```text
Emisiones       Q800
Recargas        Q550
Consumos        Q850
```

Agregar un gráfico ligero de barras o línea.

No debe ser un gráfico complejo.

Opciones:

- barras por hora;
- ingresos vs consumos;
- operaciones últimos 7 días.

El gráfico debe ser fácil de leer en menos de 5 segundos.

---

# 13. Rendimiento de 7 días

La card actual “Ventas de los últimos 7 días” tiene demasiado espacio vacío.

Rediseñarla como:

```text
Rendimiento — Últimos 7 días

Q5,480.00
Ingresos por emisión y recargas

+8.2 % vs período anterior

[mini gráfico]
```

Permitir selector:

```text
7 días
30 días
Este mes
```

No usar un bloque marrón gigante.

Utilizar fondo blanco con información jerarquizada y un gráfico de acento dorado.

---

# 14. Acciones rápidas

Convertir la lista en pequeñas action cards.

En vez de:

```text
Abrir Terminal POS ---------------- >
Gestión de tarjetas ---------------- >
Corte de caja ----------------------- >
```

Usar:

```text
┌─────────────────────┐
│ 🏪 Terminal POS     │
│ Cobrar / recargar   │
│              →      │
└─────────────────────┘
```

Grid recomendado:

```text
1 columna en panel lateral
```

Acciones:

1. Abrir Terminal POS
2. Emitir tarjeta
3. Buscar tarjeta
4. Corte de caja

“Gestión de tarjetas” puede mantenerse como navegación de módulo, pero “Buscar tarjeta” suele ser más útil operativamente.

---

# 15. Actividad reciente

Agregar una sección:

```text
Actividad reciente
```

Ejemplo:

```text
10:42
Recarga de Q200.00
Tarjeta •••• 8421
Atendido por davis.hernandez

10:31
Consumo de Q45.00
Tarjeta •••• 1204

10:12
Nueva tarjeta emitida
Saldo inicial Q100.00
```

Mostrar máximo 5 elementos.

CTA:

```text
Ver auditoría completa →
```

Esto conecta el Dashboard con Auditoría de forma natural.

---

# 16. Estado operativo

Agregar una pequeña franja de estado:

```text
● Terminal POS operativo
● Caja abierta
● Última operación 16:57
```

Si existe una situación importante:

```text
⚠ Corte pendiente
```

o

```text
⚠ 3 tarjetas requieren revisión
```

Solo mostrar alertas si requieren acción.

No llenar el dashboard con notificaciones informativas sin relevancia.

---

# 17. Terminal POS

Esta es una pantalla crítica y debe ser extremadamente rápida.

Principio:

> El cajero debe poder completar una operación sin navegar por múltiples pantallas.

Layout sugerido:

```text
┌──────────────────────────────────────────────────┐
│ Terminal POS                                     │
│ Escanee QR o ingrese código                      │
│                                                  │
│ [ Cámara / scanner ]        [ Código manual ]    │
│                                                  │
│ Tarjeta encontrada                              │
│ •••• 8421                                       │
│ Saldo Q350.00                                   │
│ Estado ACTIVA                                   │
│                                                  │
│ [Consumir]   [Recargar]                         │
└──────────────────────────────────────────────────┘
```

Después de seleccionar acción:

```text
Monto
[ Q________ ]

[ Confirmar consumo ]
```

Evitar modales innecesarios.

---

# 18. Feedback de operaciones

Después de una operación exitosa:

```text
✓ Consumo realizado

Q50.00

Saldo anterior  Q350.00
Saldo restante  Q300.00

[ Nueva operación ]
[ Ver comprobante ]
```

Evitar solo mostrar un toast.

Las operaciones financieras deben mostrar confirmación explícita.

---

# 19. Emisión de Gift Card

Usar un flujo de máximo 3 pasos:

```text
1. Datos
2. Saldo inicial
3. Confirmación
```

Paso 1:

```text
Nombre del cliente (opcional)
Correo (opcional)
Teléfono (opcional)
```

Paso 2:

```text
Monto inicial
Q [________]

Montos rápidos:
Q50
Q100
Q200
Q500
```

Paso 3:

```text
Resumen

Saldo inicial: Q200
Cliente: Juan Pérez
Vigencia: ...
```

CTA:

```text
Emitir tarjeta
```

Después:

```text
✓ Tarjeta emitida

[ Mostrar QR ]
[ Descargar PDF ]
[ Imprimir ]
[ Enviar por correo ]
```

---

# 20. Gestión de Tarjetas

Actualmente el módulo debe evolucionar hacia una tabla administrativa potente.

Toolbar:

```text
Tarjetas

[ Buscar por código, cliente o email... ]

Estado: Todos ▾
Saldo: Todos ▾
Fecha: ▾

[ + Emitir tarjeta ]
```

Tabla:

```text
Tarjeta
Cliente
Saldo
Estado
Último movimiento
Fecha emisión
Acciones
```

Código:

```text
GC-008421
•••• 8421
```

Estados:

```text
ACTIVA
BLOQUEADA
AGOTADA
VENCIDA
```

Nunca depender únicamente del color.

Usar badge + texto.

---

# 21. Vista detalle de tarjeta

Al abrir una tarjeta:

```text
Gift Card •••• 8421

ACTIVA

Saldo disponible
Q350.00

Cliente
Juan Pérez

Emitida
12 sep 2026
```

Acciones:

```text
[ Recargar ]
[ Bloquear ]
[ Cambiar PIN ]
[ Descargar tarjeta ]
```

Historial:

```text
Fecha
Tipo
Monto
Saldo resultante
Usuario
Terminal
```

---

# 22. Auditoría

Auditoría debe sentirse como módulo de seguridad y trazabilidad.

Filtros:

```text
Fecha
Usuario
Tipo de evento
Tarjeta
Terminal
```

Eventos:

```text
TARJETA_EMITIDA
RECARGA
CONSUMO
BLOQUEO
DESBLOQUEO
CAMBIO_PIN
CORTE_CAJA
LOGIN
```

Cada evento puede expandirse para mostrar:

```text
Fecha/hora
Usuario
IP
Terminal
Tarjeta
Saldo anterior
Monto
Saldo posterior
```

No mostrar JSON crudo como interfaz principal.

Puede existir un botón:

```text
Ver detalle técnico
```

---

# 23. Corte de Caja

La pantalla debe responder en segundos:

```text
¿Cuánto se movió hoy?
```

Resumen:

```text
Saldo inicial caja
Q0.00

Emisiones
Q850.00

Recargas
Q500.00

Consumos
Q430.00

Total recibido
Q1,350.00
```

Separar claramente:

```text
Dinero recibido
vs
Saldo consumido
```

Evitar mezclar conceptos financieros.

Botón principal:

```text
Cerrar turno
```

Debe abrir un resumen antes de confirmar.

---

# 24. Empty states

No dejar cards vacías.

Ejemplo:

```text
Todavía no hay operaciones hoy.

Cuando realices una emisión, recarga o consumo,
aparecerá aquí.

[ Abrir Terminal POS ]
```

---

# 25. Loading states

Evitar loaders globales.

Usar skeletons locales:

```text
KPI skeleton
table row skeleton
chart skeleton
```

La navegación debe permanecer usable.

---

# 26. Estados de error

Los errores deben explicar:

1. qué pasó;
2. qué puede hacer el usuario.

Incorrecto:

```text
Error 500
```

Correcto:

```text
No pudimos procesar la recarga.

El saldo de la tarjeta no fue modificado.

[ Intentar nuevamente ]
```

---

# 27. Confirmaciones críticas

Requerir confirmación explícita para:

- bloquear tarjeta;
- cancelar operación;
- cerrar caja;
- eliminar registro administrativo si aplica;
- revertir transacción si el sistema lo permite.

No confirmar operaciones rutinarias como buscar tarjeta.

---

# 28. Toasts

Usar toast para acciones secundarias:

```text
✓ PIN actualizado
✓ PDF descargado
✓ Correo enviado
```

No usar toast como única confirmación de una transacción monetaria.

---

# 29. Iconografía

Usar una sola librería.

Recomendado:

```text
Lucide Icons
```

Evitar mezclar iconos con estilos diferentes.

Tamaños:

```text
navigation: 18px
buttons: 18px
cards: 20–22px
```

---

# 30. Microinteracciones

Mantenerlas discretas.

Hover card:

```text
transform: translateY(-1px)
```

Duración:

```text
150–200ms
```

Botones:

- cambio suave de fondo;
- focus visible;
- no utilizar escalado exagerado.

---

# 31. Responsive

## Desktop

Header horizontal completo.

## Tablet

Convertir navegación secundaria en menú compacto si es necesario.

## Mobile

Header:

```text
[ Logo ]              [ ☰ ]
```

Dashboard:

```text
1 KPI por fila
```

Primary CTA sticky opcional:

```text
[ + Emitir tarjeta ]
```

Terminal POS debe priorizar interacción táctil.

Botones mínimos:

```text
44px altura
```

---

# 32. Accesibilidad

Objetivo mínimo:

```text
WCAG AA
```

Requisitos:

- contraste correcto;
- focus visible;
- navegación con teclado;
- labels en inputs;
- no depender solo de color;
- aria-label en icon buttons;
- tablas accesibles;
- mensajes de error vinculados a inputs.

---

# 33. Dashboard propuesto

Estructura final:

```text
┌───────────────────────────────────────────────────────────┐
│ HEADER                                                    │
├───────────────────────────────────────────────────────────┤
│ Panel Gerencial                       [POS] [+ Emitir]     │
│ Resumen operativo · Domingo 21 septiembre                 │
├───────────────────────────────────────────────────────────┤
│ KPI       KPI       KPI       KPI                         │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ Actividad del día                 Acciones rápidas         │
│ gráfico / métricas                Terminal POS             │
│                                   Emitir tarjeta           │
│                                   Buscar tarjeta           │
│                                   Corte de caja            │
├───────────────────────────────────────────────────────────┤
│ Rendimiento 7 días                Actividad reciente       │
│ gráfico                           movimientos recientes    │
├───────────────────────────────────────────────────────────┤
│ Estado operativo                                          │
└───────────────────────────────────────────────────────────┘
```

---

# 34. Prioridades de implementación

## P0 — obligatorio

- Refactor del header.
- Jerarquía correcta de CTA.
- KPI compactos.
- Rediseño de dashboard.
- Layout responsive.
- Tokens visuales.
- Mejorar Terminal POS.
- Confirmaciones financieras.
- Estados loading/error.

## P1 — importante

- Actividad reciente.
- Gráfico 7 días.
- Dashboard con comparativas.
- Mejorar gestión de tarjetas.
- Vista detalle.
- Auditoría visual.

## P2 — evolución

- Personalización de dashboard.
- Atajos de teclado.
- Tema oscuro opcional.
- Métricas avanzadas.
- Exportaciones configurables.

---

# 35. Reglas para el agente de IA

## No hacer

- No reescribir lógica de backend sin necesidad.
- No cambiar endpoints existentes salvo que sea imprescindible.
- No alterar permisos o roles.
- No inventar métricas que el backend no entregue.
- No utilizar datos mock en producción.
- No llenar el dashboard con información sin propósito.
- No reemplazar la identidad visual café/dorado.
- No utilizar colores sin significado semántico.
- No convertir cada acción en modal.
- No utilizar animaciones llamativas.

## Sí hacer

- Reutilizar componentes.
- Crear design tokens.
- Mantener consistencia visual.
- Extraer componentes UI comunes.
- Implementar skeletons.
- Implementar empty states.
- Implementar estados de error.
- Mantener accesibilidad.
- Hacer responsive cada nueva vista.
- Preservar funcionalidad existente.

---

# 36. Componentes recomendados

Crear o estandarizar:

```text
<AppShell />
<TopNavigation />
<PageHeader />

<Button />
<IconButton />
<Badge />
<Card />
<StatCard />

<SearchInput />
<Select />
<DatePicker />

<DataTable />
<TablePagination />

<EmptyState />
<ErrorState />
<Skeleton />

<ConfirmDialog />
<TransactionResult />

<ActivityFeed />
<MiniChart />
<QuickActionCard />

<CardStatusBadge />
<Currency />
```

---

# 37. Convenciones visuales

## Border

```text
1px solid var(--color-border)
```

## Radius

```text
12–18px
```

## Espaciado

Utilizar múltiplos de 4.

```text
4
8
12
16
20
24
32
40
48
```

## Altura botones

```text
small: 36px
normal: 44px
large: 48px
```

---

# 38. Métricas que deben distinguirse correctamente

Es importante no confundir:

```text
Emisión:
Nueva tarjeta creada con saldo.

Recarga:
Saldo agregado a tarjeta existente.

Consumo:
Saldo utilizado por cliente.

Saldo en circulación:
Dinero/prepago actualmente disponible en tarjetas.

Ingresos:
Dinero recibido por emisión + recargas.

Consumos:
No representan nuevo ingreso en ese momento.
```

La UI debe comunicar estas diferencias correctamente.

---

# 39. Resultado esperado

El producto final debe sentirse:

```text
Premium
Operativo
Rápido
Seguro
Propio de Cafetería Premium
```

El dashboard no debe parecer un template administrativo genérico.

Debe comunicar inmediatamente:

```text
¿Cuánto vendimos?
¿Cuánto se consumió?
¿Cuánto saldo hay circulando?
¿Qué ocurrió recientemente?
¿Hay algo que requiera atención?
¿Qué acción necesito hacer ahora?
```

---

# 40. Criterio final de diseño

Cada pantalla debe pasar esta prueba:

> Un gerente o cajero que nunca haya utilizado el sistema debería entender en menos de 5 segundos qué información está viendo y cuál es la siguiente acción disponible.

Si una pantalla necesita explicación adicional para operar, debe simplificarse.

