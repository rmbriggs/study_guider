# Design System & Style Guide

> **For use with Cursor AI** — Reference this file when building UI components, pages, and layouts. Follow these rules consistently across the entire application.

---

## 1. Design Philosophy

This is a **warm, friendly dashboard/app** that feels inviting rather than cold or corporate. The design language combines:

- **Warm neutral canvas** — cream/beige backgrounds that feel cozy and approachable
- **Colorful accent pops** — a full rainbow of icon badges, chips, and highlights that bring energy and help users quickly distinguish categories
- **Soft, rounded shapes** — generous border-radius on everything from cards to buttons to avatars
- **Generous whitespace** — let content breathe; never crowd elements together
- **Two card styles** — soft floating cards for primary content, frosted glass cards for overlays and secondary panels

**Personality keywords:** Friendly, Playful, Organized, Warm, Modern

> **Theme support:** This design system supports both **Light** and **Dark** modes. All components use CSS custom properties that automatically remap when the theme changes. See **Section 14** for the full dark mode specification.

---

## 2. Color System

### 2.1 Background Palette

```css
:root {
  /* Primary canvas — use as page/section backgrounds */
  --bg-primary: #F7F4EF;        /* warm cream — DEFAULT page background */
  --bg-secondary: #F0EDE8;      /* slightly deeper cream — alternate sections */
  --bg-tertiary: #E8E4DE;       /* warm stone — subtle dividers or inset areas */

  /* Surface colors — use for cards and elevated elements */
  --surface-solid: #FFFFFF;             /* solid white card */
  --surface-frosted: rgba(255, 255, 255, 0.65); /* frosted glass card */
  --surface-hover: #FAFAF8;            /* subtle hover state on cards */
  --surface-active: #F5F3F0;           /* pressed/active state */

  /* Dark surfaces — for contrast sections, dark cards, or inverted areas */
  --surface-dark: #1A1A2E;
  --surface-dark-secondary: #2D2D44;
}
```

### 2.2 Text Colors

```css
:root {
  --text-primary: #1A1A2E;      /* near-black, slightly warm — headings and body */
  --text-secondary: #5F6577;    /* medium gray — descriptions, secondary info */
  --text-muted: #9CA3AF;        /* light gray — placeholders, timestamps, metadata */
  --text-on-dark: #F7F4EF;      /* cream white — text on dark backgrounds */
  --text-on-dark-muted: #B8B5AE; /* muted text on dark surfaces */
}
```

### 2.3 Accent Rainbow

Each accent color has three variants: a **bold** version (icons, buttons), a **soft background** (badges, chips), and a **border/ring** version.

```css
:root {
  /* Purple — use for: user profiles, AI features, premium badges */
  --purple-bold: #8B5CF6;
  --purple-soft: #EDE9FE;
  --purple-ring: #C4B5FD;
  --purple-text: #6D28D9;

  /* Green — use for: success states, productivity, tasks complete */
  --green-bold: #22C55E;
  --green-soft: #DCFCE7;
  --green-ring: #86EFAC;
  --green-text: #15803D;

  /* Yellow/Gold — use for: highlights, favorites, warnings */
  --yellow-bold: #EAB308;
  --yellow-soft: #FEF9C3;
  --yellow-ring: #FCD34D;
  --yellow-text: #A16207;

  /* Blue — use for: links, info states, data/analytics */
  --blue-bold: #3B82F6;
  --blue-soft: #DBEAFE;
  --blue-ring: #93C5FD;
  --blue-text: #1D4ED8;

  /* Orange — use for: notifications, trending, energy/action */
  --orange-bold: #F97316;
  --orange-soft: #FFEDD5;
  --orange-ring: #FDBA74;
  --orange-text: #C2410C;

  /* Pink/Rose — use for: likes, social, creative content */
  --pink-bold: #EC4899;
  --pink-soft: #FCE7F3;
  --pink-ring: #F9A8D4;
  --pink-text: #BE185D;

  /* Teal — use for: health, environment, secondary actions */
  --teal-bold: #14B8A6;
  --teal-soft: #CCFBF1;
  --teal-ring: #5EEAD4;
  --teal-text: #0F766E;
}
```

### 2.4 Semantic Colors

```css
:root {
  --color-success: var(--green-bold);
  --color-warning: var(--yellow-bold);
  --color-error: #EF4444;
  --color-error-soft: #FEE2E2;
  --color-info: var(--blue-bold);
}
```

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  /* Primary — used for EVERYTHING (headings + body) */
  --font-primary: 'Plus Jakarta Sans', 'Nunito', 'Inter', system-ui, sans-serif;

  /* Monospace — code blocks, technical data, model names */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

> **Why Plus Jakarta Sans?** It has rounded terminals (friendly feel), excellent weight range (200–800), and great readability at small sizes. Nunito is the fallback with similar characteristics.

### 3.2 Type Scale

Use this consistent scale throughout the app. **Never invent arbitrary font sizes.**

