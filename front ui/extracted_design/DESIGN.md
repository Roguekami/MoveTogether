---
name: Ethereal Academic
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#4a4455'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#674bb5'
  on-secondary: '#ffffff'
  secondary-container: '#ab8ffe'
  on-secondary-container: '#3f1e8c'
  tertiary: '#7d3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a15100'
  on-tertiary-container: '#ffe0cd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#21005e'
  on-secondary-fixed-variant: '#4f319c'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb784'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  gutter: 16px
---

## Brand & Style
The brand personality is centered on creating a digital "sanctuary" for students—a calm, focused environment that reduces cognitive load in a chaotic academic life. The design style combines **Minimalism** with refined **Glassmorphism** to achieve a premium, airy feel. 

The UI prioritizes generous whitespace and a "breathable" layout to instill a sense of trust and modernity. Visual depth is achieved through translucent layers rather than heavy borders, ensuring the mobile-first experience feels expansive even on smaller screens.

## Colors
The palette is built on a foundation of Light Lavender and Off-White to create a soft, non-clinical background. The **Primary Purple (#7C3AED)** serves as the main interactive accent, often applied as a soft linear gradient (moving from #7C3AED to #A78BFA) to add dimension without visual noise.

- **Background:** #F8F7FF (The base "sanctuary" canvas)
- **Surface:** #FFFFFF (Pure white for elevated cards)
- **Primary Text:** #1F2937 (Deep charcoal for high readability)
- **Secondary Text:** #6B7280 (Muted gray for metadata and hints)

## Typography
This design system utilizes **Inter** exclusively to maintain a systematic, utilitarian, yet modern aesthetic. The typographic scale is optimized for mobile readability, using tight tracking on larger headlines and generous leading (line-height) for body text to maintain the "airy" feel. Bold weights are reserved for hierarchy and primary navigation anchors, while medium weights are used for interactive labels to ensure clarity.

## Layout & Spacing
The layout follows a **fluid grid** model tailored for mobile viewports, utilizing a standard 4-column system for small devices and scaling to 12 columns for desktop. 

A "Safe Margin" of 20px is maintained on the edges of the screen to prevent content from feeling cramped. Vertical rhythm is established using a 4px baseline, with standard component spacing set at 16px (md) or 24px (lg) to reinforce the airy, spacious narrative.

## Elevation & Depth
Depth is conveyed through **Glassmorphism** and **Ambient Shadows**. 

- **Level 1 (Base):** Subtle 1px inner stroke (White, 50% opacity) on white cards to define edges against the lavender background.
- **Level 2 (Active Cards):** A very soft, diffused shadow (Hex #7C3AED at 8% opacity, 20px blur, 10px Y-offset) to create a floating effect.
- **Level 3 (Overlays):** Backdrop-filter: blur(12px) combined with a semi-transparent white fill (rgba(255, 255, 255, 0.7)) for modals and navigation bars. This maintains the "sanctuary" feel by keeping the background context visible but unobtrusive.

## Shapes
The shape language is defined by significant **Roundedness (Level 2)**. 

Primary containers and cards use a radius of **20px** to evoke a friendly, student-accessible vibe. Interactive elements like buttons and input fields use **12-16px** to maintain consistency with the card language. This lack of sharp corners contributes to the "soft" and "safe" emotional response desired for the platform.

## Components
- **Cards:** Pure white background, 20px border radius, subtle ambient shadow. Use a 1px border of #F3F4F6 for extra definition if needed.
- **Buttons:** Primary buttons use the Purple-to-Light-Purple gradient with white text. Secondary buttons are "Ghost" style with a 1px purple border or a soft lavender background.
- **Input Fields:** Soft grey fill (#F3F4F6) with no border in resting state, transitioning to a primary purple border on focus. Large 16px border radius.
- **Chips:** Used for university categories or tags. Pill-shaped with a light lavender fill (#EDE9FE) and primary purple text.
- **Glass Navigation:** Bottom tab bars should use the 12px backdrop blur effect to ensure content "flows" behind the navigation, reinforcing the mobile-first philosophy.
- **Status Indicators:** Small, circular dots for "active" status, using a soft emerald green to contrast with the purple theme.