# Chunk 06: Dashboard + Exports

> **Goal**: Render AI results into styled UI. Charts, exports, checkboxes, email preview.
> **Time**: 45-60 minutes
> **Dependencies**: Chunks 03, 05 (UI exists, API returns data)
> **Unlocks**: Project complete (P3)

---

## Files to Create

### js/dashboard.js -- Results Rendering

```
Responsibilities:
1. renderResults(data) -- main function, receives parsed JSON from API
2. Fill the existing styled dashboard UI with real data:

Summary Panel:
  - Set meeting type badge text + color
  - Set executive summary text
  - Animate health score (count from 0 to score, use requestAnimationFrame)
  - Set health score reasoning text
  - Render decisions as list items
  - Render unresolved questions as list items
  - Render topics not discussed as list items (with distinct styling)
  - Render follow-up suggestions

Person Cards:
  - For each attendee in data.attendees:
    - Create card from template/clone
    - Set avatar circle (first letter of name + deterministic color)
    - Set name
    - For each action item:
      - Create checkbox row
      - Set task text
      - Add priority badge (urgent=red, important=yellow, normal=green)
      - Set deadline (if exists, in monospace font)
      - Set depends_on (if exists, as "Needs: [name]")
      - Add collapsible source quote (click to expand/collapse)
      - Checkbox state: read from sessionStorage, write on change
    - Add "Copy" button per card
    - Set key quotes (collapsible)
    - Set talk percentage and questions asked

Stats Bar:
  - Total action items count
  - Total speakers count
  - Meeting type
  - Estimated duration (from transcript length)

Functions:
  renderResults(data) -> void
  createPersonCard(attendee) -> HTMLElement
  createActionItem(item, attendeeIndex, itemIndex) -> HTMLElement
  animateHealthScore(target) -> void
  getAvatarColor(name) -> string (deterministic based on name hash)
  toggleSourceQuote(element) -> void
  saveCheckboxState(key, checked) -> void
  loadCheckboxState(key) -> boolean
```

### js/charts.js -- Visualizations

```
Responsibilities:
1. renderCharts(data) -- main function
2. Talk-time doughnut chart:
   - Labels: attendee names
   - Data: talk_percentage values
   - Colors: deterministic per attendee (match avatar colors)
   - Animation: rotate in
   - Responsive sizing
3. Priority distribution bar chart:
   - Count urgent/important/normal across all attendees
   - Horizontal bar chart
   - Colors: red/yellow/green
   - Animation: grow from left
4. Destroy previous chart instances before creating new ones (prevent canvas reuse errors)

Functions:
  renderCharts(data) -> void
  createTalkTimeChart(attendees) -> Chart
  createPriorityChart(attendees) -> Chart
  destroyCharts() -> void
```

### js/export.js -- All Export Functions

```
Responsibilities:

1. copyAll(data) -- copy all results as formatted plain text
   Format:
   "MEETMIND RESULTS
   Meeting: [summary]
   Health Score: [score]/10

   [Person Name]
   - [x] [task] [URGENT] (by [deadline])
   - [ ] [task] [NORMAL]
   ..."
   Use navigator.clipboard.writeText()

2. copyPerson(attendee) -- copy single person's card
   Same format but for one person only

3. copyWhatsApp(data) -- copy in WhatsApp-friendly format
   Format:
   "*Meeting Action Items*
   
   *Rahul:*
   - Build REST API by Thursday (URGENT)
   - Set up Vercel deployment
   
   *Priya:*
   - Design frontend components (IMPORTANT)
   ..."
   Bold = * text * (WhatsApp markdown)

4. exportPDF(data) -- generate PDF using html2pdf.js
   - Target the dashboard content area
   - Configure: A4 paper, 10mm margins, filename "MeetMind-Results.pdf"
   - Exclude action bar buttons from PDF
   - Show toast "PDF downloaded" on success

5. showEmailPreview(attendee) -- open modal with email preview
   - Populate modal fields:
     - To: attendee.name
     - Subject: "Your Action Items from [Meeting Type] Meeting"
     - Body: formatted action list with priorities and deadlines
   - "Copy Email" button: copy body to clipboard
   - "Close" button: hide modal

Functions:
  copyAll(data) -> void
  copyPerson(attendee) -> void
  copyWhatsApp(data) -> void
  exportPDF() -> void
  showEmailPreview(attendee) -> void
  formatActionText(item) -> string
  showCopySuccess() -> void (brief toast: "Copied!")
```

---

## Action Item Checkboxes (F16)

```
Each action item checkbox:
- On change: save state to sessionStorage
- Key format: "meetmind-check-{attendeeIndex}-{itemIndex}"
- On render: load saved state from sessionStorage
- Visual: checked items get strikethrough + reduced opacity
- Persists within the browser session (cleared on tab close)
```

---

## Wiring to Dashboard View

```
When processor.js returns results:
1. Store results in app state
2. Call dashboard.renderResults(data)
3. Call charts.renderCharts(data)
4. Show dashboard view (hide loading)
5. Wire export button click handlers:
   - "Copy All" -> export.copyAll(data)
   - "WhatsApp" -> export.copyWhatsApp(data)
   - "PDF" -> export.exportPDF()
   - "Email Preview" -> export.showEmailPreview(selectedAttendee)
   - "New Meeting" -> reset state, show landing
6. Wire per-card "Copy" buttons -> export.copyPerson(attendee)
```

---

## Verification

1. Process Demo 1 (hackathon) -> 4 person cards render with correct tasks.
2. Process Demo 2 (standup) -> health score shows 6/10. Dependencies shown.
3. Process Demo 3 (check-in) -> 2 cards render. Simple tasks.
4. Health score animates (counts up from 0).
5. Charts render correctly (doughnut + bar).
6. Click checkbox -> strikethrough appears. Refresh page -> state persists.
7. Click "Copy All" -> paste in notepad -> formatted text.
8. Click "WhatsApp" -> paste in WhatsApp -> bold names and dash items.
9. Click "PDF" -> PDF downloads with styled content.
10. Click "Email Preview" -> modal shows formatted email.
11. Click per-card "Copy" -> that person's tasks copied.
12. Process new meeting -> previous results replaced. Charts recreated.
13. Mobile view: cards stack single-column. Charts resize.