| Token              | Size   | Weight | Line Height | Letter Spacing | Use Case                        |
|--------------------|--------|--------|-------------|----------------|---------------------------------|
| `--text-display`   | 2.5rem (40px) | 800 | 1.1 | -0.025em | Hero headlines, page titles      |
| `--text-h1`        | 2rem (32px)   | 700 | 1.2 | -0.02em  | Section headings                 |
| `--text-h2`        | 1.5rem (24px) | 700 | 1.3 | -0.015em | Card titles, subsection heads    |
| `--text-h3`        | 1.25rem (20px)| 600 | 1.4 | -0.01em  | Widget titles, group labels      |
| `--text-body`      | 1rem (16px)   | 400 | 1.6 | 0        | Body text, descriptions          |
| `--text-body-sm`   | 0.875rem (14px)| 400 | 1.5 | 0       | Secondary text, table data       |
| `--text-caption`   | 0.75rem (12px) | 500 | 1.4 | 0.02em  | Labels, timestamps, metadata     |
| `--text-overline`  | 0.6875rem (11px)| 600 | 1.3 | 0.08em | ALL-CAPS category labels         |

### 3.3 Typography Rules

- **Headings** are always `--text-primary` color (dark)
- **Body text** uses `--text-secondary` for descriptions, `--text-primary` for important body content
- **Never use pure black (#000000)** — always use `--text-primary` (#1A1A2E)
- **Overline labels** should be uppercase with wide letter-spacing
- **Links** use `--blue-bold` with no underline by default; underline on hover

---

## 4. Spacing System

Use a **4px base unit**. All spacing should be multiples of 4.

```css
:root {
  --space-1: 0.25rem;   /* 4px — tight inner gaps */
  --space-2: 0.5rem;    /* 8px — between related elements */
  --space-3: 0.75rem;   /* 12px — compact padding */
  --space-4: 1rem;      /* 16px — standard padding */
  --space-5: 1.25rem;   /* 20px — comfortable gap */
  --space-6: 1.5rem;    /* 24px — card internal padding */
  --space-8: 2rem;      /* 32px — between card groups */
  --space-10: 2.5rem;   /* 40px — section internal padding */
  --space-12: 3rem;     /* 48px — between major sections */
  --space-16: 4rem;     /* 64px — large section gaps */
  --space-20: 5rem;     /* 80px — page-level vertical rhythm */
}
```

### Spacing Rules

- **Card internal padding**: `--space-6` (24px)
- **Gap between cards in a grid**: `--space-5` (20px)
- **Between a heading and its content**: `--space-3` (12px)
- **Between sections**: `--space-12` to `--space-16`
- **Page horizontal padding**: `--space-6` on mobile, `--space-10` on desktop
- **Sidebar width**: 260px (desktop), collapsed to 64px icon-only mode

---

## 5. Border Radius

Everything should feel **soft and rounded**. This is a core part of the friendly personality.

```css
:root {
  --radius-sm: 8px;     /* small chips, tags, inline badges */
  --radius-md: 12px;    /* buttons, input fields, small cards */
  --radius-lg: 16px;    /* standard cards, modals */
  --radius-xl: 20px;    /* large feature cards, hero sections */
  --radius-2xl: 24px;   /* prominent panels, frosted overlays */
  --radius-full: 9999px; /* pills, avatar circles, icon badges */
}
```

### Radius Rules

- **Cards**: `--radius-lg` (16px) minimum, `--radius-xl` (20px) for featured/large cards
- **Buttons**: `--radius-md` (12px) for standard, `--radius-full` for pill buttons
- **Input fields**: `--radius-md` (12px)
- **Icon badges**: `--radius-md` (12px) for square badges, `--radius-full` for circular
- **Chips/tags**: `--radius-full` (pill shape)
- **Images inside cards**: match the card's radius minus the padding

---

## 6. Shadows & Elevation

### 6.1 Soft Card Shadows

```css
:root {
  /* For cards resting on cream background */
  --shadow-sm: 0 1px 2px rgba(26, 26, 46, 0.04);
  --shadow-md: 0 2px 8px rgba(26, 26, 46, 0.06), 0 1px 2px rgba(26, 26, 46, 0.04);
  --shadow-lg: 0 4px 16px rgba(26, 26, 46, 0.08), 0 2px 4px rgba(26, 26, 46, 0.04);
  --shadow-xl: 0 8px 32px rgba(26, 26, 46, 0.10), 0 2px 8px rgba(26, 26, 46, 0.05);

  /* Hover lift effect */
  --shadow-hover: 0 8px 24px rgba(26, 26, 46, 0.12), 0 2px 6px rgba(26, 26, 46, 0.06);
}
```

### 6.2 Frosted Glass Effect

```css
.card-frosted {
  background: var(--surface-frosted);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-md);
}
```

### Elevation Rules

- **Resting cards on page**: `--shadow-md`
- **Cards on hover**: transition to `--shadow-hover` with slight `translateY(-2px)`
- **Modals/overlays**: `--shadow-xl` + frosted glass backdrop
- **Dropdowns/popovers**: `--shadow-lg`
- **Sidebar**: `--shadow-sm` or border-right only
- **NEVER use harsh/dark shadows** — keep everything soft and warm-toned

---

## 7. Component Patterns

### 7.1 Standard Card (Soft Floating)

The workhorse component. Used for dashboard widgets, feature items, list items.

```css
.card {
  background: var(--surface-solid);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(26, 26, 46, 0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
```

**Card anatomy** (top to bottom):
1. **Icon badge** (top-left) — colored background circle/square with icon
2. **Title** — `--text-h3` weight 600
3. **Description** — `--text-body-sm` in `--text-secondary` color
4. **Footer/metadata** — `--text-caption` with chips or action links

### 7.2 Frosted Glass Card

Used for overlays, floating panels, secondary information, or layered on top of colored/image backgrounds.

```css
.card-glass {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-md);
}
```

### 7.3 Colored Icon Badges

A core visual element — **every card or list item should have a colored icon badge** to add personality and aid scanning.

```css
/* Base badge shape */
.icon-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md); /* 12px — rounded square */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

/* Large badge variant (for feature cards) */
.icon-badge-lg {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg); /* 16px */
  font-size: 1.5rem;
}

/* Color variants — icon color + soft background */
.icon-badge-purple { background: var(--purple-soft); color: var(--purple-bold); }
.icon-badge-green  { background: var(--green-soft);  color: var(--green-bold);  }
.icon-badge-yellow { background: var(--yellow-soft); color: var(--yellow-bold); }
.icon-badge-blue   { background: var(--blue-soft);   color: var(--blue-bold);   }
.icon-badge-orange { background: var(--orange-soft); color: var(--orange-bold); }
.icon-badge-pink   { background: var(--pink-soft);   color: var(--pink-bold);   }
.icon-badge-teal   { background: var(--teal-soft);   color: var(--teal-bold);   }
```

**Icon badge rules:**
- Use **Lucide icons** or similar clean line-icon set (20-24px stroke icons)
- Each category/feature/section gets a **consistent accent color** throughout the app
- Badge shape is a **rounded square** by default; use circular for user avatars
- The icon inside should be the **bold** variant of the color; the background is the **soft** variant

### 7.4 Chips & Tags

Used for categories, filters, status indicators, and inline labels.

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-caption);     /* 12px */
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}

