# Rebuilding the demo video

The edit is code, so it can be changed and re-rendered.

| Step | File | What it does |
|---|---|---|
| 1. Capture | `rec/record.mjs` (+ `rec/flow.mjs`) | Drives the live app in Microsoft Edge at 390×844 (2×) with `playwright-core` and saves CDP screencast frames, timestamps and named markers to `take3/` |
| 2. Voice | `vo/lines.txt` | Final: `python -m edge_tts --voice en-US-AndrewMultilingualNeural --rate=-2% --text "<line>" --write-media andrew/L01.mp3` per line, then silences trimmed with FFmpeg. Licensed alternative: `vo/azure-tts.ps1 -Voice en-US-AndrewMultilingualNeural` (Azure AI Speech). Offline fallback: `vo/tts.ps1` (Windows Heera) |
| 3. Timeline | `edit/timeline.mjs` | Shots (B-roll and app, app shots referenced by marker + speed), narration start times, subtitle text |
| 4. Picture | `edit/stage.html` + `edit/render.mjs` | Each 1920×1080 frame is laid out in HTML/CSS (phone frame, panels, callouts, subtitles) and screenshotted in headless Edge, piped to FFmpeg (H.264, 30 fps) |
| 5. Sound | FFmpeg | Narration placed at the timeline times, loudness-normalised to −16 LUFS; original synthesised pad at about −38 LUFS, lightly ducked under the voice |

Commands (from a scratch folder containing `rec/`, `vo/`, `edit/`, `broll/` and `music/`):

```bash
npm install playwright-core@1.48.2
node rec/record.mjs take3
node edit/render.mjs stills 44.5 80.8     # check frames
node edit/render.mjs video video_noaudio.mp4
```

The B-roll frame folders (`broll/b1`…`b6`) are extracted from the clips in `../assets/broll/` with FFmpeg at 30 fps
(see the start/length of each shot in `timeline.mjs`).
