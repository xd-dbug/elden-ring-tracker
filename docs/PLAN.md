# Elden Ring Progress Tracker — Project Plan

A mobile-friendly web app for tracking an Elden Ring playthrough. You pick the ending you're going for, the app shows which bosses that ending requires, and you can add any other bosses you want to beat. It's built with React + Vite (JavaScript) and hosted on GitHub Pages.

---

## 1. Goals and scope

### v1 (MVP)
- **Ending selector:** pick one of the six base-game endings.
- **Required-boss list:** bosses the chosen ending needs, including "pick N of these" groups such as Great Rune bearers.
- **Extra bosses:** search the full boss list and add any boss to your run.
- **Checklist:** mark bosses as defeated and see progress (for example "12 / 19 required").
- **Search and filters:** filter by name, region, required/optional, and defeated/remaining.
- **Favorites:** star bosses to find them quickly.
- **Persistence:** everything is saved in `localStorage`, so there are no accounts.
- **Mobile-first UI:** works well one-handed on a phone while you play.

### Out of scope for v1
- User accounts or cloud sync
- Shadow of the Erdtree DLC content (the API doesn't include it; see Risks)
- Tracking items, NPC questlines, or map locations
- Multiple saved playthroughs (listed as a stretch goal)

---

## 2. Key finding: the API has no ending data

I checked `https://eldenring.fanapis.com/api/bosses` on 2026-09-17:

- It returns **106 bosses in total**. The base game has more than that, so some bosses are missing.
- **Some bosses appear twice** with slightly different names, for example "Alecto, Black Knife Ringleader" and "Alecto Black Knife Ringleader".
- **Some fields are unreliable:** `image` can be `null`, `healthPoints` is `"???"`, and some `location` values are wrong.
- **It has nothing about endings or which bosses are required.**

**What this means:** the most important feature, ending → required bosses, has to come from **your own curated data file**. The API only supplies boss details (names, images, regions, descriptions, drops). Treat the API as a supporting source, not the source of truth. This is the biggest design decision in the project.

---

## 3. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React (JavaScript) | Fast, and it outputs static files that GitHub Pages can host |
| Routing | `react-router-dom` with **HashRouter** | GitHub Pages can't handle client-side routes, so refreshing `/bosses` would give a 404. Hash URLs (`/#/bosses`) avoid that. |
| Styling | CSS Modules or Tailwind | Either works. Tailwind makes the responsive layout faster to build. |
| State | React Context + `useReducer` | The app is small, so Redux isn't needed |
| Persistence | `localStorage`, wrapped in a small helper with try/catch | Private browsing and full storage can make reads and writes throw |
| Data fetching | A custom `useBosses` hook with caching | Keeps the app light. React Query is optional if you want to learn it. |
| Deploy | GitHub Actions → GitHub Pages | Deploys automatically on every push to `main` |
| Lint/format | ESLint + Prettier | |
| Tests (light) | Vitest | Only for the ending/progress logic, where bugs would be hardest to notice |

---

## 4. Data design

### 4.1 Boss data (from the API)
- Fetch `/api/bosses?limit=200` once.
- **Normalize** the results: trim names, build a `slug` (for example `starscourge-radahn`), and **remove duplicates by slug**.
- **Cache** the normalized list in `localStorage` with a timestamp. Refetch only after 7 days.
- **Fallback:** commit a snapshot (`src/data/bosses.snapshot.json`), created by a `npm run sync-data` script, and use it if the API is down. Fan APIs go offline without warning, so without this fallback the app would break.
- If a boss has no image, show a placeholder.

### 4.2 Endings (curated, in the repo)
`src/data/endings.json`. Bosses are referenced by **slug**, not by API `id`, because the IDs are opaque and the duplicate entries have different ones.

```json
{
  "commonRequired": ["morgott-the-omen-king", "fire-giant", "godskin-duo",
                     "maliketh-the-black-blade", "sir-gideon-ofnir-the-all-knowing",
                     "godfrey-first-elden-lord-hoarah-loux", "radagon-of-the-golden-order",
                     "elden-beast"],
  "groups": [
    {
      "id": "great-runes",
      "label": "Defeat any 2 Great Rune bearers",
      "pick": 2,
      "options": ["godrick-the-grafted", "rennala-queen-of-the-full-moon",
                  "starscourge-radahn", "rykard-lord-of-blasphemy",
                  "morgott-the-omen-king", "mohg-lord-of-blood",
                  "malenia-blade-of-miquella"]
    }
  ],
  "endings": [
    { "id": "fracture",   "name": "Age of Fracture",          "extraRequired": [] },
    { "id": "stars",      "name": "Age of the Stars",         "extraRequired": ["starscourge-radahn", "astel-naturalborn-of-the-void"] },
    { "id": "frenzy",     "name": "Lord of Frenzied Flame",   "extraRequired": [] },
    { "id": "order",      "name": "Age of Order",             "extraRequired": [] },
    { "id": "duskborn",   "name": "Age of the Duskborn",      "extraRequired": ["starscourge-radahn", "lichdragon-fortissax"] },
    { "id": "despair",    "name": "Blessing of Despair",      "extraRequired": [] }
  ]
}
```

> ⚠️ **This seed data is a draft. Check every entry against a wiki before you build on it.** Required bosses are complicated: some can be skipped with alternate routes, questlines have hidden requirements, and Morgott counts both as a required boss and as a Great Rune bearer. Add a `notes` field to each ending, such as "Requires completing Ranni's questline", so the app shows the context and not just a list of bosses.

**Why "pick N" groups matter:** if you marked Godrick as "required", the app would be wrong for anyone who skips him. The data model needs to handle "any 2 of these" from the start. Adding it later would mean rewriting the progress logic.

### 4.3 User state (localStorage, key `ertracker:v1`)
```json
{
  "selectedEnding": "stars",
  "defeated": ["godrick-the-grafted", "..."],
  "extras": ["mohg-lord-of-blood", "..."],
  "favorites": ["malenia-blade-of-miquella"],
  "customBosses": [{ "slug": "custom-...", "name": "...", "region": "..." }],
  "version": 1
}
```
- Add a `version` field now so the saved format can be migrated safely later.
- **Custom bosses** let you add bosses the API doesn't have, such as missing base-game bosses or DLC bosses. This is the main way around the API's gaps.

---

## 5. Core logic (pure functions, unit-tested)

`src/lib/progress.js`
- `getRequiredForEnding(endingId, data)` → `{ fixed: slug[], groups: Group[] }`
- `getGroupStatus(group, defeated)` → `{ done, satisfied, remaining }`. The group is satisfied when `done >= pick`.
- `getRunList(state, data)` → the combined list of required, group-option, and extra bosses, with duplicates removed and each boss tagged with its source.
- `getProgress(state, data)` → `{ requiredDone, requiredTotal, extrasDone, extrasTotal, percent }`
- Edge cases to test:
  - A boss that is both required and added as an extra
  - Switching endings after bosses are already checked. Keep the `defeated` list, because defeats are facts about your playthrough, not about the ending.
  - A boss that counts as both fixed-required and a group option (Morgott)

---

## 6. Screens and UX

Mobile-first, based on a 360px-wide screen, with a bottom tab bar on phones.

1. **Home / Run** (`/#/`)
   - Shows the current ending with a "Change" button
   - Progress ring or bar
   - "Next up" list of remaining required bosses
   - Group cards ("Great Runes: 1 / 2")
2. **Choose Ending** (`/#/endings`)
   - Six cards showing name, short description, number of extra required bosses, and notes
   - Asks for confirmation when you switch
3. **Boss List** (`/#/bosses`)
   - Search box, debounced by about 200ms
   - Filter chips: Region · Required · Extra · Favorites · Defeated / Remaining
   - Each row shows an image, name, and region, plus a checkbox (defeated), a star (favorite), and a "+" button (add to run)
   - Tap targets are at least 44px
4. **Boss Detail** (`/#/bosses/:slug`)
   - Image, description, location, drops, and whether the boss is required for your ending
5. **Settings** (`/#/settings`)
   - Export or import your progress as JSON. This is your backup, because `localStorage` can be cleared.
   - Reset the run
   - Add a custom boss

**UX details**
- Dark theme by default to fit the game, with good contrast
- Undo toast after checking off a boss
- Loading skeletons while data loads; a message when the app is using the offline snapshot
- `loading="lazy"` on boss images

---

## 7. Project structure

```
elden-ring-tracker/
├─ .github/workflows/deploy.yml
├─ scripts/sync-data.js          # pulls + normalizes API → snapshot
├─ public/placeholder-boss.png
├─ src/
│  ├─ api/bosses.js              # fetch + normalize + cache
│  ├─ data/endings.json
│  ├─ data/bosses.snapshot.json
│  ├─ lib/progress.js            # pure logic
│  ├─ lib/storage.js             # safe localStorage wrapper
│  ├─ lib/slug.js
│  ├─ state/TrackerContext.jsx   # reducer + persistence
│  ├─ hooks/useBosses.js
│  ├─ components/                # BossRow, FilterChips, ProgressBar, TabBar, ...
│  ├─ pages/                     # Run, Endings, Bosses, BossDetail, Settings
│  ├─ App.jsx
│  └─ main.jsx
├─ tests/progress.test.js
├─ vite.config.js
└─ README.md
```

---

## 8. GitHub Pages deployment

1. In `vite.config.js`, set `base: '/elden-ring-tracker/'` to match the repo name. If you skip this, the assets will 404 on Pages.
2. Use `HashRouter`.
3. Add a workflow that runs on push to `main`: `npm ci` → `npm test` → `npm run build` → upload `dist` using `actions/upload-pages-artifact` and `actions/deploy-pages`.
4. In the repo settings, go to Pages and set the source to "GitHub Actions".

---

## 9. Milestones

| # | Milestone | Done when |
|---|---|---|
| 1 | Scaffold + deploy | An empty Vite app is live on GitHub Pages through Actions |
| 2 | Data layer | `useBosses` returns normalized, de-duplicated bosses; snapshot fallback works |
| 3 | Endings data + logic | `endings.json` checked against a wiki; `progress.js` tests pass |
| 4 | State + persistence | Checking off bosses survives a page refresh |
| 5 | Boss List + search/filters | All filters work together; usable on a phone |
| 6 | Run + Endings screens | Progress and groups display correctly; switching endings keeps your defeats |
| 7 | Settings | Export/import, reset, and custom bosses work |
| 8 | Polish | Mobile QA on a real phone, accessibility pass (labels, focus, contrast), README with screenshots |

Build the milestones in order. Milestone 3 comes before the UI on purpose: the ending logic is what makes this app different, and it's the easiest part to get subtly wrong.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The fan API goes down or is abandoned | Committed snapshot + `localStorage` cache |
| The API is missing bosses or has duplicates | Remove duplicates by slug; support custom bosses |
| Ending requirements are wrong | Curated JSON checked against a wiki; notes on each ending; unit tests |
| Progress lost when browser data is cleared | JSON export/import |
| Slugs in `endings.json` don't match the API names | A test that checks every slug in `endings.json` exists in the snapshot |
| No DLC content | Out of scope for v1; custom bosses cover it for now |

---

## 11. Stretch goals
- Several saved playthroughs (NG, NG+)
- Region-by-region view with a completion % for each region
- Shareable progress link (state encoded in the URL)
- PWA: installable and usable offline (`vite-plugin-pwa`), which suits playing on a console with your phone beside you
- Checklists for DLC bosses and NPC questlines