/* Soft filled variant (default) */
.chip-purple { background: var(--purple-soft); color: var(--purple-text); }
.chip-green  { background: var(--green-soft);  color: var(--green-text);  }
.chip-yellow { background: var(--yellow-soft); color: var(--yellow-text); }
.chip-blue   { background: var(--blue-soft);   color: var(--blue-text);   }
.chip-orange { background: var(--orange-soft); color: var(--orange-text); }
.chip-pink   { background: var(--pink-soft);   color: var(--pink-text);   }
.chip-teal   { background: var(--teal-soft);   color: var(--teal-text);   }

/* Outlined variant (for filter toggles) */
.chip-outlined {
  background: transparent;
  border: 1.5px solid var(--bg-tertiary);
  color: var(--text-secondary);
}
.chip-outlined.active {
  border-color: var(--blue-bold);
  background: var(--blue-soft);
  color: var(--blue-text);
}
```

**Chip rules:**
- Chips with icons should include a small (14px) icon before the text
- Filter chips should use the **outlined** variant; toggle to **filled** when active
- Status chips should use semantic colors (green=active, yellow=pending, red=error)

### 7.5 Buttons

```css
/* Primary button — bold, filled, inviting */
.btn-primary {
  background: var(--text-primary);       /* dark near-black */
  color: var(--bg-primary);              /* cream text */
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-primary);
  font-size: var(--text-body-sm);        /* 14px */
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

/* Secondary button — soft, outlined */
.btn-secondary {
  background: var(--surface-solid);
  color: var(--text-primary);
  border: 1.5px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-primary);
  font-size: var(--text-body-sm);
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-secondary:hover {
  border-color: var(--text-muted);
  background: var(--surface-hover);
}

/* Ghost button — minimal, text-only feel */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-body-sm);
  font-weight: 500;
  cursor: pointer;
}
.btn-ghost:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Color accent button (for special CTAs) */
.btn-accent {
  background: var(--green-bold);
  color: white;
  border: none;
  border-radius: var(--radius-full); /* pill shape */
  padding: var(--space-3) var(--space-6);
  font-weight: 600;
}
```

**Button rules:**
- Primary actions use **dark filled** buttons (not a bright color)
- Secondary actions use **outlined** buttons
- Destructive actions use `--color-error` background
- Pill-shaped buttons (`border-radius: full`) for CTAs and marketing sections
- Always include `transition` for smooth hover states
- Icon + text buttons: icon is 16-18px, with `--space-2` gap

### 7.6 Input Fields

```css
.input {
  background: var(--surface-solid);
  border: 1.5px solid var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-primary);
  font-size: var(--text-body);          /* 16px */
  color: var(--text-primary);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
}
.input::placeholder {
  color: var(--text-muted);
}
.input:focus {
  outline: none;
  border-color: var(--blue-bold);
  box-shadow: 0 0 0 3px var(--blue-soft);
}
```

---

## 8. Layout Patterns

### 8.1 Page Structure

```
┌─────────────────────────────────────────────┐
│  Top Nav Bar (64px height)                  │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Main Content Area               │
│ (260px)  │  (padding: --space-8)            │
│          │                                  │
│          │  ┌──────┐ ┌──────┐ ┌──────┐     │
│          │  │ Card │ │ Card │ │ Card │     │
│          │  └──────┘ └──────┘ └──────┘     │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### 8.2 Top Navigation Bar

