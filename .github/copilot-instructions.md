# Copilot instructions

Release-Checklist: reusable **templates** (items + nested sections) instantiated into versioned **checklists**. Laravel 13 JSON API (SQLite) + Vue 3 SPA (Pinia, Vue Router, Tailwind 4), no authentication, English-only UI with hardcoded strings (no i18n).

## Commands

- Setup: `composer setup` (or see README).
- Dev: `composer dev` / `npm run dev` (Vite HMR). Production assets: `npm run build`.
- Tests: `php artisan test` (PHPUnit, in-memory SQLite). Feature tests need a built front end (`npm run build`).
- PHP style: Laravel Pint defaults (`vendor/bin/pint`). Indent 4 spaces, LF (see `.editorconfig`).

## Backend (`app/`, `routes/api.php`)

- All primary keys are UUIDs (`HasUuids`); the client generates ids. Never introduce integer ids.
- Models use `$guarded = []`; relations to items are `hasMany(...)->orderBy('position')`.
- Endpoints in `Api\TemplateController` and `Api\ChecklistController`: `index`, `show`, `PUT /{id}` (idempotent upsert), `destroy` (204). Upserts must stay replay-safe because the offline outbox re-sends them, and run inside `DB::transaction`.
- Items travel as a **flat array** (`id`, `parent_id`, `label`, `position`, plus `checked`/`disabled` for checklists). Validation lives in `Http/Requests` (`ItemTreeRequest` base: UUIDs, max 5000 items, no cycles, parents must exist). Extend it rather than duplicating rules.
- Responses are shaped by each controller's `present()` (ISO timestamps, flat items). Keep the shape in sync with `resources/js/lib/api.js`.
- Checklists are independent copies of templates: deleting a template sets `checklists.template_id` to null (`nullOnDelete`); an unknown `template_id` is ignored. Preserve this.
- Schema changes: add a new migration; update both the controller `present()`/upsert and the request rules.
- Tests go in `tests/Feature/ApiTest.php` style: `RefreshDatabase`, ids from `Str::uuid()`, cover replay (PUT twice), validation failures and independence from templates.

## Frontend (`resources/js/`)

- Single Pinia store `stores/data.js` is offline-first: state persisted in `localStorage` (`release-checklist:v1`) with an **outbox** of `put`/`delete` entries replayed to the API (debounced 400ms, pull every 30s, deletes first, then templates, then checklists). Any mutation must call `touch()` so it is queued; pending entries are not overwritten by pulls.
- `lib/api.js`: `NetworkError` (network failure / 5xx -> retry later) vs plain `Error` (4xx -> server rejected). Converts tree <-> flat with `toTree()` / `toFlat()`.
- `lib/tree.js` holds pure tree logic (`instantiate`, `findNode`, `setChecked`, `syncSections`, `progress`). Put new tree behavior there. Rules: checking a section cascades to enabled descendants; a section auto-checks when all enabled children are checked; disabled items are excluded from progress but stay visible.
- Components are `.vue` SFCs (`<script setup>`); nested trees use recursive `ChecklistNode` / `TemplateNode`. Routes are in `router.js`.
- Styling: Tailwind 4 utilities, dark slate palette with indigo accent. Reuse the `.btn`, `.btn-primary`, `.btn-danger`, `.btn-icon`, `.field`, `.card` classes from `resources/css/app.css`.

## Service worker (`public/sw.js`)

- Caches the app shell and `/build/*` assets (cache-first), navigation is network-first with fallback to `/`; `/api/` is never cached. Bump the `release-checklist-shell-v1` cache name when changing caching behavior.

## Conventions

- Keep changes minimal; no auth, i18n or extra abstractions unless requested.
- `public/build` is generated; don't edit it by hand.
- Web catch-all route serves `resources/views/app.blade.php` for SPA paths (excluding `/api` and `/up`); add client routes in `router.js`, not `routes/web.php`.
