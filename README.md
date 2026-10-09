# Release-Checklist

A simple checklist tool to help during the release process of a new software version.

Create reusable **templates** (items and nested sections, reorderable), then instantiate **checklists**
(with a `version`) from them. Checklists are independent copies: editing or deleting a template never
alters existing checklists. Items can be checked (a section checks/unchecks all its items), disabled
(not required, but still visible) and relabelled; every change is saved automatically.

Stack: Laravel 13 + SQLite API, Vue 3 (Pinia, Vue Router, Tailwind) dark-theme front end, no authentication.
The front end is offline-first: data is kept in `localStorage`, changes are queued and replayed to the
server when the connection is back (a service worker caches the app shell).

## Setup

```sh
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate
npm install && npm run build
php artisan serve
```

Use `npm run dev` for hot reloading. Tests (`php artisan test`) require a front-end build (`npm run build`).