```css
.navbar {
  height: 64px;
  background: var(--surface-solid);
  border-bottom: 1px solid var(--bg-tertiary);
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}
```

### 8.3 Sidebar Navigation (Desktop)

```css
.sidebar {
  width: 260px;
  height: calc(100vh - 64px);
  background: var(--surface-solid);
  border-right: 1px solid var(--bg-tertiary);
  padding: var(--space-4) var(--space-3);
  position: fixed;
  top: 64px;
  left: 0;
  overflow-y: auto;
}

/* Sidebar nav item */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.sidebar-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.sidebar-item.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
}

/* Collapsed sidebar (icon-only, 64px width) */
.sidebar-collapsed {
  width: 64px;
  padding: var(--space-4) var(--space-2);
}
```

### 8.4 Card Grid Layout

```css
/* Standard responsive grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
}

/* 2-column dashboard layout */
.card-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}

/* 3-column feature layout */
.card-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}
```

### 8.5 Responsive Breakpoints

```css
/* Mobile first approach */
--bp-sm: 640px;    /* Small phones → larger phones */
--bp-md: 768px;    /* Phones → tablets */
--bp-lg: 1024px;   /* Tablets → laptops (sidebar appears) */
--bp-xl: 1280px;   /* Laptops → desktops */
--bp-2xl: 1536px;  /* Large monitors */
```

**Responsive rules:**
- Below `--bp-lg`: Sidebar collapses to hamburger menu; use top nav only
- Below `--bp-md`: Card grid becomes single column
- At `--bp-lg` and above: Sidebar + top nav, 2-3 column grids
- Content max-width: `1200px` centered (or fluid when sidebar is present)

---

## 9. Animations & Transitions

### 9.1 Standard Transitions

```css
:root {
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
  --transition-spring: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 9.2 Common Animations

```css
/* Fade in on mount */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Staggered card entrance — apply with increasing delay */
.card-enter {
  animation: fadeIn 0.3s ease forwards;
  opacity: 0;
}

/* Subtle pulse for notifications/badges */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### Animation Rules

- **Cards** entering the viewport should fade in with a slight upward slide
- **Stagger** card animations by 50-80ms per item
- **Hover transitions** should be `--transition-fast` (150ms)
- **Page transitions** should be `--transition-slow` (300ms)
- **Never use bouncy animations** on data/dashboard elements — keep them smooth
- **Reduce motion**: Respect `prefers-reduced-motion` by disabling transforms/animations

---

## 10. Iconography

### 10.1 Icon Library

Use **Lucide React** (`lucide-react`) as the primary icon set. It has clean, consistent line icons that pair well with the rounded/friendly aesthetic.

### 10.2 Icon Sizing

| Context              | Size  | Stroke Width |
|----------------------|-------|-------------|
| Inside icon badges   | 20px  | 2px         |
| Inline with text     | 16px  | 2px         |
| Navigation items     | 20px  | 1.75px      |
| Large feature icons  | 24px  | 2px         |
| Small metadata icons | 14px  | 1.5px       |

### 10.3 Icon Color Rules

- Icons **inside badges** use the badge's bold color variant
- **Navigation icons** use `--text-secondary` (active: `--text-primary`)
- **Inline icons** next to text match the text color
- **NEVER use raw gray icons** in cards — always wrap in a colored badge

---

## 11. Dark Section / Contrast Block

For testimonial sections, hero areas, or emphasis blocks, use a dark inversion:

```css
.section-dark {
  background: var(--surface-dark);
  color: var(--text-on-dark);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
}

.section-dark h2 {
  color: var(--text-on-dark);
}

.section-dark p {
  color: var(--text-on-dark-muted);
}
```

---

## 12. Specific Patterns to Implement

### 12.1 Dashboard Stat Card

```
┌──────────────────────────┐
│  [🟣 icon badge]         │
│                          │
│  Total Users             │  ← --text-caption, uppercase
│  12,847                  │  ← --text-h1, bold
│  ↑ 12.5% from last week │  ← --text-caption, green
└──────────────────────────┘
```

### 12.2 Feature/Item Card (Evernote-style)

```
┌──────────────────────────┐
│  [🟢 icon badge]         │
│                          │
│  Notebooks & Spaces      │  ← --text-h3
│  Organize ideas where    │  ← --text-body-sm, secondary color
│  they belong             │
└──────────────────────────┘
```

