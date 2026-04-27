# Chunk 04: Input Processing

> **Goal**: Wire all 3 input methods + attendee chips + transcript preview editing.
> **Time**: 30-40 minutes
> **Dependencies**: Chunk 03 (app.js + utils.js must exist)
> **Unlocks**: Chunk 06 (with Chunk 05)

---

## Files to Create/Update

### Input Tab: Paste Transcript

```
Wire the paste textarea:
- Capture text on input/change
- Auto-detect speaker labels (patterns: "Name:", "Speaker 1:", "[Name]", "Name -")
- Show detected speaker count below textarea
- Placeholder text shows example format
- Character counter showing transcript length
```

### Input Tab: File Upload

```
Wire the file upload zone:
- Drag-drop events (dragover, dragleave, drop)
- Click to browse (hidden file input)
- Accept: .txt, .srt, .mp3, .wav, .webm, .mp4
- Validate file type (mime type check)
- Validate file size (max 25MB)
- For text files (.txt, .srt): read via FileReader, parse content, populate transcript
- For SRT files: strip timestamps, keep text and speaker labels
- For audio/video files: show filename, note "will be sent to AI for transcription"
- Show file name + size after selection
- Error toast for invalid type/size
```

### Input Tab: Live Recording

### js/recorder.js

```
Responsibilities:
- Check browser support for MediaRecorder + Web Speech API
- If unsupported: show notice, disable recording tab
- Start recording: create MediaRecorder + SpeechRecognition instance
- Real-time captions: display interim + final results in caption area
- Speaker tagging: buttons for each attendee name, click to tag current speaker
- Stop recording: stop both MediaRecorder and SpeechRecognition
- Output: full transcript text with speaker labels
- Timer: show recording duration (MM:SS)
- Visual: pulsing recording indicator

Browser detection:
- Chrome/Edge: full support
- Firefox/Safari: show "Live recording requires Chrome or Edge" notice
- Hide recording tab content, show notice instead

Error handling:
- Microphone denied: friendly error + instructions
- Speech API fails: show error, offer paste/upload instead
- MediaRecorder fails: graceful fallback
```

### Attendee Names Input

```
Wire the attendee chip input:
- Text input field for typing names
- On Enter or comma: create chip element, clear input
- Each chip has name text + remove (X) button
- Click X: remove chip
- Store names in state array
- Minimum 1 attendee required for processing
- Auto-suggest from detected speaker labels (if transcript has labels)
```

### Transcript Preview (View 3)

```
Wire the preview screen:
- Populate with transcript text from input
- Make contenteditable (user can edit before processing)
- Highlight speaker labels in accent color (regex match and wrap in span)
- Show attendee chips (read-only display)
- "Confirm & Process" button: grab edited content, send to processing
- "Back to input" link: return to input view with transcript preserved
```

### "Process Meeting" Button Logic

```
On click:
1. Get transcript text (from paste, file, or recording)
2. Validate transcript (min 50 chars, contains words)
3. Get attendee names (from chips)
4. If no attendees and no speaker labels: show warning toast
5. Store in state: { transcript, attendees, inputMethod }
6. Show preview view with populated content
```

---

## Verification

1. Paste text in textarea -> see it in preview. Edit preview -> changes persist.
2. Upload .txt file -> content appears in preview.
3. Upload .mp3 file -> filename shown, noted for AI transcription.
4. Upload invalid file (.exe) -> error toast.
5. Upload file > 25MB -> error toast.
6. Start recording in Chrome -> captions appear in real-time.
7. Stop recording -> transcript text generated.
8. Open in Firefox -> recording tab shows compatibility notice.
9. Add attendee chips -> appear as styled chips with X button.
10. Remove chip -> chip disappears from list.
11. Click "Process Meeting" with empty transcript -> validation error.
12. Click "Process Meeting" with valid transcript -> preview view shows.
