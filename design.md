# Design Style: Dark Industrial Cyan (Machine UI)

## 1. Design Philosophy

A shift from soft industrial plastic to **high-contrast machine interfaces**.

This style evokes:
- Control panels
- Server racks
- Sci-fi consoles
- Embedded systems dashboards

### Core Principles

**1. Emissive Light**
- Cyan is not just a color — it represents energy.
- Light comes from components, not environment.

**2. Hard Surfaces**
- Materials feel like metal, glass, and coated alloys.
- Edges are sharper, shadows are deeper.

**3. Functional Glow**
- Glow is used sparingly for:
  - Active states
  - Data displays
  - Focus interactions

**4. Mechanical Interaction**
- Buttons press inward
- Panels lift on hover
- Inputs feel like data ports

---

## 2. Design Tokens

### Colors

```css
--background: #0b0f14;
--panel: #121821;
--recessed: #0a0e12;

--text-primary: #e6f1ff;
--text-muted: #7f8ea3;

--accent: #00e5ff;
--accent-soft: #00bcd4;

--border-dark: #05080c;
--border-light: #1c2733;
````

### Meaning

* **Background** → void / base layer
* **Panel** → raised modules
* **Recessed** → deep slots / inputs
* **Accent** → electrical energy

### fonts
* anybody, arimo, space grotesk
---

## 3. Shadow System

### Panel (Base Elevation)

```css
box-shadow:
  6px 6px 12px rgba(0,0,0,0.6),
  -2px -2px 6px rgba(0,229,255,0.05);
```

### Floating (Hover / Active UI)

```css
box-shadow:
  0 10px 25px rgba(0,0,0,0.8),
  0 0 12px rgba(0,229,255,0.25);
```

### Pressed (Active State)

```css
box-shadow:
  inset 4px 4px 10px rgba(0,0,0,0.9),
  inset -2px -2px 6px rgba(0,229,255,0.08);
```

### Glow (Accent)

```css
box-shadow:
  0 0 8px rgba(0,229,255,0.6),
  0 0 24px rgba(0,229,255,0.2);
```

---

## 4. Typography

### Fonts

* Primary: Inter
* Technical: JetBrains Mono

### Usage

| Type       | Style                             |
| ---------- | --------------------------------- |
| Headings   | Bold, tight tracking, subtle glow |
| Body       | Neutral, high readability         |
| Labels     | Uppercase, wide tracking          |
| Data/Input | Monospace                         |

### Effects

```css
text-shadow: 0 0 6px rgba(0,229,255,0.2);
```

---

## 5. Components

### Buttons (Power Switch Style)

#### Primary

```css
background: #00e5ff;
color: #001014;

box-shadow:
  0 6px 14px rgba(0,0,0,0.7),
  0 0 10px rgba(0,229,255,0.5);
```

#### Interaction

* Hover → stronger glow
* Active:

  * translateY(2px)
  * inset shadow
  * reduced glow

---

### Cards (Modules)

```css
background: #121821;
border-radius: 12px;

box-shadow:
  6px 6px 16px rgba(0,0,0,0.7),
  -2px -2px 8px rgba(0,229,255,0.04);
```

#### Details

* Optional screws
* Vent slots
* Subtle edge highlights

---

### Inputs (Terminal Slots)

```css
background: #0a0e12;

box-shadow:
  inset 4px 4px 10px rgba(0,0,0,0.9),
  inset -1px -1px 4px rgba(0,229,255,0.05);

color: #00e5ff;
font-family: JetBrains Mono;
```

#### Focus

```css
box-shadow:
  inset 4px 4px 10px rgba(0,0,0,0.9),
  0 0 0 1px #00e5ff,
  0 0 10px rgba(0,229,255,0.5);
```

---

### Screens / Displays

```css
background: #000;

box-shadow:
  inset 0 0 20px rgba(0,0,0,0.9),
  0 0 10px rgba(0,229,255,0.2);
```

#### Scanlines

```css
background-image:
  linear-gradient(rgba(0,0,0,0) 50%, rgba(0,255,255,0.08) 50%);
background-size: 100% 3px;
```

---

### LED Indicators

```css
width: 10px;
height: 10px;
border-radius: 50%;

background: #00e5ff;

box-shadow:
  0 0 10px #00e5ff,
  0 0 20px rgba(0,229,255,0.5);
```

#### Status Colors

* Cyan → active
* Green → success
* Yellow → warning
* Red → error

---

## 6. Textures

### Grid Overlay

```css
background-image:
  radial-gradient(rgba(0,255,255,0.03) 1px, transparent 1px);
background-size: 40px 40px;
```

### Optional

* subtle noise
* glass reflections
* scanlines for screens only

---

## 7. Motion & Interaction

### Timing

* Fast: 150ms
* Standard: 300ms

### Easing

```
cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Patterns

* Button press → translate + inset shadow
* Card hover → lift + glow
* Icons → slight scale/rotate
* LEDs → pulse animation

---

## 8. Layout

### Structure

* Max width: 72rem
* Spacing: 24px–96px scale
* Grid-based alignment

### Behavior

* Mobile-first
* Maintain depth at all sizes
* Avoid flattening UI on smaller screens

---

## 9. Do / Don’t

### Do

* Use glow intentionally
* Maintain depth hierarchy
* Keep surfaces dark and layered
* Use cyan as energy, not decoration

### Don’t

* Overuse glow everywhere
* Use pure white backgrounds
* Flatten shadows
* Mix warm colors with cyan theme

---

## 10. Summary

This system transforms UI into a **machine interface**:

* Dark, controlled environment
* Cyan as active energy
* Physical interaction preserved
* Depth and realism maintained
