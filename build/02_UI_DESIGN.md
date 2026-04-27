# Chunk 02: UI/UX Design (Full Visual -- No Functionality)

> **Goal**: Build complete visual UI for ALL pages based on user's design input. All styled, zero functionality.
> **Time**: 45-60 minutes
> **Dependencies**: Chunk 01 + User Design Input
> **Unlocks**: Chunk 03 (Core App Logic)

---

## Pre-requisite

User MUST have provided design direction before this chunk executes. Design input can be:
- Screenshots of apps/websites they like
- Website links ("make it look like linear.app")
- Color preferences (dark/light, specific hex codes)
- Design style keywords (glassmorphism, neumorphism, flat, minimal, brutalist)
- Existing CSS/HTML code to adapt
- Text prompt describing the look
- Figma/design file link

If user provided DIFFERENT designs for different pages, apply each accordingly.
If user provided ONE direction, apply consistently across all pages.

---

## Files to Create/Update

### style.css (COMPLETE REWRITE)

Build the entire design system using CSS custom properties:

**Required token categories:**
- `--color-primary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`
- `--color-bg`, `--color-surface`, `--color-surface-hover`, `--color-text`, `--color-text-secondary`
- `--font-heading`, `--font-body`, `--font-mono`
- `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (24px), `--space-xl` (32px), `--space-2xl` (48px)
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- `--transition-default`

**Required component classes:**
- `.card` -- glass/solid card with hover effect
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`
- `.input`, `.textarea`, `.select`
- `.badge`, `.badge-urgent`, `.badge-important`, `.badge-normal`
- `.modal`, `.modal-overlay`
- `.tabs`, `.tab-item`, `.tab-active`
- `.chip`, `.chip-removable`
- `.progress-bar`, `.progress-step`
- `.toast`, `.toast-success`, `.toast-error`
- `.tooltip`
- `.skeleton`, `.shimmer` (loading states)

**Required animations:**
- `@keyframes fadeIn` -- opacity 0 to 1
- `@keyframes slideUp` -- translateY(20px) to 0
- `@keyframes slideDown` -- translateY(-20px) to 0
- `@keyframes pulse` -- subtle scale pulse
- `@keyframes shimmer` -- loading skeleton effect
- `@keyframes countUp` -- for health score number

**Dark/Light mode:**
- `:root` has light mode defaults
- `[data-theme="dark"]` overrides with dark values
- OR reverse if user wants dark-first

**Responsive breakpoints:**
- Mobile: default (375px+)
- Tablet: @media (min-width: 768px)
- Desktop: @media (min-width: 1024px)
- Large: @media (min-width: 1440px)

---

### index.html (ALL VIEWS -- STATIC CONTENT)

All views exist in the same file. Only one is visible at a time (controlled by CSS class later).

**View 1: Landing Page** (`id="view-landing"`)
- App name with styled heading
- Tagline text
- 3 feature highlight cards (e.g., "Smart Attribution", "Per-Person Cards", "Zero Data Stored")
- "Process a Meeting" primary CTA button
- "Try a Demo" section with 3 demo buttons (Hackathon, Standup, Check-in)
- Footer with "Made for AI Foundry Hackathon"

**View 2: Input Screen** (`id="view-input"`)
- Tab bar: Paste | Upload | Record
- **Paste tab**: Large textarea with placeholder format example
- **Upload tab**: Drag-drop zone with file type indicators (.txt, .srt, .mp3, .mp4), size limit note
- **Record tab**: Record/Stop button, live caption area, speaker tag buttons, browser compatibility notice
- Attendee names input: text input + chip display area
- "Process Meeting" button (styled, disabled state ready)
- "Back" link to landing

**View 3: Transcript Preview** (`id="view-preview"`)
- Full-width text area showing transcript content (editable)
- Speaker labels highlighted in accent color
- "Edit" hint text
- Attendee list shown as chips
- "Looks good, process it" confirmation button
- "Back to input" link

**View 4: Results Dashboard** (`id="view-dashboard"`)
- **Summary panel** (full width):
  - Meeting type badge
  - Executive summary text
  - Health score display (large number + reasoning)
  - Decisions list
  - Unresolved questions list
  - Topics not discussed list
- **Person cards grid** (responsive):
  - Sample cards for 3-4 people with placeholder data
  - Each card: avatar circle (initial), name, action items as checkboxes, priority badges, deadline, dependency, collapsible source quote
  - "Copy" button per card
- **Charts section**:
  - Talk-time doughnut chart placeholder
  - Priority distribution bar chart placeholder
- **Action bar** (bottom fixed or inline):
  - "Copy All" button
  - "WhatsApp Format" button
  - "Export PDF" button
  - "Email Preview" button
  - "New Meeting" button

**View 5: Email Preview Modal** (`id="modal-email"`)
- Modal overlay
- Formatted email preview
- To: person name
- Subject: "Your Action Items from [Meeting]"
- Body: formatted action list
- "Copy Email" button
- "Close" button

**Loading State** (`id="view-loading"`)
- Skeleton shimmer cards
- Progress steps: "Reading transcript...", "Identifying speakers...", "Extracting action items...", "Building cards..."
- Cancel button

**Error State** (embedded in views)
- Friendly error message (no jargon)
- Retry button
- "Try demo mode" fallback link

---

## Verification

1. Open `index.html` in Chrome
2. Every view is visible (temporarily show all, or test by toggling display)
3. Design matches user's provided reference
4. Responsive: resize browser to 375px, 768px, 1024px -- all views look good
5. Dark/light mode toggle works (CSS only, via manually toggling `data-theme`)
6. All placeholder content looks realistic
7. Zero JavaScript functionality -- buttons look clickable but do nothing
8. Zero console errors
