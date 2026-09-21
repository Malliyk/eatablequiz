# EATABLE — Street-Food Cart Quiz PWA

A mobile-first, bilingual (English / ಕನ್ನಡ) quiz web app for street food carts. Customers scan a QR code, play a quick quiz on their own phone, and win a free treat. The cart owner manages everything — settings, player modes, question bank, practice rounds — from a password-protected console.

**Live app:** https://eatablequiz.lovable.app

## Why this project

Street-food carts have no budget for kiosks or apps. EATABLE turns any phone with a QR scanner into a game station: zero install, works on cheap Android phones, bilingual, and the owner controls everything without touching code.

## How it works

```
Customer phone                    Server (edge functions)              Database
--------------                    -----------------------              ---------
/index  enter team + language  →
/modes choose player mode      →
/instructions rules & reward   →
/quiz  play (timer, shuffle)   →   /submit-quiz  →  grade server-side
/result score + reward         ←   outcome only (no answer key)
/review answers marked ✓/✗     ←   correct answers, after submit
/owner  password-gated console →   owner functions verify hash
```

## Feature tour

**Player side**
- Register with a team name and pick the quiz language — English or Kannada. Everything afterward (questions, options, rules, results, review) renders only in the chosen language; no mixing.
- Player modes are owner-defined: number of players, total questions, difficulty mix (Easy / Moderate / Difficult), time limit, correct answers needed to win, and reward text.
- Questions are drawn randomly across difficulties each round — no fixed sequence.
- Options are shuffled per question, every round, so the right answer never sits in a predictable position (defeats "answer is always A" patterns from the source CSV).
- Countdown timer with auto-submit, progress bar, instant result with reward screen, and a full answer review that marks each choice right, wrong, or not answered and highlights the correct option.
- Optional practice ("sample") round for first-timers: owner sets question count, time limit, pass mark, intro text, and reward text. Practice rounds never consume the retake cooldown.
- Retake cooldown: after playing, the same device waits a configurable number of minutes before playing again.

**Owner console** (`/owner`, opened by long-pressing the profile icon, or directly at `/owner`)
- Password login; password can be changed anytime from Settings.
- Settings: business name, item, price, default reward, quiz open/closed toggle, retake wait time.
- Player modes: create, edit, enable/disable, delete.
- Questions: bulk CSV upload (replace or append) with a 16-column bilingual format, active/inactive per question, difficulty levels.
- Sample quiz: toggle on/off and configure count, time, pass mark, reward, bilingual intro.

## Security design

- **Answer keys never reach the browser.** The public question payload excludes `correct_answer`; grading happens in a server function after submission. The review page renders server-provided results only.
- **Owner settings and password hash are server-only.** The `settings` and `questions` tables have no public read policies; only server functions using the service-role connection can read them, and every owner function first verifies the password against its SHA-256 hash.
- **Practice-round config** (`sample_config`, `sample_questions`) is likewise server-only.
- **Input validation** on every server function with Zod (UUIDs, enums, array limits).
- Passwords are stored as SHA-256 hashes, never plaintext; password changes require the current password.

## Tech stack

- **TanStack Start v1** — full-stack React 19 with file-based routing, SSR, and typed server functions (`createServerFn`) that move all secret work off the browser.
- **TypeScript** throughout; **Tailwind CSS v4** with a custom orange/white token theme (`src/styles.css`).
- **Lovable Cloud (Postgres + row-level security)** — singleton `settings` and `sample_config`, `player_modes`, bilingual `questions`.
- **Session state** lives in `sessionStorage` (`src/lib/eatable-session.ts`), so every phone gets an independent quiz session; the retake timer uses `localStorage`.
- **Custom CSV parser** (`src/lib/csv.ts`) handling quoted fields for bulk question imports.

## Project structure

```
src/
├── routes/                  # file-based routes
│   ├── index.tsx            # /            register + language picker
│   ├── modes.tsx            # /modes       player mode grid
│   ├── instructions.$modeId # /instructions/:modeId  rules & start
│   ├── quiz.tsx             # /quiz        the quiz itself
│   ├── result.tsx           # /result      score + reward
│   ├── review.tsx           # /review      answers marked ✓/✗
│   ├── sample.tsx           # /sample      practice round intro
│   └── owner.tsx            # /owner       password-gated console
├── lib/
│   ├── eatable.functions.ts # server functions: config, question draw, grading, owner CRUD
│   ├── eatable-session.ts   # session/localStorage helpers, shuffle logic, text cleanup
│   └── csv.ts               # RFC4180-ish CSV parser
├── integrations/supabase/   # generated database clients (browser + server)
└── styles.css               # Tailwind v4 theme tokens
```

## Running locally

```bash
bun install
bun run dev      # dev server with SSR
bun run build    # production build
bun run lint     # eslint
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` for the database connection (see `.env.example`).

## What I'd build next

- Per-question images for food items.
- Owner analytics: plays, win rate, popular questions.
- Question bank versioning so owners can preview an upload before committing.
