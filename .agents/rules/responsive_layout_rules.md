---
description: Layout and styling rules for maintaining perfect responsive scaling and aspect ratios across the Two Meridian web app.
---

# Responsive Layout & Scaling Rules for Two Meridian

To ensure the 3D map engine and DOM elements render identically across 16:9, 16:10, 21:9 Ultrawide, and low-res/high-DPI laptop screens, all future UI additions must follow these three golden rules:

## 1. Do Not Hardcode Fixed Pixel Widths/Sizes
Avoid using rigid pixel dimensions (`width: 500px`, `font-size: 60px`) for major structural elements or typography. 
- **Use `clamp()`**: For text and layout padding/margins, always use CSS `clamp()`. E.g., `font-size: clamp(1.4rem, 2vw, 1.85rem);`.
- **Use Viewport Units**: Use `vh` and `vw` for spacing that needs to scale dynamically with the screen.

## 2. Respect the Ultrawide Max-Width
On 21:9 or 32:9 monitors, full-bleed containers will stretch text until it becomes unreadable.
- **Rule**: Whenever adding a new full-width structural block (like a leaderboard or text section), wrap its inner content in a container with `max-width: 1480px; margin: 0 auto;`. This ensures it caps gracefully on massive monitors.

## 3. Text Wrapping
Do not use `white-space: nowrap` for headlines unless strictly necessary (it risks overlapping or clipping on snapped half-screen windows or 1366x768 screens). 
- **Rule**: Prefer modern CSS `text-wrap: balance` for display headlines to let the browser automatically balance the line breaks cleanly.

## 4. The 3D Camera is Mathematically Locked
The `GlobeAnimation.js` uses a mathematical FOV zoom lock for 16:10 screens, and a percentage-based lateral camera shift (`0.28 * visibleWidth`) for Ultrawide panning. 
- Do NOT hardcode fixed 3D spatial offsets (`camX = -1.25`) going forward; always derive position offsets relative to the dynamically calculated `visibleWidth` or `this.progress`.
