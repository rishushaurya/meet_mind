# Chunk 03: Core App Logic

> **Goal**: Wire view routing, state management, theme toggle, and utility functions into existing UI.
> **Time**: 20-30 minutes
> **Dependencies**: Chunk 02 (UI must be fully styled)
> **Unlocks**: Chunks 04, 05 (can be parallel)

---

## Files to Create

### js/app.js -- Main Controller

```
Responsibilities:
- View routing: show/hide views based on navigation
- State object: { currentView, transcript, attendees, results, theme }
- Event listener wiring for all navigation buttons
- Theme toggle (dark/light mode)
- Initialize app on DOMContentLoaded

Views: landing, input, preview, dashboard, loading
Modal: email-preview

Navigation flow:
  landing -> input (via CTA or demo button)
  input -> preview (via "Process" button after validation)
  preview -> loading -> dashboard (via "Confirm" button)
  dashboard -> landing (via "New Meeting")
  Any view -> landing (via logo/back)

Functions:
  showView(viewId) -- hide all views, show target, update state
  toggleTheme() -- swap data-theme attribute, save to localStorage
  initApp() -- set initial view, restore theme, wire events
```

### js/utils.js -- Utilities

```
Responsibilities:
- sanitize(html) -- DOMPurify.sanitize() wrapper
- safeText(element, text) -- set textContent safely
- validateTranscript(text) -- min 50 chars, contains words
- validateAttendees(names) -- at least 1 name
- showToast(message, type) -- create/show toast notification (success/error)
- hideToast() -- remove toast after 3 seconds
- formatDate(dateStr) -- parse relative dates ("by Friday" -> actual date)
- debounce(fn, ms) -- prevent rapid-fire calls
- generateId() -- unique ID for UI elements

Security:
- ALL text displayed via textContent or DOMPurify.sanitize()
- NEVER use innerHTML directly
- Input validation before any processing
```

---

## Wiring Required

1. All "back" buttons navigate to previous view
2. Landing CTA -> show input view
3. Landing demo buttons -> load demo transcript + show input view (pre-filled)
4. Input tabs (Paste/Upload/Record) -> toggle tab content panels
5. Dark/light toggle button -> swap theme
6. Theme preference saved to localStorage, restored on load
7. "Process Meeting" button -> validate -> show preview view
8. "Confirm & Process" button -> show loading view (functionality comes later)
9. "New Meeting" button -> reset state -> show landing

---

## Verification

1. Open in Chrome. Landing page shows.
2. Click CTA -> input view shows. Back button -> landing.
3. Click tabs -> tab content swaps correctly.
4. Click theme toggle -> dark/light switches. Refresh -> theme persists.
5. Zero console errors.
6. Toast system works (test manually via console: `showToast('Test', 'success')`)