### 12.3 List Item with Badge (Hugging Face-style)

```
┌──────────────────────────────────────────────┐
│  [🟡] Model Name Here          Tag   Tag     │
│       Description text · metadata · count    │
└──────────────────────────────────────────────┘
```

### 12.4 Filter Bar with Chips

```
┌──────────────────────────────────────────────┐
│  [All ✓] [Category A] [Category B] [More +] │
└──────────────────────────────────────────────┘
```
Active chip = filled with accent color. Inactive = outlined.

### 12.5 Preview Card with Colored Top Border (Streamlit-style)

```
┌──────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 4px gradient top border
│                          │
│  [screenshot/preview]    │
│                          │
│  Card Title              │
│  Description text        │
│  [avatar] Author · Link  │
└──────────────────────────┘
```

```css
.card-preview {
  border-top: 4px solid;
  border-image: linear-gradient(to right, var(--yellow-bold), var(--orange-bold), var(--pink-bold)) 1;
  /* OR use a single accent color per card */
}
```

---

## 13. Do's and Don'ts

### DO:
- ✅ Use warm cream (`--bg-primary`) as the default page background
- ✅ Give every card/list item a **colorful icon badge**
- ✅ Use generous padding and whitespace — let things breathe
- ✅ Keep border-radius large and rounded (minimum 12px on interactive elements)
- ✅ Use the **soft** color variants for backgrounds, **bold** for icons/accents
- ✅ Add subtle hover animations (lift + shadow change) on interactive cards
- ✅ Use frosted glass for overlays and layered panels
- ✅ Stagger animation entrance of card groups for a polished feel
- ✅ Use the full rainbow of accent colors to distinguish categories
- ✅ Keep text hierarchy clear: max 3 levels visible at once

