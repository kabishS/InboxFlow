---
name: Inbox Flow
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#4c5e83'
  on-secondary: '#ffffff'
  secondary-container: '#bfd2fd'
  on-secondary-container: '#475a7e'
  tertiary: '#004b59'
  on-tertiary: '#ffffff'
  tertiary-container: '#006477'
  on-tertiary-container: '#76e2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d7e2ff'
  secondary-fixed-dim: '#b4c7f1'
  on-secondary-fixed: '#041b3c'
  on-secondary-fixed-variant: '#34476a'
  tertiary-fixed: '#afecff'
  tertiary-fixed-dim: '#48d7f9'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#004e5d'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
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
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-mobile: 16px
  container-padding-desktop: 32px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is rooted in **Corporate Modernism** with a heavy emphasis on **Minimalism**. It is engineered for a high-utility SaaS environment where the AI-powered "Inbox Flow" serves as a calm, intelligent layer over the chaos of email. 

The aesthetic prioritizes clarity and precision. It uses expansive whitespace to reduce cognitive load and a disciplined color application to guide the user's attention toward AI-generated insights and high-priority actions. The emotional response should be one of "effortless control"—professional, reliable, and technologically advanced without being flashy.

## Colors
This design system utilizes a high-contrast functional palette. 
- **Primary Blue** is used strictly for primary actions and active states.
- **Surface & Background**: A subtle distinction between `#FFFFFF` (Surface) and `#FAFBFC` (App Background) is used to create structural depth without relying on heavy borders.
- **Typography**: `#172B4D` provides an accessible, high-contrast reading experience essential for long-form email content.
- **Status Colors**: These are used for "Priority Tokens" and "Sentiment Indicators." Use these colors at low-saturation for background fills and full-saturation for text/icons to ensure readability.

## Typography
The system uses **Inter** exclusively to maintain a systematic and utilitarian feel. 
- **Hierarchy**: Use `Headline-XL` and `LG` sparingly for dashboard overviews. 
- **Content**: The `Body-MD` (14px) is the workhorse for email lists and interface labels, while `Body-LG` (16px) is reserved for the actual email body reading experience to maximize legibility.
- **AI-Labels**: Use `Label-MD` in All Caps for AI-generated status tags to distinguish them from user-generated content.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid grid**. 
- **Navigation**: A fixed 240px left sidebar for primary navigation.
- **Content Area**: A fluid central column for the inbox list, and a secondary fixed 400px panel for AI insights or email detail viewing.
- **Rhythm**: All spacing must be multiples of 4px. Use `stack-md` (16px) as the default gap between cards and list items. 
- **Desktop**: 12-column grid within the fluid areas.
- **Mobile**: Single column with 16px horizontal margins.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. 
- **Level 0 (Base)**: `#FAFBFC` background.
- **Level 1 (Cards/Sidebar)**: `#FFFFFF` surface with a subtle 1px border of `#EBECF0` or a very soft shadow (0px 2px 4px rgba(9, 30, 66, 0.08)).
- **Level 2 (Modals/Dropdowns)**: Elevated white surface with a more pronounced shadow (0px 8px 16px rgba(9, 30, 66, 0.12)).
- **AI Focus**: Elements generated by AI should use a subtle Light Blue (`#DEEBFF`) background tint to visually separate them from manual data.

## Shapes
The design system uses **Rounded (8px)** corners as the standard. This strikes a balance between the precision of a professional tool and the approachability of a modern AI assistant. 
- **Small Components**: Checkboxes and small tags use 4px (`rounded-sm`).
- **Standard Components**: Buttons, cards, and input fields use 8px (`rounded-md`).
- **Interactive Containers**: Floating Action Buttons or active state indicators may use 12px or pill-shapes for higher contrast.

## Components
- **Buttons**: 
    - *Primary*: Solid `#0052CC`, white text, 8px radius. 
    - *Secondary*: Transparent background, `#0052CC` text, 1px border. 
- **Priority Chips**: Small badges with 4px radius. Use 10% opacity of the status color for the background and 100% opacity for the text.
- **Input Fields**: 8px radius, `#FAFBFC` background, and a 2px `#0052CC` border on focus.
- **Email Cards**: White background, 8px radius, subtle border. On hover, increase the shadow slightly to indicate interactivity.
- **AI Suggestion Box**: Use a thin gradient border (Primary Blue to Info Blue) to denote "Intelligence" layers within the UI.
- **Progressive Disclosure**: Use collapsible accordions for "Technical Details" to keep the main view clean and productivity-focused.