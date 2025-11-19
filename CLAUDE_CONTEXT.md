# Contexto del Proyecto - Portafolio de Martín Montero

## Descripción General
Portafolio personal web desarrollado como proyecto universitario para la materia de Diseño Web en USFQ (Universidad San Francisco de Quito), Semestre 7.

El portafolio presenta una experiencia visual moderna e interactiva con animaciones fluidas y un diseño responsive.

---

## Stack Tecnológico

### Frontend Framework
- **Angular 20.3.0** - Framework principal
  - Change Detection: OnPush (optimización de performance)
  - Standalone Components (arquitectura moderna sin módulos)
  - Router con lazy loading

### Styling
- **Tailwind CSS 4.1.16** (@tailwindcss/postcss)
  - Utility-first CSS framework
  - Configuración custom con breakpoints responsive
  - Dark mode implementado (toggle manual)

### Animaciones
- **GSAP 3.13.0** (GreenSock Animation Platform)
  - Plugin: ScrollTrigger - Animaciones basadas en scroll
  - Timelines para secuencias complejas
  - RequestAnimationFrame para animaciones continuas

### Iconografía
- **Lucide Angular 0.552.0** - Iconos SVG optimizados

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── app.ts                    # Root component
│   ├── app.html                  # Root template
│   ├── app.routes.ts             # Configuración de rutas
│   │
│   ├── home/                     # Página principal
│   │   ├── home.ts
│   │   └── home.html
│   │
│   ├── about/                    # Sección About (principal)
│   │   ├── about.ts              # Lógica de animaciones del blob 3D
│   │   ├── about.html
│   │   └── about.scss
│   │
│   ├── footer/                   # Footer del sitio
│   │   ├── footer.ts
│   │   └── footer.html
│   │
│   └── shared/
│       ├── components/
│       │   ├── navbar/           # Barra de navegación con menú mobile
│       │   │   ├── navbar.ts     # Animaciones de hover y menú
│       │   │   ├── navbar.html
│       │   │   └── navbar.scss
│       │   │
│       │   └── starfield/        # Fondo animado de estrellas
│       │       ├── starfield.ts  # Animaciones con RAF
│       │       ├── starfield.html
│       │       └── starfield.scss
│       │
│       ├── services/
│       │   ├── theme.service.ts      # Gestión de tema claro/oscuro
│       │   └── favicon.service.ts    # Actualización dinámica de favicon
│       │
│       └── constants/
│           └── links.constant.ts     # URLs de redes sociales y CV
│
└── assets/
    ├── 3d_shape/                 # Secuencia de 25 imágenes webp del blob 3D
    │   ├── 01.webp - 25.webp       # (~2.3-3.1 MB cada una)
    │   └── (Nota: actualmente solo se usa 01.webp)
    │
    ├── icons_base/               # Iconos de acciones (Contact, CV, GitHub, LinkedIn)
    ├── profile.webp               # Foto de perfil
    └── (otros assets)
