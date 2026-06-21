# SWU Draft Cup Standings

A small Vite/React site for SWU Draft Cup standings, champion history, and rules.

The site pulls standings and champion data from published Google Sheets CSV URLs. It is designed for Netlify deployment from GitHub.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Open the URL Vite prints, usually:

```text
http://localhost:5173/
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Netlify

Use these build settings:

```text
Build command: npm run build
Publish directory: dist
```

The included `netlify.toml` also configures the single-page app fallback so routes like `/rules`, `/champions`, and `/standings/ashes-of-the-empire` work after deployment.

## Project Structure

```text
index.html          Vite entry HTML
src/App.jsx         Main React app and pages
src/config.js       Season and champions CSV configuration
src/csv.js          CSV parsing/header helpers
src/styles.css      Site styling
public/             Static images and fonts served by Vite/Netlify
```

## Adding a New Season

Most season changes happen in `src/config.js`.

Add a new object to the top of the `sets` array:

```js
{
  slug: 'new-set-name',
  legacyPath: '/season08.html',
  name: 'New Set Name',
  eyebrow: 'Current Season',
  pageClass: 'page-new-set',
  csvUrl: '0xDEADBEEF',
  roster: 'TBD',
  standingsMode: 'tiebreakers'
}
```

Field guide:

- `slug`: URL-safe route name. Example: `/standings/new-set-name`.
- `legacyPath`: optional old-style URL support. Use the next archive-style path if desired, such as `/season08.html`.
- `name`: display name shown in headings and dropdowns.
- `eyebrow`: small label above the page title. Use `Current Season` for the active season and `Set Archive` for older seasons.
- `pageClass`: CSS class that controls the background image.
- `csvUrl`: published Google Sheets CSV URL.
- `roster`: use `'TBD'` when the roster/CSV is not ready, or `'csv'` when standings should fetch from the sheet.
- `standingsMode`: use `'tiebreakers'` for Points, MMWR, and Opp. Aver. MMWR sorting. Use `'points'` for older seasons that sort by points only.

If the season does not have a roster yet, keep:

```js
roster: 'TBD'
```

The site will show an empty standings table shell and will not try to fetch the CSV.

When the season is ready, update:

```js
csvUrl: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv',
roster: 'csv'
```

## Adding New Background Art

Put the image in `public/`, for example:

```text
public/swh09_keyart.jpg
```

Then add a matching CSS class in `src/styles.css`:

```css
.page-new-set {
  --page-art: url('/swh09_keyart.jpg');
}
```

Use that class in the season config:

```js
pageClass: 'page-new-set'
```

## Google Sheets Requirements

Standings sheets should include columns compatible with the current standings table, including:

```text
Player
Draft 1 Wins / Losses / Draws
Draft 2 Wins / Losses / Draws
Draft 3 Wins / Losses / Draws
Draft 4 Wins / Losses / Draws
Points
MMWR
Opp. Aver. MMWR
```

Champion history is configured with `championsCsvUrl` in `src/config.js`.

The champions CSV supports these columns:

```text
Set
Top Cut Bracket
Winner
Winner Deck(s)
Deck Link(s)
Runner-Up
Runner-Up Deck(s)
Deck Link(s)
```

Deck links and bracket links are rendered as clickable links.

## Notes

- Do not commit `node_modules/` or `dist/`; both are ignored.
- Netlify builds `dist/` automatically.
- Public image/font assets live in `public/`.
