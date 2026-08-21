---
name: impeccable
description: >-
  Expert frontend design, UI craftsmanship, and anti-AI-slop guidance. Use whenever designing,
  refining, polishing, auditing, or styling web interfaces to ensure human-crafted aesthetics,
  deliberate typography, balanced spacing, intentional color palettes, and high-fidelity UX.
---

# Impeccable Design & UI Craftsmanship Skill

Impeccable is a design discipline and rail system for AI coding agents. It prevents generic, template-driven "AI slop" and enforces high-craft, intentional, production-grade frontend engineering.

---

## 1. Core Principles

1. **Avoid AI Slop & Generic Tropes**:
   - Never default to generic purple-to-blue gradients or neon cyan accents.
   - Never nest cards within cards or create redundant boxed containers.
   - Never use low-contrast, microscopic gray text on dark backgrounds.
   - Never use generic placeholder icons without semantic meaning.
   - Never write robotic, AI-sounding copy (e.g., "SYSTEM READY", "launch the interactive map engine", "leverage").

2. **Typography Discipline**:
   - Establish a strict 3-tier hierarchy:
     - **Display / Headings**: High-character fonts (e.g., Syne, serif, or distinctive grotesk).
     - **Body / Narrative**: Clean, readable sans-serif with comfortable line height (1.45 to 1.6).
     - **Telemetry / Badges / Numbers**: Crisp monospace (e.g., Space Mono, JetBrains Mono) with tabular numerals.
   - Maintain proportional scale with fluid clamp sizing.

3. **Color & Surface Hierarchy**:
   - Build deliberate palettes with strict role separation:
     - Deep obsidian / ink surface layers (e.g. `rgba(14, 16, 22, 0.85)`).
     - Subtle hairline borders (e.g. `rgba(255, 255, 255, 0.08)`).
     - Warm metallic or primary accents (e.g., brass gold, vermillion, emerald).
     - Clear text contrast tiers (Paper High Contrast > Paper Muted > Paper Faint).

4. **Spatial Balance & Rhythm**:
   - Use consistent 4px / 8px spacing scales.
   - Embrace intentional white space and breathing room.
   - Ensure cards and components never get cut off at standard viewport heights (768px - 1080px).

---

## 2. Design Vocabulary & Actions

When working on UI tasks, activate the appropriate design mode:

- **polish**: Refine margins, optical alignment, border-radius continuity, hover states, and smooth transitions.
- **bolder**: Increase typographic contrast, strengthen key visual focal points, and emphasize primary actions.
- **quieter**: Strip unnecessary borders, remove visual clutter, reduce background contrast, and increase breathing room.
- **distill**: Simplify complex data matrices or dense card layouts into their essential, elegant core.
- **audit**: Inspect layout for accessibility (WCAG AA contrast), responsive scaling across 360px to 2560px, and keyboard focus states.
- **craft**: Design and build components from scratch with bespoke detailing and thoughtful micro-interactions.

---

## 3. Implementation Checklist

Before completing any frontend or UI change:
- [ ] Are all fonts rendered using the project font tokens rather than system defaults?
- [ ] Is there adequate contrast between text and background surfaces?
- [ ] Are interactive elements equipped with tactile hover, focus-visible, and active states?
- [ ] Is the copy authentic, human, and free of AI marketing jargon?
- [ ] Does the layout scale gracefully without horizontal scrollbars or cramped elements?
- [ ] Are all formatting rules respected (no emojis, no long hyphens)?
