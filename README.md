# KEMBARA MUZIKA: Pengembaraan Muzik secara Digital

Copyright © dzurrihensem

A browser-based 3D educational adventure game for learning music theory. It is aimed at Form 1 students at Sekolah Seni Malaysia. All in-game text is in Bahasa Melayu.

Players explore floating islands, talk to NPCs, collect musical objects and solve notation puzzles. Along the way they recover the seven Musical Crystals.

> Note on curriculum: the topics follow a *proposed* Form 1 progression. The content has **not** been checked against the official DSKP. Teachers should review the questions before using them in class.

---

## Quick start

```bash
npm install
npm run dev          # development server → http://localhost:5173
npm run build        # type-check + production build → dist/
npm run preview      # serve the production build
npm run validate     # automatically verify every question in the bank
SINGLE=1 npx vite build   # one self-contained HTML file → dist-single/index.html
```

**Requirements:** Node.js 18 or later (tested with Node 22) and npm 9 or later. You also need a browser with WebGL: a recent Chrome, Edge, Firefox or Safari. You do not need any API keys or paid assets.

The output in `dist-single/index.html` is one file that runs offline. You can copy it to a USB drive or a shared folder and open it straight from there, with no server needed. The display fonts load from Google Fonts. The music-notation font is built into the file.

---

## Install as an app (PWA) on phones and tablets

`npm run build` produces `dist/`, which is an installable **Progressive Web App**:

- It runs fullscreen like a native game, in portrait or landscape.
- It works **offline** after the first visit, because a service worker caches every file, including the fonts.
- On phones and tablets, tapping **"Mulakan Misi"** switches the browser to fullscreen automatically. There is also a **Skrin Penuh** button.

**Hosting.** A PWA can only be installed from an **HTTPS** website. Any free static host works, for example **Netlify Drop**:

1. Open https://app.netlify.com/drop.
2. Drag in the `dist` folder, or the unzipped `kembara-muzika-pwa.zip`.
3. You get a link to share with students. GitHub Pages, Vercel and Cloudflare Pages also work.

**Installing on a device:**

- **Android / Chrome / Edge:** tap **"Pasang Aplikasi"** on the main menu, or use the browser menu → *Install app* / *Add to Home screen*.
- **iPhone / iPad (Safari):** tap Share → *Add to Home Screen*. The game shows these steps itself when "Pasang Aplikasi" is tapped.

**Data:** everything stays on the device (Mod Peranti, no cloud storage). Students send their score to the teacher using the PDF in **Skor Saya**.

> The claude.ai artifact link and the single offline `.html` file cannot be installed as apps. Use the hosted `dist/` build for installation.

## Controls

| Desktop | Action |
|---|---|
| W A S D / arrow keys | Move |
| Shift | Sprint |
| Space | Jump |
| E | Interact (talk, tap, open, use) |
| Mouse drag / wheel | Rotate / zoom the camera |
| Esc | Pause / close panel |
| Q · B · M · H | Quest Log · Theory Book · World Map · Controls help |
| 1–4, Enter | Choose / submit an answer in challenges |

**On touch devices**, the controls appear on screen automatically:

- a virtual joystick (push it all the way to sprint)
- a jump button
- an interact (✋) button
- drag anywhere on the screen to rotate the camera

---

## What is implemented

**3D world (React Three Fiber)**
- Five worlds, all playable:
  - **Kampung Notasi**
  - **Hutan Irama**
  - **Pergunungan Skel** (a staircase of jumping platforms)
  - **Gua Jeda**
  - **Kuil Triad**
- Low-poly procedural art throughout: floating islands, note-shaped trees, walkable piano-key bridges that play the C major scale as you cross them, portals, glowing crystals, particles, clouds, fog and shadows.
- Third-person character controller:
  - walk, run and jump, with gravity and coyote time
  - ground detection on platforms, plus collision with trees, houses, NPCs and gates
  - recovery to the last safe spot after a fall
- Smooth follow camera:
  - kept above the ground
  - pulls in when trees, pillars or houses would block the view
  - turns automatically when the player strafes

**Characters and quests**
- 6 NPCs:
  - Maestro Melodi
  - Komposer Kecil
  - Cikgu Ritma
  - Tok Tangga Nada
  - Si Gema
  - Penjaga Harmoni
- Each NPC gives quests, hints and practice sessions. Markers show what an NPC has: **!** for a new quest, **?** for one that is waiting for you.
- 7 quests: 3 in World 1 and 1 in each later world. Every step is tied to a real interaction:
  - talking to an NPC
  - collecting glowing objects
  - challenges at boards or NPCs
  - opening a gate
  - tapping Note Stones in melodic order, read from staff notation
  - picking up the crystal
  - returning to the mentor
- A final **Mastery Test** (10 questions across all topics, 70% to pass) restores the 7th crystal.
- An objective tracker with a compass arrow that points to the current goal.

**Challenge system (8 interaction types, SVG notation)**
- Multiple choice
- Identify a note on the staff
- Drag or tap a note onto the staff (keyboard accessible with ↑/↓)
- Match symbols to names
- Put items in the correct order
- Fill in the missing note of a scale
- Identify an interval
- Build a triad (with a piano keyboard and chord playback)
- Listen to a rhythm and pick the matching notation

