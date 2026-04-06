# Design System Document

## 1. Overview & Creative North Star: "The Administrative Atelier"

This design system moves away from the sterile, modular "dashboard" look of legacy HR tools. Instead, it adopts the philosophy of **The Administrative Atelier**—a space that feels bespoke, curated, and calm. We achieve this by blending high-end editorial typography with a physical, layered approach to digital surfaces. 

The aesthetic is defined by **Intentional Asymmetry** and **Tonal Depth**. We reject the "boxed-in" feeling of traditional portals, opting for breathing room and soft transitions that guide the eye rather than forcing it through rigid grids. By using sophisticated glassmorphism and eliminating harsh borders, we create an HR experience that feels more like a premium workspace and less like a database.

---

## 2. Colors & Surface Philosophy

The palette is anchored in deep professional navies and crisp, cool grays, punctuated by high-chroma accents for specific HR status logic.

### Surface Hierarchy & Nesting
To achieve a "premium" feel, we follow the **Surface-Nesting Rule**:
*   **The Canvas:** Use `surface` (#f7f9fb) as the base layer.
*   **The Foundation:** `surface_container_low` (#f2f4f6) for large secondary sections.
*   **The Feature:** `surface_container_lowest` (#ffffff) for primary cards and interaction zones.
*   **The Depth:** Use `surface_container_highest` (#e0e3e5) sparingly for subtle inset elements like search bars or inactive tabs.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. All layout boundaries must be established through color shifts between surface tiers. For example, a white card (`surface_container_lowest`) sitting on a light gray background (`surface`) provides enough contrast to be felt without the "visual noise" of a stroke.

### Signature Textures (Glass & Gradients)
*   **Glassmorphism:** For floating overlays (modals, dropdowns), use a semi-transparent `surface` with a 12px-20px backdrop-blur. This keeps the user grounded in their current context.
*   **The Sidebar Gradient:** The navigation rail uses a sophisticated deep navy linear gradient from `on_primary_fixed` (#00174b) to `inverse_surface` (#2d3133). Active states should utilize a subtle "glow" gradient transition rather than a flat color fill.

### Status Palette (Functional Accents)
*   **Casual:** `primary` (#004ac6)
*   **Comp Off:** `secondary` (#545f73) with custom orange overrides.
*   **Earned:** `tertiary_container` (#007b71)
*   **Maternity:** Custom Pink (suggested #e91e63)
*   **Sick:** `tertiary` (#006058)

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "tech-humanist" feel. Use `display-lg` through `headline-sm` for high-impact numbers (e.g., leave balances) and section titles.
*   **Body & UI (Inter):** The workhorse for the portal. Inter’s tall x-height ensures that dense HR data—like employee lists and policy text—remains legible at small scales (`body-sm`).

**Hierarchy Principle:** High contrast in scale is encouraged. A `headline-lg` title next to a `label-md` metadata tag creates a sense of "Information Architecture" that feels intentional and high-end.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering** rather than structural lines. By stacking surface tiers (e.g., a `surface_container_lowest` card on a `surface_container_low` container), we create a soft, natural lift.

### Ambient Shadows
For floating elements (Primary Action Cards), use an **Ambient Shadow**:
*   **Blur:** 24px - 40px.
*   **Opacity:** 4% - 6%.
*   **Tint:** Use a 10% opacity version of `on_surface` (#191c1e) to ensure the shadow feels like a natural obstruction of light, not a gray smudge.

### The "Ghost Border" Fallback
If a boundary is required for accessibility, use a **Ghost Border**: `outline_variant` at 20% opacity. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary (Refined Blue):** Use `primary` (#004ac6). Corner radius: `md` (0.375rem).
*   **Approve:** `tertiary_container` (#007b71) with `on_tertiary` text.
*   **Reject:** `error` (#ba1a1a) with `on_error` text.
*   **Style Note:** Use a subtle 2px vertical padding increase for a more "stately" button appearance.

### Cards & Lists
*   **Constraint:** No horizontal dividers.
*   **Separation:** Use vertical white space (16px or 24px) or a subtle background shift to `surface_container_high` for alternating rows.
*   **Interactions:** On hover, a card should transition from `surface_container_lowest` to a subtle glassmorphic state with an ambient shadow.

### Input Fields
*   **Default State:** `surface_container_highest` background with no border.
*   **Focus State:** A 2px "Ghost Border" using `surface_tint`.
*   **Labels:** Always use `label-md` in `on_surface_variant` for a clean, professional secondary feel.

### The HR Context Sidebar
The sidebar is the anchor of the portal. It should be a monolithic dark navy block. The "Active" nav item uses a sophisticated gradient highlight and a `primary_fixed` left-accent bar (4px width, rounded corners) to denote focus.

---

## 6. Do’s and Don'ts

### Do:
*   **Embrace Negative Space:** Allow at least 32px of padding between major content blocks. 
*   **Use Tonal Shifts:** Define a "Header" by placing it on `surface_container_lowest` against a `surface` body.
*   **Vary Typographic Weight:** Use Manrope Bold for numbers and Inter Regular for labels.

### Don't:
*   **Don't use 1px solid borders:** This is the quickest way to make a premium design look "templated."
*   **Don't use pure black shadows:** Shadows should always be tinted with the surface color.
*   **Don't crowd the Header:** The 'HRMS Portal' title needs at least 48px of horizontal clearance to feel prestigious.
*   **Don't use sharp corners:** Stick strictly to the `md` (0.375rem) and `lg` (0.5rem) roundedness scale to maintain the "Soft Minimalism" vibe.