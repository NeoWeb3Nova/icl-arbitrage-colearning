---
name: ARBITRAGE//SCAN
description: Evidence-first arbitrage research interface for readable, reviewable opportunity analysis.
colors:
  terminal-black: "#050505"
  surface: "#101012"
  surface-raised: "#17171a"
  surface-contrast: "#202024"
  border: "#2a2a2e"
  editorial-magenta: "#ff2ea6"
  editorial-magenta-strong: "#ff5cbe"
  signal-cyan: "#00e6e6"
  signal-positive: "#00e88a"
  signal-warning: "#ffb020"
  signal-negative: "#ff4d5e"
  text-primary: "#f4f4f5"
  text-muted: "#a1a1aa"
  focus-cyan: "#67e8f9"
typography:
  display:
    fontFamily: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace'
    fontSize: "clamp(25px, 4vw, 42px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace'
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'ui-monospace, "SFMono-Regular", "JetBrains Mono", "Fira Code", Menlo, Consolas, monospace'
    fontSize: "10px"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.08em"
    fontFeature: "normal"
rounded:
  none: "0"
  subtle: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.editorial-magenta}"
    textColor: "{colors.terminal-black}"
    rounded: "{rounded.none}"
    padding: "10px 15px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.editorial-magenta-strong}"
    textColor: "{colors.terminal-black}"
    rounded: "{rounded.none}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.none}"
    padding: "6px 8px"
    height: "40px"
  input:
    backgroundColor: "{colors.terminal-black}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "40px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "20px"
  chip-signal:
    backgroundColor: "rgba(255,46,166,.08)"
    textColor: "{colors.editorial-magenta}"
    rounded: "{rounded.none}"
    padding: "6px 8px"

# Design System: ARBITRAGE//SCAN

## Overview

**Creative North Star: "The Lab Notebook"**

ARBITRAGE//SCAN is a dark, evidence-first research instrument. It should feel like an active lab notebook translated into a field console: dense enough for comparison, restrained enough that the evidence remains readable, and explicit enough that a visitor can tell simulated, read-only, and negative states apart.

The interface is intentionally not a marketing page or a promise of profit. Its visual tension comes from a mostly quiet terminal-black canvas with sparse magenta and cyan signals. The system uses hard edges, compact uppercase labels, and tonal layering instead of decorative effects.

**Key Characteristics:**
- Evidence-first, not conversion-first.
- Flat surfaces with borders and tonal layers instead of shadows.
- Editorial Magenta marks action, selection, and research identity.
- Signal Cyan marks measured data and secondary emphasis.
- Read-only, simulated, warning, and negative states remain visibly explicit.

## Colors

The palette is a restrained terminal field with two signal colors: Editorial Magenta for action and identity, Signal Cyan for measured data. Green, amber, and red are reserved for semantic status.

### Primary
- **Editorial Magenta** (`#ff2ea6`): Primary action, active navigation, selected workflow state, and research identity.
- **Editorial Magenta Strong** (`#ff5cbe`): Hover response for magenta actions; do not use as a resting accent.

### Secondary
- **Signal Cyan** (`#00e6e6`): Numeric spread and measured market-data emphasis.

### Tertiary
- **Signal Positive** (`#00e88a`): Positive or successful state only.
- **Signal Warning** (`#ffb020`): Warning, simulated-data, or rejected-opportunity context.
- **Signal Negative** (`#ff4d5e`): Error, negative outcome, or failed state.

### Neutral
- **Terminal Black** (`#050505`): Page canvas and input backgrounds.
- **Surface** (`#101012`): Main panels, cards, headers, and widget shell.
- **Surface Raised** (`#17171a`): Nested panels, hover surfaces, and metric cells.
- **Surface Contrast** (`#202024`): Hovered form controls and deeper nested interaction surfaces.
- **Border** (`#2a2a2e`): Structural dividers and component boundaries.
- **Primary Text** (`#f4f4f5`): Main headings, values, and high-priority content.
- **Muted Text** (`#a1a1aa`): Supporting copy, labels, metadata, and secondary evidence.
- **Focus Cyan** (`#67e8f9`): Keyboard focus ring; it must remain visible against all dark surfaces.

### Named Rules

**The Two-Signal Rule.** Magenta is for action and selection; cyan is for measured data. Do not use either as general decoration.

**The Evidence Boundary Rule.** Simulated data, read-only research, warnings, and negative outcomes must retain explicit text labels in addition to color.

## Typography

**Display Font:** System monospace stack (`ui-monospace`, SFMono-Regular, JetBrains Mono, Fira Code, Menlo, Consolas).

**Body Font:** The same monospace stack, keeping research labels and data visually related.

**Label/Mono Font:** The same stack, with uppercase treatment and tracked labels for section metadata.

**Character:** Compact, technical, and legible. Typography is a tool for scanability rather than a branding display face.

### Hierarchy

