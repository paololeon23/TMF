# COPA MUNDIAL TMF 2026

Sitio web premium estilo Mundial / Champions League / FIFA, totalmente responsive, con efectos 3D, animaciones cinematográficas, dashboard deportivo y countdown en vivo al partido del domingo.

> **Hoy se juega a las 6:30 PM — Estadio Siglo 21**
> Todos los domingos · 18:30 hrs.

---

## Cómo abrirla

**Opción 1 — Doble clic**
1. Abre la carpeta del proyecto.
2. Haz doble clic en `index.html`.

> Funciona sin servidor porque todas las librerías (Tailwind, Three.js, GSAP, Lucide) cargan desde CDN.

**Opción 2 — Servidor local (recomendado para mejor rendimiento)**

Si tienes Python instalado:

```bash
python -m http.server 8000
```

Luego abre <http://localhost:8000>.

Si usas Node:

```bash
npx serve .
```

---

## Estructura

```
futbol tmf/
├── index.html         ← marcado de la página completa
├── css/
│   └── styles.css     ← estilos premium (glassmorphism, neon, animaciones, responsive)
├── js/
│   ├── three-scene.js ← escena 3D Three.js (estadio + partículas + luces)
│   └── main.js        ← loader, countdown, jugadores, dashboard, scroll
└── README.md
```

---

## Tecnologías

- **HTML5 / CSS3 moderno**
- **Tailwind CSS** (CDN, configuración inline con paleta personalizada)
- **JavaScript ES6+** vanilla
- **Three.js r128** — escena 3D con estadio, líneas de campo, luces de colores y 1500 partículas reactivas al mouse + scroll
- **GSAP 3 + ScrollTrigger** — entrada épica del hero
- **Lucide Icons** — iconografía SVG moderna

---

## Secciones

1. **Loader** estilo "estadio encendiéndose" (luces, balón rebotando, barra de carga)
2. **Hero** con título gigante "COPA MUNDIAL TMF 2026", subtítulo, CTA y countdown compacto
3. **Match of the Day** — TMF UNITED vs LOS RIVALES, 18:30, Estadio Siglo 21 + countdown gigante
4. **Jugadores** — 8 cards holográficas con tilt 3D, anillo animado, energía y stats:
   Chifu · Paolo Neto · WLAN 21 · Jose Ch. · Ratón · Erick · Clau · Mono Serio
5. **Dashboard en vivo** — sparkline de rendimiento, ring de victorias, barras de goles, probabilidades del partido y nivel físico
6. **Modo Serio** — sección dedicada al jugador en recuperación post-lesión, con barra animada, días de recuperación y estado "LISTO PARA HOY 18:30"
7. **Próximas jornadas** — calendario de los siguientes domingos
8. **Tabla de posiciones** — ranking con TMF UNITED resaltado en mint
9. **CTA final** + footer
10. **Botón flotante** estilo IA / WhatsApp con panel de preguntas rápidas

---

## Detalles premium

- **Modo oscuro futurista** con gradientes radiales (azul eléctrico, verde neón, dorado)
- **Mouse spotlight** que sigue al cursor
- **3D tilt** en cada card (jugadores y dashboard)
- **Holographic sheen** en cards al hacer hover
- **Sonidos sutiles** generados con Web Audio API al pasar el mouse (se activan tras la primera interacción del usuario)
- **Glitch RGB** en el título principal
- **Reveal on scroll** con IntersectionObserver
- **Countdown** apunta al **10 de mayo de 2026 a las 18:30** y, una vez pasada esa fecha, automáticamente al próximo domingo a la misma hora
- **prefers-reduced-motion** respetado
- **Performance**: `pixelRatio` capado, animación pausada cuando la pestaña no está visible

---

## Personalización rápida

| Para cambiar... | Edita |
| --- | --- |
| Equipos / nombre del partido | `index.html` (sección `#match`) |
| Jugadores y stats | `js/main.js` → constante `PLAYERS` |
| Próximas jornadas | `js/main.js` → constante `upcoming` |
| Tabla de posiciones | `js/main.js` → constante `standings` |
| Hora del kickoff | `js/main.js` → función `getKickoff()` |
| Paleta de colores | `index.html` → bloque `tailwind.config` + `css/styles.css` |
| Texto "Modo Serio" | `index.html` → sección `#serio` |

---

## Paleta

| Color | Hex | Uso |
| --- | --- | --- |
| Negro `ink` | `#05060a` | Fondo |
| Azul eléctrico | `#00d4ff` | Acentos, botones, títulos |
| Verde neón | `#39ff14` | Energía, recuperación, victoria |
| Dorado | `#ffd166` | Trofeo, top1 |
| Carmesí | `#ff2b5b` | Alertas, defensa |

---

Hecho con pasión por el fútbol.