How feedback works:
- The answer is not shown before the student tries.
- A wrong answer gives a hint, plus specific feedback where possible, such as "place it higher" or "2 of your 3 notes are correct".
- After a second wrong attempt, the explanation is shown.
- Students can retry until they get it right.
- The final test gives one attempt per question, with an explanation after each one.

**Progression**
- XP and levels
- Music Coins
- 7 crystals
- 12 badges, including Penjelajah Not, Pakar Ritma, Penakluk Skel, Detektif Jeda and Penjaga Harmoni
- Worlds that unlock as you go
- A daily challenge
- A bonus for collecting all the coins in a world

**Rewards:**
- A correct first attempt earns full XP.
- A correct retry earns about ⅓ XP.
- Wrong answers never take away progress.

**Skor Saya (score report)**
- Students enter their name, class, school and teacher, see their score summary, and save a PDF score report (`Skor_KembaraMuzika_<nama>_<tarikh>.pdf`) to send to the teacher. Open it from the menu, the HUD trophy button, the pause menu, the `K` key, or after the final test.

**Learning dashboard**
- Questions attempted, correct on first try, accuracy, and best final-test score.
- Mastery by topic: Notasi, Nilai Not & Rehat, Irama & Meter, Skel Major, Jeda and Triad.
- Exploration statistics are kept separate from understanding: quests, worlds, crystals, badges and coins.

**Teacher-ready content**
- The question bank is in `src/questions/*.ts`. It holds 72 questions:
  - 25 notation
  - 9 note values
  - 10 rhythm
  - 10 scales
  - 9 intervals
  - 9 triads
- Each question has: topic, difficulty, options, answer, hint, explanation, XP and notation data.
- `npm run validate` works out the correct answers again from the notation data and fails if any answer is wrong. It checks:
  - note names from staff positions
  - interval quality and size
  - missing notes in major scales
  - triad spellings
  - beat totals and bar completion
  - rhythm/audio matches

**Other features**
- **Theory Book:** illustrated notes with playable examples, and 5-question practice for each topic.
- **Audio:**
  - All sound is made with the Web Audio API, so no copyrighted audio is used.
  - Each world has its own procedural background music.
  - Sound effects have overlap throttling and a voice cap.
  - Rhythm playback includes a count-in.
  - Volume sliders and a mute option are included.
- **Settings:** graphics quality (low/medium/high), touch controls (auto/on/off) and invert-Y.
- **Saving:** progress is saved to `localStorage` and restored after a refresh.
- **Robustness:** an error boundary, a check for missing WebGL support, a loading screen, reduced-motion support, focus outlines, ARIA labels and resize handling.

---

## Project structure

```
src/
  App.tsx                 screens, global keyboard, error boundary
  main.tsx                entry (exposes window.__gm debug hooks in dev only)
  types/                  shared TypeScript types (Question, QuestDef, WorldDef…)
  questions/              QUESTION BANK + challenge sets + practice pickers
  quests/questData.ts     quests, crystals, badges, world unlock rules
  worlds/                 worldData.ts (layouts, NPCs, objects), Scenery.tsx, WorldObjects.tsx
  characters/             Avatar.tsx (procedural animated character), NPC.tsx
  game/                   GameCanvas, Player controller, physics, interactions, objectives
  challenges/             ChallengeModal, QuestionViews, Notation (SVG staff/rhythm/keyboard)
  components/             HUD, MainMenu/Intro, Dialogue, Panels, TheoryBook, AvatarEditor, Overlays
  audio/audioEngine.ts    Web Audio synthesis (SFX, notes, rhythms, procedural music)
  store/                  gameStore (persisted progress), uiStore (transient UI)
  hooks/                  input state, touch detection
  utils/                  music theory helpers, canvas textures
scripts/validate-questions.ts
```

## Adding questions

Add questions in code: add an object to one of the arrays in `src/questions/`, following the `Question` type in `src/types/index.ts`. Add `check` metadata so the validator can verify the answer. See the existing examples, such as `{ note: 'G4' }` or `{ interval: ['C4','E4'] }`. Then run `npm run validate`.

Notes are written in scientific pitch notation, so C4 is middle C. Rhythms use `rh('q q e e h.')`: w = semibrif, h = minim, q = krotchet, e = kuaver, s = semikuaver, `.` = dotted, `r` = rest.

## Known limitations

- **Performance:**
  - Rendering uses WebGL, so very old or low-end devices may need the "Rendah" (low) graphics setting.
  - Testing in this environment used software rendering (about 5 fps). Real GPUs are much faster, but frame rates have not been measured on actual school hardware.
- **Progress storage:**
  - Progress is saved per browser and per device.
  - There are no accounts and no shared class dashboard.
  - Teachers collect scores from students' PDF reports (Skor Saya).
- **Questions:**
  - The question set suits Form 1 level. The prompt also mentioned Forms 2–3; more advanced content (for example minor scales or more key signatures) would need new questions.
- **Visual and audio design:**
  - The characters are stylised procedural models, not rigged meshes.
  - Animation is limited to idle, walk and jump poses.
  - The music-notation font is Noto Music (SIL OFL), which is bundled. The display fonts (Baloo 2, Nunito) load from Google Fonts and fall back to system fonts when offline.
- **Browser behaviour:** sound starts only after the first tap or click, because of browser autoplay rules.
