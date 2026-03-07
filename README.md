# Collab Sheets

A real-time collaborative spreadsheet application built with **Next.js 14**, **Firebase**, and **react-window**. Multiple users can edit the same spreadsheet simultaneously with live presence indicators, formula evaluation, and rich cell formatting — all aligned to a Google Sheets–inspired UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database & Auth | Firebase (Firestore + Auth) |
| Virtualization | react-window |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Architecture

```
app/
├── layout.tsx          # Root layout — wraps app in AuthProvider
├── page.tsx            # Dashboard — lists all user spreadsheets
├── login/page.tsx      # Login page (Google + Guest)
└── sheet/[id]/page.tsx # Spreadsheet editor page

components/
├── SpreadsheetGrid.tsx # Core orchestrator — state, presence, sync, keyboard nav
├── VirtualGrid.tsx     # react-window virtualized grid + sticky headers + resize handles
├── Cell.tsx            # Individual cell (active/inactive, formatting aware)
├── Toolbar.tsx         # Google Sheets–style formatting toolbar + Export dropdown
├── Presence.tsx        # Real-time collaborator presence display
├── SaveIndicator.tsx   # Saving/Saved/Error sync state badge
└── ProtectedRoute.tsx  # Auth guard — redirects unauthenticated users

lib/
├── firebase.ts         # Firebase init, Firestore helpers, presence, formatting
├── auth.ts             # Google + anonymous sign-in
├── formulas.ts         # Formula parser and evaluator (=A1+B2 style)
├── dependencyGraph.ts  # Tracks cell dependencies for cascading formula updates
├── export.ts           # CSV and JSON export utilities
└── userColor.ts        # Deterministic user colour generation

contexts/
└── AuthContext.tsx     # React Context for authentication state

types/
├── spreadsheet.ts      # SheetData, CellStyle, SheetFormatting
└── user.ts             # UserProfile
```

---

## How Real-Time Collaboration Works

1. **Authentication** — Users sign in via Google OAuth or as a Guest (Firebase Anonymous Auth). Their profile (`uid`, `name`, `color`) is stored in `Firestore /users/{uid}`.

2. **Presence** — On sheet open, `SpreadsheetGrid` calls `joinPresence()`, writing the user's identity to `Firestore /sheets/{sheetId}/presence/{uid}`. On unmount or tab close (`beforeunload`), `leavePresence()` deletes that document. `Presence.tsx` listens via `onSnapshot` and renders collaborator avatars in real time.

3. **Cell sync** — When a cell is edited, the value is written to `Firestore /sheets/{sheetId}` under `cells.A1` using dot-notation partial updates (no full-document rewrites). Every client has an `onSnapshot` listener on the same document; remote changes are applied instantly to local state.

4. **Formatting sync** — Cell styles are written to a separate `formats` map within the same document (e.g., `formats.A1 = { bold: true, color: "#ff0000" }`). The formula evaluator reads only `cells`, so formatting never interferes with calculations.

5. **Formula engine** — References like `=A1+B2` are resolved recursively. A dependency graph tracks which cells depend on which others, so editing a source cell re-evaluates all dependents immediately in the local state before the Firestore write even completes.

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- A Firebase project with **Firestore** and **Authentication** enabled
- Google Sign-In method enabled in Firebase Auth console
- (Optional) Anonymous sign-in enabled for Guest mode

### 1. Clone
```bash
git clone https://github.com/tushit24/Spreadsheet_app.git
cd Spreadsheet_app
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your Firebase project values (found in Firebase Console → Project Settings → Your Apps).

### 3. Firestore Security Rules
Deploy the included `firestore.rules` via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel
1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the `NEXT_PUBLIC_FIREBASE_*` environment variables in **Project Settings → Environment Variables**.
4. Deploy — Vercel will build and publish automatically.
5. Live link: https://spreadsheet-app-ivory.vercel.app/

---

## Key Features

- **Real-time multi-user collaboration** via Firestore `onSnapshot`
- **Custom sheet names** — create with a specific name and rename inline directly in the editor header
- **Sheet deletion & Metadata** — owners can delete their spreadsheets; dashboard shows who last edited the sheet and when
- **Refined UI/UX** — smooth loading skeletons, friendly empty states, hover-highlighted cells, custom scrollbars, and a modernized, Google-Sheets inspired toolbar
- **Live presence indicators** — see who else is editing with color-coded avatar initials
- **Formula engine** — supports `=A1+B2`, `=SUM`-style expressions with circular dependency detection
- **Rich cell formatting** — font family, size, bold, italic, underline, strikethrough, text color, fill color, alignment
- **Column & row resizing** — drag any column or row border to resize, exactly like Google Sheets (min 60px / 20px)
- **Export** — download the sheet as `.csv` or `.json` via the **Export ▼** toolbar button
- **Sticky row & column headers** — synchronized scroll with the virtualized grid
- **Keyboard navigation** — Arrow keys, Tab, Enter; `Ctrl+B/I/U` shortcuts; `Ctrl+C/V` copy-paste
- **Save indicator** — real-time "Saving… / ✔ Saved / ⚠ Error" badge
- **Guest mode** — try without a Google account via Firebase Anonymous Auth

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

All variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser bundle.