- **Display** (700, `clamp(25px, 4vw, 42px)`, `1.05`): Scan and major section headings.
- **Headline** (700, `18px`, `1.2`): Site identity and compact panel titles.
- **Title** (700, `14–20px`, approximately `1.2–1.4`): Cards, workflow nodes, and inspector headings.
- **Body** (400, `13px`, `1.5–1.65`): Explanations, descriptions, and research notes.
- **Label** (800, `10–11px`, `0.08–0.18em`, uppercase): Navigation, state, evidence type, and metadata.

### Named Rules

**The Instrument Label Rule.** Uppercase tracked labels identify a section or state; they do not replace explanatory copy.

**The Readable Data Rule.** Values and evidence may be dense, but supporting prose stays readable and must not collapse into decorative microcopy.

## Layout

The application uses a centered content column capped at `1240px`, with `24px` horizontal padding on wide screens and `16px` on narrow screens. The sticky header spans the content edge and remains visually attached to the current research context.

Primary navigation is a full-width, bordered strip below the header. On narrow screens it becomes a horizontally scrollable row rather than wrapping into multiple ambiguous lines. Major research surfaces use grids: workflow plus inspector on wide screens, a single column with a static inspector on smaller screens, and one-column platform/resource cards on mobile.

The spacing rhythm is built from `4 / 8 / 12 / 16 / 20 / 24px` steps. Controls use at least `40px` height; primary mobile actions expand to the available width.

## Elevation & Depth

The system is flat by default. Depth comes from `#101012` → `#17171a` → `#202024` tonal layers and `1px` structural borders. Resting cards do not use shadows. Interaction is shown through border, background, focus-ring, or signal-color changes.

### Named Rules

**The Flat Instrument Rule.** Do not add ambient shadows, glass blur, or floating-card effects to ordinary panels. Use a border or tonal shift first.

## Shapes

The dominant silhouette is square and direct: panels, cards, buttons, inputs, navigation items, and status chips use `0px` radius. A small number of compact status elements may use a subtle `4px` radius only when the existing component requires it. Borders are thin and structural; no thick side rails are used as generic decoration.

## Components

### Buttons

- **Shape:** Square, direct, minimum `40px` height.
- **Primary:** Editorial Magenta background, Terminal Black text, compact uppercase label, `10px 15px` padding.
- **Hover / Focus:** Magenta Strong on hover; Focus Cyan `2px` outline with `3px` offset.
- **Secondary / Ghost:** Transparent background with Border stroke and Muted Text; magenta on hover.

### Chips

- **Style:** Flat, square signal labels with a thin border and low-opacity signal background.
- **State:** Magenta for selected/read-only identity, amber for simulated/warning, green/cyan/red for semantic states.

### Cards / Containers

- **Corner Style:** Square (`0px`).
- **Background:** Surface for primary panels; Surface Raised for nested areas and hover states.
- **Shadow Strategy:** None at rest; depth comes from tonal layers and borders.
- **Border:** `1px` Border color, with signal color reserved for selected or active states.
- **Internal Padding:** Usually `16–24px`; compact result rows use `16px`.

### Inputs / Fields

- **Style:** Terminal Black background, Border stroke, Primary Text, square corners, inherited monospace font.
- **Focus:** Editorial Magenta border plus visible Focus Cyan keyboard ring.
- **Error / Disabled:** Negative or Warning semantic color with explanatory text; disabled controls retain their layout and reduce opacity rather than disappearing.

### Navigation

- **Style:** Full-width dark bordered strip with uppercase tracked labels.
- **Default:** Muted Text on Surface.
- **Hover / Focus:** Editorial Magenta on Surface Raised with visible focus ring.
- **Active:** Terminal Black text on Editorial Magenta.
- **Mobile:** Horizontally scrollable, single-line navigation with touch-safe controls.

### LI.FI Widget Shell

- **Style:** The host iframe uses the same Surface background and square outer boundary. The Widget Light configuration uses the dark appearance, Surface/Surface Raised containers, Border dividers, monospace typography, and no edge navigation so the embedded tool belongs to the surrounding research console without pretending to be native DOM.

## Do's and Don'ts

### Do:

- **Do** make the evidence type and risk state visible in text, not only color.
- **Do** use Editorial Magenta for action/selection and Signal Cyan for measured data.
- **Do** preserve square geometry, thin borders, and flat tonal layering.
- **Do** keep mobile controls touch-safe and navigation single-line scrollable.
- **Do** keep LI.FI, Binance, Supabase, and simulated states inside the same research-tool vocabulary.
- **Do** show a visible Focus Cyan ring for keyboard users.

### Don't:

- **Don't** introduce gradients, ambient shadows, glassmorphism, or decorative blur as default surface treatment.
- **Don't** use monospace as a costume for unsupported marketing claims; reserve it for research UI and data.
- **Don't** use pink or cyan as generic decoration or status substitutes.
- **Don't** present simulated values, screen spreads, or read-only quotes as confirmed profit or completed transactions.
- **Don't** hide the “只读研究 · 不自动交易” boundary or simulated-data labels.
- **Don't** make future screens rounded-card collections that contradict the square research-console language.
