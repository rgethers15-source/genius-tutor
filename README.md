# 🎓 Genius Tutor

A warm, encouraging desktop learning companion for children (K–12). Genius Tutor
acts as a gentle, kind tutor using selectable avatars (animated friends, human
mentors, and anime guides) to keep each child engaged. It runs as a downloadable
**Windows** and **macOS** application.

> Built for a family: supports up to **4 learner profiles**, a first-time setup
> questionnaire per child, grade-aware (K–12) subject activities, kinetic
> (hands-on) learning, and accessibility support including dyslexia- and
> speech-friendly modes — all designed to boost confidence and self-esteem.

---

## ✨ What's included in this base

- **Cross-platform desktop app** — Electron + React + Vite, packaged into a
  Windows installer (`.exe` via NSIS) and a macOS disk image (`.dmg`).
- **Up to 4 learner profiles**, each stored locally on the device (private, offline).
- **First-time setup wizard** per child: name, age, school, grade (K–12),
  subjects, learning style, avatar, and support needs.
- **Avatar system** with three categories:
  - 🦉 Animated friends (Pixar-style characters)
  - 👩🏽‍🏫 Human mentors
  - 🌸 Anime guides (great for older kids/teens)
- **Kinetic-first activity engine** — a transparent, offline rule-based tutor
  that suggests hands-on activities tuned to grade band and subject.
- **Accessibility & learning support** — dyslexia-friendly text, larger text,
  extra time, reduced distraction, read-aloud-ready, and speech-friendly answers.
- **Warm, low-blue-light theme** with a night mode for tired eyes.
- **Encouraging tutor persona** — gentle, kind, celebrates every win with stars.

---

## 🚀 Getting started (development)

```bash
cd genius-tutor
npm install
npm run electron:preview   # build renderer + launch the desktop app
```

For live-reload development:

```bash
npm run dev                # (renderer dev server; Electron auto-launches)
```

## 📦 Building installers

```bash
npm run dist:win    # → release/GeniusTutor-Setup-<version>.exe   (Windows)
npm run dist:mac    # → release/GeniusTutor-<version>.dmg          (macOS)
```

> Note: macOS `.dmg` must be built on macOS; Windows `.exe` on Windows (or via a
> CI runner for each OS). Code-signing certificates are recommended before
> distributing to family devices.

---

## 🧠 Growing the "superior intelligence"

The tutor's brain lives in [`src/engine/adaptiveEngine.ts`](src/engine/adaptiveEngine.ts).
It ships with a fully-offline, rule-based `AiProvider`. To add smarter, curriculum-
aware tutoring later, implement the `AiProvider` interface with an AI service
(e.g. OpenAI/Anthropic) and call `setProvider(...)`. **No other code needs to change.**

Planned extension points (interfaces already in place):
- Real animated / talking avatars (e.g. Ready Player Me, TTS) — swap the avatar
  `glyph` rendering.
- Speech recognition for spoken answers (`support.speechSupport` is already tracked).
- School-curriculum alignment using the `school` + `gradeLevel` fields.

---

## 🗂️ Project structure

```
genius-tutor/
├─ electron/            # Electron main + preload (secure IPC, local storage)
├─ src/
│  ├─ components/       # ProfilePicker, SetupWizard, Dashboard, AvatarPicker
│  ├─ data/             # avatars, curriculum (K-12), local store
│  ├─ engine/           # adaptive learning engine (pluggable AI interface)
│  ├─ types.ts          # domain models
│  ├─ App.tsx           # app shell, routing, theme/accessibility
│  └─ styles.css        # warm low-blue-light theme + night mode
├─ package.json         # scripts + electron-builder config (win/mac)
└─ vite.config.ts
```

## 🔒 Privacy

All learner data (profiles, progress) is stored **locally on the device** in the
app's user-data folder. Nothing is uploaded anywhere by this base application.
