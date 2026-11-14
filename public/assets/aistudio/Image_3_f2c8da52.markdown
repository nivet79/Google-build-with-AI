---
name: Precision SaaS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  surface-light: '#F8FAFC'
  surface-card: '#FFFFFF'
  border-light: '#E2E8F0'
  surface-dark: '#0B0F19'
  surface-dark-card: '#111827'
  border-dark: '#1E293B'
  text-dark: '#F1F5F9'
  accent-sky: '#38BDF8'
  accent-rose: '#F43F5E'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers a modern utility SaaS aesthetic inspired by Linear, Raycast, and Notion. It prioritizes crisp borders, subtle elevation, generous whitespace, and zero clutter to create an environment optimized for focus, speed, and efficiency.

The personality is highly professional, technical, and precise, evoking confidence and deep trust through uncompromising clarity and keyboard-first ergonomics.

## Colors

The color palette is built for precision and long-duration screen time. Light mode relies on pristine off-white surfaces (`#F8FAFC`) paired with pure white cards (`#FFFFFF`) and slate borders (`#E2E8F0`). Dark mode shifts into a deep obsidian/slate environment (`#0B0F19` and `#111827`) with muted borders (`#1E293B`) and crisp off-white typography (`#F1F5F9`). 

Indigo and violet (`#4F46E5` / `#6366F1`) serve as the primary and secondary brand accents, driving high-priority actions and interactive states.

## Typography

Typography balances systemic readability with technical precision. Inter drives all primary UI controls, headings, and body copy, offering clean geometric neutral forms. JetBrains Mono is reserved for code blocks, keyboard shortcuts, metadata, and data-dense outputs. 

Maintain strict adherence to the defined scale. Letter spacing is subtly tightened on large headlines to enhance visual density.

## Layout & Spacing

This design system uses a fluid grid system paired with generous whitespace containers to prevent cognitive overload. Layouts scale responsively from dense multi-column desktop workspaces down to single-column mobile views. 

Spacing adheres to a strict 4px/8px baseline grid rhythm. Use `space-xs` and `space-sm` for tight UI element clustering, and `space-lg` to `space-xl` for section separation.

## Elevation & Depth

Depth is conveyed primarily through low-contrast outlines and ghost borders rather than heavy drop shadows. Surfaces rely on tonal layering (contrasting base background against pure white or dark-card containers) supplemented by hairline borders (`#E2E8F0` in light mode, `#1E293B` in dark mode). 

When shadows are required for floating elements like command palettes or popovers, use ultra-diffused, low-opacity shadow tints to maintain a weightless, high-performance feel.

## Shapes

The shape language is strictly controlled and restrained. UI elements feature a soft, refined roundedness (`0.25rem` base, up to `0.5rem` for larger containers) to avoid harsh geometric corners while preserving a crisp, engineered aesthetic. Avoid pill shapes or heavy circular containers except for explicit status dots or avatars.

## Components

### Buttons
Buttons feature crisp borders, subtle hover state fills, and clear typography. Primary actions use the indigo accent (`#4F46E5`) with high-contrast text, while secondary and ghost actions rely on subtle border outlines and background shifts.

### Chips & Badges
Compact, single-line elements using monospaced labels for tags, statuses, or keyboard shortcuts. They feature light tinted backgrounds and thin borders.

### Input Fields & Search Bars
Designed for rapid data entry. Inputs feature a solid card background, 1px structural borders, and instant focus rings using the primary indigo accent. Include inline icon placement for search and filtering.

### Lists & Tables
Data-dense yet airy. Rows utilize hairline bottom borders, generous vertical padding, and subtle hover highlights. Monospace fonts are encouraged for numerical data, IDs, and timestamps.

### Cards
Clean structural containers with 1px borders, zero heavy shadows, and ample internal padding. 

### Command Palettes
The cornerstone navigation component: centered floating panels featuring instant-search inputs, keyboard shortcut indicators (`label-sm`), and distinct sectional grouping.