```

---

## Componentes Principales y Animaciones

### 1. About Component (`src/app/about/`)
**Responsabilidad principal:** Sección hero con animación interactiva del blob 3D

**Animaciones implementadas:**

#### A) Blob 3D Scroll Animation
- **Ubicación del código:** `about.ts` líneas 154-227 (método `updateShapePosition()`)
- **Tecnología:** GSAP ScrollTrigger
- **Comportamiento:**
  - **Posición inicial:**
    - Mobile (< 640px): centrado horizontalmente, debajo de los botones de acción, rotación 120°
    - Desktop (≥ 640px): a la derecha de la foto de perfil + 50px, rotación 0°
  - **Animación:**
    - Desde posición inicial → centro del viewport
    - Escala: 1.0 → 1.6
    - Duración de scroll: 1000px (desde top+100 hasta +1000)
    - Scrub activado (ligado al scroll)

- **Fixes aplicados:**
  - `clearProps: 'all'` antes de recalcular para evitar transformaciones acumuladas
  - `window.scrollY` sumado a posiciones Y para usar coordenadas absolutas
  - `invalidateOnRefresh: true` para recalcular en resize
  - `force3D: true` para optimización de GPU

#### B) Jelly Icons Animation
- **Ubicación del código:** `about.ts` líneas 79-98 (método `setupJellyAnims()`)
- **Tecnología:** GSAP Timeline (pausable y reversible)
- **Comportamiento:**
  - Bounce de 3 pasos (0.65s total):
    1. y: -8, rotate: 4° (0.25s)
    2. y: -4, rotate: -2° (0.18s)
    3. y: 0, rotate: 0° (0.22s)
  - Triggers: mouseenter/mouseleave, focus/blur
  - Se aplica a 4 botones: Contact, CV, GitHub, LinkedIn

#### C) Medición de Texto
- **Ubicación del código:** `about.ts` líneas 55-77, 100-122
- **Propósito:** Calcular ancho máximo del texto para alinear botones
- **Técnicas:**
  - `maxContentLineWidth()`: usa `Range.getClientRects()` para medir líneas individuales
  - `deferMeasure()`: ejecuta medición con múltiples estrategias:
    - queueMicrotask
    - requestAnimationFrame
    - setTimeout
    - document.fonts.ready (espera carga de fuentes)
    - window.load

**Listeners de eventos:**
- `@HostListener('window:resize')`: recalcula ancho de texto y posición del blob
- `ResizeObserver`: observa foto de perfil y botones mobile
- Event listeners de carga de imágenes

---

### 2. Starfield Component (`src/app/shared/components/starfield/`)
**Responsabilidad:** Fondo animado de estrellas con movimiento orgánico

**Animaciones implementadas:**
- **Drift (movimiento):** x/y aleatorio ±100px, 3-6s, sine.inOut, yoyo infinito
- **Pulse (escala):**
  - 20% de estrellas: scale 0.85-1.25, 2.5-4.5s (pulse fuerte)
  - 80% de estrellas: scale 0.98-1.02, 6-14s (pulse sutil)
- **Opacity pulse:** varía entre minOpacity y maxOpacity
- **Scroll dinámico:** RAF actualiza posición Y según `window.scrollY`

**Gestión de memoria:**
- `ngOnDestroy`: cancelAnimationFrame + killTweensOf + removeEventListener

---

### 3. Navbar Component (`src/app/shared/components/navbar/`)
**Responsabilidad:** Navegación principal con tema toggle y menú mobile

**Animaciones implementadas:**
- **Icon Hover:**
  - Enter: scale 1.08, 0.18s
  - Leave: scale 1, 0.2s
- **Icon Press:**
  - Down: scale 0.95, 0.08s
  - Up: scale 1.05, 0.12s
- **Menu Animation:**
  - Panel: y: 0, opacity: 1, 0.24s
  - Items: stagger 0.06s, 0.22s cada uno

---

## Servicios

### Theme Service
- **Archivo:** `src/app/shared/services/theme.service.ts`
- **Responsabilidad:** Gestión de tema claro/oscuro
- **Almacenamiento:** localStorage
- **Integración:** Agrega/remueve clase `dark` del HTML

### Favicon Service
- **Archivo:** `src/app/shared/services/favicon.service.ts`
- **Responsabilidad:** Actualizar favicon dinámicamente

---

## Buenas Prácticas Implementadas

### Performance
1. **Change Detection:** OnPush en componentes para reducir ciclos de detección
2. **Force3D:** Activo en animaciones GSAP para aceleración GPU
3. **Lazy Loading:** Imágenes con atributo `loading="lazy"`
4. **will-change-transform:** En elementos animados
5. **Passive listeners:** En eventos de scroll/resize

### Gestión de Memoria
1. **ngOnDestroy completo:**
   - ScrollTrigger.kill()
   - ResizeObserver.disconnect()
   - gsap.killTweensOf()
   - cancelAnimationFrame()
   - removeEventListener()

2. **Cleanup de timelines:** Map de timelines para rastrear y limpiar

### Animaciones Determinísticas
1. **clearProps: 'all'** antes de recalcular posiciones en resize
2. **invalidateOnRefresh** en ScrollTrigger
3. **Posiciones absolutas** (getBoundingClientRect + window.scrollY)

---

## Problemas Conocidos y Soluciones

### ✅ Resuelto: Blob 3D desalineado en resize
**Problema:** Cuando se hace resize durante scroll, el blob aparecía en posición incorrecta

**Causa raíz:**
- `getBoundingClientRect()` retorna coordenadas relativas al viewport actual
- Transformaciones GSAP acumuladas no se limpiaban

**Solución aplicada:**
1. Limpiar todas las propiedades GSAP con `clearProps: 'all'`
2. Sumar `window.scrollY` a las posiciones Y para usar coordenadas absolutas
3. `invalidateOnRefresh: true` para recalcular en cada refresh
4. Matar y recrear completamente el ScrollTrigger en cada resize

**Archivos modificados:**
- `src/app/about/about.ts` líneas 154-227

---

## Assets Pendientes de Uso

**Imágenes del blob 3D (02.webp - 25.webp):**
- Ubicación: `src/assets/3d_shape/`
- Estado: Generadas pero no usadas en código
- Posible uso futuro: Animación secuencial del blob (como sprite sheet)

---

## Configuración de Desarrollo

### Scripts disponibles
```json
{
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
}
```

### Breakpoints de Tailwind
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## Git Status Actual

**Branch:** master
**Archivos modificados:**
- `src/app/about/about.ts` - Fix de animación del blob en resize
- `src/app/shared/components/starfield/starfield.ts` - (modificaciones menores)

**Archivos sin tracking:**
- 24 imágenes webp del blob 3D (02.webp - 25.webp)

---

## Notas para Futuras Iteraciones

1. **Optimización de assets:**
   - Considerar comprimir imágenes del blob 3D (actualmente 2-3 MB cada una)
   - Evaluar uso de WebP en lugar de webp

2. **Blob 3D animado:**
   - Implementar secuencia de imágenes 01-25 como sprite animation
   - Sincronizar con scroll o tiempo

3. **Accesibilidad:**
   - Agregar `prefers-reduced-motion` para deshabilitar animaciones
   - Validar navegación por teclado

4. **SEO:**
   - Agregar meta tags Open Graph
   - Implementar SSR con Angular Universal

5. **Testing:**
   - Tests unitarios para componentes
   - Tests E2E para flujos críticos

---

## Contacto del Desarrollador

- **Nombre:** Martín Montero
- **Universidad:** USFQ (Universidad San Francisco de Quito)
- **Semestre:** 7
- **Materia:** Diseño Web

---

*Última actualización: 2025-11-17*