### DON'T:
- ❌ Use pure white (#FFFFFF) as a page background — always cream/beige
- ❌ Use pure black (#000000) for text — use `--text-primary`
- ❌ Use sharp corners (0 border-radius) on any element
- ❌ Use harsh dark box-shadows
- ❌ Place cards directly on white without shadow — they'll disappear
- ❌ Mix too many font families — stick to the primary + monospace only
- ❌ Use more than 2 accent colors in a single card
- ❌ Skip the icon badge on cards — they're a core part of the visual identity
- ❌ Use generic gray icons without a colored badge wrapper
- ❌ Create dense, cluttered layouts — always prefer space over compression

---

## 14. Dark Mode

Dark mode preserves the **warm, friendly personality** of the light theme — it should feel like a cozy room at night, not a cold terminal. The key principle: **warm darks, not cold blacks.**

### 14.1 Theme Switching Implementation

Use a `data-theme` attribute on `<html>` and the CSS custom property override pattern. This lets every component automatically adapt without any class changes.

```css
/* Theme is controlled via attribute on <html> */
/* <html data-theme="light"> or <html data-theme="dark"> */

/* Respect system preference as default */
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) {
    /* Apply dark mode variables (same as [data-theme="dark"]) */
  }
}
```

```js
// Toggle theme in JS
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// On page load — respect saved preference, then system preference
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
```

### 14.2 Dark Mode Background Palette

The dark backgrounds use **warm charcoal tones** with a subtle purple/blue undertone that echoes the light theme's warmth. Never use pure black (#000000).

```css
[data-theme="dark"] {
  /* Primary canvas — warm dark charcoal, NOT cold gray or pure black */
  --bg-primary: #13131D;          /* deepest background — page canvas */
  --bg-secondary: #1A1A28;       /* slightly elevated — alternate sections, sidebar */
  --bg-tertiary: #262636;        /* borders, dividers, inset wells */

  /* Surface colors — cards and elevated elements */
  --surface-solid: #1E1E2D;              /* card background */
  --surface-frosted: rgba(30, 30, 46, 0.72); /* frosted glass on dark */
  --surface-hover: #24243A;              /* hover state */
  --surface-active: #2A2A42;             /* pressed/active state */

  /* "Light section" inversion — for emphasis blocks that flip to light */
  --surface-dark: #F7F4EF;               /* becomes the light cream */
  --surface-dark-secondary: #F0EDE8;
}
```

**Why these specific colors?**
- `#13131D` has an R:19, G:19, B:29 ratio — the blue channel is slightly higher, giving warmth without feeling cold
- Cards at `#1E1E2D` create just enough contrast against the page background to be visible without needing heavy shadows
- The palette avoids the common mistake of "gray dark mode" which feels lifeless

### 14.3 Dark Mode Text Colors

Text colors flip to light variants. The primary text is warm off-white (not pure white, which causes eye strain).

```css
[data-theme="dark"] {
  --text-primary: #EDEAE5;        /* warm off-white — headings and body */
  --text-secondary: #9B9BAF;      /* medium lavender-gray — descriptions */
  --text-muted: #5E5E72;          /* dim — timestamps, metadata, placeholders */
  --text-on-dark: #1A1A2E;        /* for inverted/light sections */
  --text-on-dark-muted: #5F6577;  /* muted text on inverted light sections */
}
```

### 14.4 Dark Mode Accent Colors

The **bold** accent colors stay the same or get slightly brighter for visibility. The **soft** backgrounds become deeply tinted transparent overlays. The **text** variants lighten for readability on dark surfaces.

```css
[data-theme="dark"] {
  /* Purple */
  --purple-bold: #A78BFA;                    /* slightly brighter */
  --purple-soft: rgba(139, 92, 246, 0.15);   /* translucent tint */
  --purple-ring: rgba(139, 92, 246, 0.30);
  --purple-text: #C4B5FD;                    /* light for readability */

  /* Green */
  --green-bold: #34D399;
  --green-soft: rgba(34, 197, 94, 0.15);
  --green-ring: rgba(34, 197, 94, 0.30);
  --green-text: #86EFAC;

  /* Yellow/Gold */
  --yellow-bold: #FACC15;
  --yellow-soft: rgba(234, 179, 8, 0.15);
  --yellow-ring: rgba(234, 179, 8, 0.30);
  --yellow-text: #FDE68A;

  /* Blue */
  --blue-bold: #60A5FA;
  --blue-soft: rgba(59, 130, 246, 0.15);
  --blue-ring: rgba(59, 130, 246, 0.30);
  --blue-text: #93C5FD;

  /* Orange */
  --orange-bold: #FB923C;
  --orange-soft: rgba(249, 115, 22, 0.15);
  --orange-ring: rgba(249, 115, 22, 0.30);
  --orange-text: #FDBA74;

  /* Pink/Rose */
  --pink-bold: #F472B6;
  --pink-soft: rgba(236, 72, 153, 0.15);
  --pink-ring: rgba(236, 72, 153, 0.30);
  --pink-text: #F9A8D4;

  /* Teal */
  --teal-bold: #2DD4BF;
  --teal-soft: rgba(20, 184, 166, 0.15);
  --teal-ring: rgba(20, 184, 166, 0.30);
  --teal-text: #5EEAD4;
}
```

**Why translucent soft backgrounds?** Using `rgba()` instead of opaque hex values means the badge/chip backgrounds naturally blend with whatever surface they're on — whether that's a card, a sidebar, or a frosted panel. This eliminates the common dark mode problem of "floating color patches" that don't integrate with their container.

### 14.5 Dark Mode Semantic Colors

```css
[data-theme="dark"] {
  --color-success: #34D399;
  --color-warning: #FACC15;
  --color-error: #F87171;
  --color-error-soft: rgba(239, 68, 68, 0.15);
  --color-info: #60A5FA;
}
```

### 14.6 Dark Mode Shadows & Elevation

Shadows are nearly invisible on dark backgrounds. In dark mode, **borders and subtle luminosity** replace shadows as the primary elevation cues.

```css
[data-theme="dark"] {
  /* Shadows use deeper opacity + slight dark glow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.20);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.30), 0 2px 4px rgba(0, 0, 0, 0.20);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.40), 0 2px 8px rgba(0, 0, 0, 0.25);
  --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.20);
}
```

### 14.7 Dark Mode Component Adjustments

These are the key component-level changes that go beyond simple variable remapping.

#### Cards — Add border for visibility

```css
[data-theme="dark"] .card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  /* Shadow is still applied via --shadow-md, but border does the heavy lifting */
}

[data-theme="dark"] .card:hover {
  border-color: rgba(255, 255, 255, 0.10);
}
```

#### Frosted Glass — Inverted glass treatment

```css
[data-theme="dark"] .card-glass {
  background: rgba(30, 30, 46, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

#### Navbar & Sidebar — Subtle top-edge highlight

```css
[data-theme="dark"] .navbar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}
```

#### Buttons — Primary inverts to cream-on-dark

```css
[data-theme="dark"] .btn-primary {
  background: var(--text-primary);  /* warm off-white (#EDEAE5) */
  color: #13131D;                   /* dark background color */
}

[data-theme="dark"] .btn-secondary {
  background: var(--surface-solid);
  border-color: rgba(255, 255, 255, 0.10);
  color: var(--text-primary);
}
[data-theme="dark"] .btn-secondary:hover {
  border-color: rgba(255, 255, 255, 0.18);
  background: var(--surface-hover);
}

[data-theme="dark"] .btn-ghost:hover {
  background: var(--surface-hover);
}
```

#### Inputs — Darker well with glowing focus

```css
[data-theme="dark"] .input {
  background: var(--bg-primary);          /* sunken into the page */
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}
[data-theme="dark"] .input:focus {
  border-color: var(--blue-bold);
  box-shadow: 0 0 0 3px var(--blue-soft); /* translucent blue glow */
}
[data-theme="dark"] .input::placeholder {
  color: var(--text-muted);
}
```

#### Chips — Use translucent backgrounds

```css
/* Already handled by the accent color soft variants being rgba() in dark mode */
/* No additional component-level overrides needed for chips */
```

#### Preview Cards — Colored top border stays vibrant

```css
/* The gradient top border on preview cards stays the same in dark mode */
/* because accent bold colors are already optimized for dark backgrounds */
```

#### Scrollbar Styling (Optional)

```css
[data-theme="dark"] {
  scrollbar-color: var(--bg-tertiary) transparent;
}
[data-theme="dark"] ::-webkit-scrollbar {
  width: 8px;
}
[data-theme="dark"] ::-webkit-scrollbar-track {
  background: transparent;
}
[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
}
```

### 14.8 Theme Toggle Component

Include a toggle in the navbar for user control. Recommended design:

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]    Dashboard  Projects  Analytics    [☀/🌙] [Avatar]│
└─────────────────────────────────────────────────────────────┘
```

```css
.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--surface-hover);
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s ease, transform 0.15s ease;
}
.theme-toggle:hover {
  background: var(--bg-tertiary);
  transform: scale(1.05);
}

[data-theme="dark"] .theme-toggle {
  border-color: rgba(255, 255, 255, 0.08);
}
```

### 14.9 Dark Mode Animation: Theme Transition

Add a smooth transition when switching themes to avoid a jarring flash.

```css
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Apply transition to all theme-aware surfaces */
html, body, .navbar, .sidebar, .card, .card-glass,
.btn-primary, .btn-secondary, .input, .chip {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
```

### 14.10 Dark Mode Do's and Don'ts

#### DO:
- ✅ Use `#13131D` (warm charcoal) as the darkest background — never pure black
- ✅ Use warm off-white `#EDEAE5` for primary text — never pure white `#FFFFFF`
- ✅ Use translucent `rgba()` for accent soft backgrounds so they blend with any surface
- ✅ Replace shadow-based elevation with subtle borders (`rgba(255,255,255,0.06)`)
- ✅ Keep accent **bold** colors slightly brighter than in light mode for legibility
- ✅ Add a smooth 300ms transition when toggling themes
- ✅ Test icon badges on dark surfaces — they should still "pop" with their colored backgrounds
- ✅ Respect `prefers-color-scheme` as the default, with user override saved in localStorage
- ✅ Keep frosted glass looking frosted — increase blur to 20px in dark mode
- ✅ Maintain the same border-radius, spacing, and typography — only colors change

#### DON'T:
- ❌ Use pure black (`#000000`) anywhere — it creates too much contrast and feels harsh
- ❌ Use pure white (`#FFFFFF`) for text — it causes eye strain on dark backgrounds
- ❌ Use opaque hex values for accent soft backgrounds — they'll look like floating colored boxes
- ❌ Keep the same light-mode shadows — they're invisible on dark; use borders instead
- ❌ Desaturate accent colors too much — the rainbow personality should stay vibrant
- ❌ Forget to update the frosted glass — `rgba(255,255,255,0.65)` becomes a white blob in dark mode
- ❌ Use a different font, spacing scale, or border-radius — the layout stays identical
- ❌ Make the "dark section" (Section 11) still dark — it should **invert** to the light cream palette
- ❌ Skip the theme transition animation — instant color changes feel broken

### 14.11 Color Contrast Reference

Minimum contrast ratios for WCAG AA compliance on dark backgrounds:

| Element            | Foreground        | Background    | Contrast Ratio | Status |
|--------------------|-------------------|---------------|----------------|--------|
| Primary text       | #EDEAE5           | #1E1E2D       | 12.8:1         | ✅ AAA |
| Secondary text     | #9B9BAF           | #1E1E2D       | 5.2:1          | ✅ AA  |
| Muted text         | #5E5E72           | #1E1E2D       | 2.7:1          | ⚠️ Decorative only |
| Purple bold on soft| #A78BFA           | rgba bg       | 7.1:1          | ✅ AA  |
| Green bold on soft | #34D399           | rgba bg       | 8.3:1          | ✅ AAA |
| Primary text on bg | #EDEAE5           | #13131D       | 14.6:1         | ✅ AAA |

> **Note:** Muted text (`--text-muted`) is intentionally below AA contrast — it should only be used for non-essential decorative metadata (timestamps, counts, divider dots). Never use it for actionable content.

---

## 15. Quick Reference: CSS Custom Properties (Copy-Paste)

```css
:root {
  /* Backgrounds */
  --bg-primary: #F7F4EF;
  --bg-secondary: #F0EDE8;
  --bg-tertiary: #E8E4DE;
  --surface-solid: #FFFFFF;
  --surface-frosted: rgba(255, 255, 255, 0.65);
  --surface-hover: #FAFAF8;
  --surface-active: #F5F3F0;
  --surface-dark: #1A1A2E;
  --surface-dark-secondary: #2D2D44;

  /* Text */
  --text-primary: #1A1A2E;
  --text-secondary: #5F6577;
  --text-muted: #9CA3AF;
  --text-on-dark: #F7F4EF;
  --text-on-dark-muted: #B8B5AE;

  /* Accent: Purple */
  --purple-bold: #8B5CF6;  --purple-soft: #EDE9FE;  --purple-ring: #C4B5FD;  --purple-text: #6D28D9;
  /* Accent: Green */
  --green-bold: #22C55E;   --green-soft: #DCFCE7;   --green-ring: #86EFAC;   --green-text: #15803D;
  /* Accent: Yellow */
  --yellow-bold: #EAB308;  --yellow-soft: #FEF9C3;  --yellow-ring: #FCD34D;  --yellow-text: #A16207;
  /* Accent: Blue */
  --blue-bold: #3B82F6;    --blue-soft: #DBEAFE;    --blue-ring: #93C5FD;    --blue-text: #1D4ED8;
  /* Accent: Orange */
  --orange-bold: #F97316;  --orange-soft: #FFEDD5;  --orange-ring: #FDBA74;  --orange-text: #C2410C;
  /* Accent: Pink */
  --pink-bold: #EC4899;    --pink-soft: #FCE7F3;    --pink-ring: #F9A8D4;    --pink-text: #BE185D;
  /* Accent: Teal */
  --teal-bold: #14B8A6;    --teal-soft: #CCFBF1;    --teal-ring: #5EEAD4;    --teal-text: #0F766E;

  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-error: #EF4444;
  --color-error-soft: #FEE2E2;
  --color-info: #3B82F6;

  /* Typography */
  --font-primary: 'Plus Jakarta Sans', 'Nunito', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

  /* Spacing */
  --space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
  --space-4: 1rem;     --space-5: 1.25rem;   --space-6: 1.5rem;
  --space-8: 2rem;     --space-10: 2.5rem;   --space-12: 3rem;
  --space-16: 4rem;    --space-20: 5rem;

  /* Radii */
  --radius-sm: 8px;    --radius-md: 12px;    --radius-lg: 16px;
  --radius-xl: 20px;   --radius-2xl: 24px;   --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(26,26,46,0.04);
  --shadow-md: 0 2px 8px rgba(26,26,46,0.06), 0 1px 2px rgba(26,26,46,0.04);
  --shadow-lg: 0 4px 16px rgba(26,26,46,0.08), 0 2px 4px rgba(26,26,46,0.04);
  --shadow-xl: 0 8px 32px rgba(26,26,46,0.10), 0 2px 8px rgba(26,26,46,0.05);
  --shadow-hover: 0 8px 24px rgba(26,26,46,0.12), 0 2px 6px rgba(26,26,46,0.06);

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
  --transition-spring: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ============================================
   DARK MODE OVERRIDES
   ============================================ */
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #13131D;
  --bg-secondary: #1A1A28;
  --bg-tertiary: #262636;
  --surface-solid: #1E1E2D;
  --surface-frosted: rgba(30, 30, 46, 0.72);
  --surface-hover: #24243A;
  --surface-active: #2A2A42;
  --surface-dark: #F7F4EF;
  --surface-dark-secondary: #F0EDE8;

  /* Text */
  --text-primary: #EDEAE5;
  --text-secondary: #9B9BAF;
  --text-muted: #5E5E72;
  --text-on-dark: #1A1A2E;
  --text-on-dark-muted: #5F6577;

  /* Accent: Purple */
  --purple-bold: #A78BFA;  --purple-soft: rgba(139,92,246,0.15);
  --purple-ring: rgba(139,92,246,0.30);  --purple-text: #C4B5FD;
  /* Accent: Green */
  --green-bold: #34D399;   --green-soft: rgba(34,197,94,0.15);
  --green-ring: rgba(34,197,94,0.30);    --green-text: #86EFAC;
  /* Accent: Yellow */
  --yellow-bold: #FACC15;  --yellow-soft: rgba(234,179,8,0.15);
  --yellow-ring: rgba(234,179,8,0.30);   --yellow-text: #FDE68A;
  /* Accent: Blue */
  --blue-bold: #60A5FA;    --blue-soft: rgba(59,130,246,0.15);
  --blue-ring: rgba(59,130,246,0.30);    --blue-text: #93C5FD;
  /* Accent: Orange */
  --orange-bold: #FB923C;  --orange-soft: rgba(249,115,22,0.15);
  --orange-ring: rgba(249,115,22,0.30);  --orange-text: #FDBA74;
  /* Accent: Pink */
  --pink-bold: #F472B6;    --pink-soft: rgba(236,72,153,0.15);
  --pink-ring: rgba(236,72,153,0.30);    --pink-text: #F9A8D4;
  /* Accent: Teal */
  --teal-bold: #2DD4BF;    --teal-soft: rgba(20,184,166,0.15);
  --teal-ring: rgba(20,184,166,0.30);    --teal-text: #5EEAD4;

  /* Semantic */
  --color-success: #34D399;
  --color-warning: #FACC15;
  --color-error: #F87171;
  --color-error-soft: rgba(239,68,68,0.15);
  --color-info: #60A5FA;

  /* Shadows (deeper for dark mode) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.20);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.30), 0 2px 4px rgba(0,0,0,0.20);
  --shadow-xl: 0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.25);
  --shadow-hover: 0 8px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.20);
}
```
