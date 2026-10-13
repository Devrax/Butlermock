# Changelog

All notable changes to Butlermock are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Three pull requests landed on 2026-10-12: #3 (CLAUDE.md), #4 (parser-based
engine, shared API handler, CI, README) and #5 (Fresh 2.3.3). Together they are
a major release: the public API and the deployment model changed.

### Breaking changes

- **Deployment.** The app is built with Vite and served from the generated
  `_fresh/server.js`; `main.ts` is no longer run directly. Deno Deploy needs the
  Fresh preset with build command `deno task build` and entry point
  `_fresh/server.js`. Deno 2 is required.
- **API error status.** Invalid requests answer `400` with `{ "error" }`
  instead of `500`: malformed JSON, missing or oversized `value` (> 100 KB), a
  TypeScript syntax error in `value`, an unknown `mustReturn`, `quantity`
  outside 1-10, a non-integer `seed`, or `valueForAny` that is not valid JSON.
- **`quantity` validation.** `0` and negative values are rejected with `400`;
  they used to be treated as `1`. `quantity` may still be omitted or `null`.
- **Union semantics.** `'tel' | string` now picks any member (the old engine
  always returned the literal), and `string | null` yields `null` about half
  the time.
- **Numbers** are drawn from Faker's whole safe-integer range instead of 0-9.
- **Arrays** contain 1-5 independently generated items instead of 1-4 copies of
  the same object; primitive arrays follow the same rule.
- **Redirect target.** Requests on `butlermock.deno.dev` now redirect to
  `https://butlermock.online/` (with a trailing slash).
- **Dev server.** `deno task start` now serves the production build;
  development uses `deno task dev` (Vite, port 5173).

### Added

- **Parser built on the TypeScript compiler** (`core/parser/`). The source is
  read as a real AST (syntax only), so anything valid TypeScript is accepted:
  no trailing `;` needed, comments anywhere, `export`/`declare`/`readonly`,
  declarations inside `namespace` and `declare module` blocks, and repeated
  interfaces merge. Syntax errors are reported with line and column.
- **Newly supported types**: inline object literals at any depth,
  `Array<T>`/`ReadonlyArray<T>`, nested arrays, tuples, type unions,
  intersections, `extends` with several parents, generics with arguments and
  defaults (including generic interfaces extending generic interfaces), index
  signatures (1-3 random keys), `enum` (string and numeric), `Partial`,
  `Required`, `Readonly`, `Pick`, `Omit`, `Record`, mapped types, `keyof`,
  indexed access `T["key"]`, template literal types, `bigint`, `unknown`,
  `object`, `symbol`, `void`, `never`.
- **Bounded recursion.** Self-referential and mutually recursive types are
  expanded up to `maxDepth` (default 3), then arrays become `[]` and objects
  `null`. The old engine looped forever on `interface Node { children: Node[] }`.
- **Seeded output.** `seed` (API field and `Interface2Mock` option) makes the
  mock repeatable, dates included; with `quantity > 1`, item _n_ uses
  `seed + n`.
- **Library options.** `new Interface2Mock(source, anyReturn, { seed, maxDepth })`
  and an exported `MockInputError` class for input problems.
- **More name heuristics** for realistic values: `uuid`/`guid`, `phone`,
  `username`, `password`, `city`, `country`, `company`, `title`,
  `zipCode`/`postalCode`, `website`.
- **Shared HTTP handler** (`core/http/mockHandler.ts`) used by `/api/mock` and
  `/api/typemocker`, with request validation and `bigint` serialized as strings.
- **Tests.** 57 engine and handler tests (parser, generator, feature matrix,
  HTTP) plus 11 app-level tests (API routes, 405, CORS scoping, redirect).
- **CI** (`.github/workflows/ci.yml`): `deno install`, `deno task check`
  (format, lint, type check, tests) and `deno task build` on a pinned Deno
  version.
- **Tasks**: `dev`, `build`, `start`, `test`, `check`, `update`.
- `CLAUDE.md` with commands and an architecture overview for AI-assisted work.
- `CHANGELOG.md` (this file).

### Changed

- **Fresh 1.3.1 to Fresh 2.3.3** with Vite 7: `main.ts` builds an `App`
  (`createApp()` in `app.ts`), routes use the Fresh 2 handler API, page
  metadata lives in `routes/_app.tsx`, the 404 page is `routes/_error.tsx`,
  CORS on `/api/mock` uses Fresh's built-in `cors()` middleware scoped to that
  path, and methods other than `POST` on the API routes answer `405`.
- **Styling** moved from twind to Tailwind CSS 4 through `@tailwindcss/vite`;
  the custom `monaco` grey palette is defined as theme tokens in
  `assets/styles.css`, so existing class names are unchanged.
- **Dependencies** come from `jsr:`/`npm:` specifiers (Fresh, Preact 10.29,
  Signals 2.9, Vite, Tailwind, Faker 8.4, TypeScript 5.6, `@std/assert`) with a
  committed `deno.lock`; no more `deno.land`/`esm.sh` URLs.
- `\;` and `\:` escapes inside fixed strings are no longer required but are
  still accepted.
- `buildMock()` returns a clone of the generated value and also lists enums;
  keys are ordered interfaces, then type aliases, then enums.
- `/api/typemocker` no longer logs the submitted source.
- README restructured: quick start (web, API, library), API reference with
  request/response tables, a "Supported TypeScript" table, limitations, FAQ
  and a development section.
- Monaco editor globals are typed through `components/monaco.ts`; the island
  and `EditorResponse` are otherwise unchanged.

### Fixed

- `bigint` members always produced `null` because of a casing mismatch; they
  now produce a `BigInt` (serialized as a string by the API).
- `keyof` applied to an interface returned a random word instead of one of its
  keys.
- Method signatures and index signatures no longer abort processing of the
  remaining members of a declaration.
- Property names such as `hidden` or `video` no longer receive UUIDs; the UUID
  rule now matches the word `id`, `uuid` or `guid`.
- `valueForAny` can be omitted (defaults to `null`) instead of causing a `500`.

### Removed

- The regex-based engine: `core/utils/typeValidation.ts`,
  `core/constants/ValidTypes.ts`, `core/utils/randNumber.ts`.
- Fresh 1 files: `dev.ts`, `fresh.gen.ts`, `twind.config.ts`,
  `routes/_404.tsx`, `routes/api/mock/_middleware.ts`, `static/global.css`.
- The outdated bad-formatting screenshot from `doc/assets`.

## Earlier history

Changes before 2026-10-12 (the original regex-based engine, the Fresh 1.3 web
UI and the public API) were not tracked in a changelog; see the git history.
