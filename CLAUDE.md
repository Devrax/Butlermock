# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Butlermock turns TypeScript `interface`/`type`/`enum` source text into mock JSON populated with Faker.js data. It is a Deno + Fresh 2.3 app (Preact, Vite, Tailwind CSS 4) with a pure-TypeScript mocking engine in `core/`. There is no `package.json`; dependencies resolve through the import map in `deno.json` with `"nodeModulesDir": "manual"` (Vite needs `node_modules`, so run `deno install` after cloning and after every `deno.json` change; `node_modules/` and `_fresh/` are git-ignored) and the lockfile `deno.lock` is committed. Fresh, Preact, Vite and Tailwind come from `jsr:`/`npm:` specifiers, as do the engine's dependencies (`@faker-js/faker`, `typescript`) and the test-only `@std/assert`. Do not add `deno.land` or `esm.sh` imports.

## Commands

```bash
deno install           # fetch dependencies and create node_modules (after cloning / changing deno.json)
deno task dev          # Vite dev server on :5173 with hot reload
deno task build        # vite build -> _fresh/ (client assets + generated server entry _fresh/server.js)
deno task start        # deno serve -A _fresh/server.js on :8000 (run build first)
deno task test         # deno test core/ (no permissions) && deno test --allow-env tests/
deno task check        # deno fmt --check && deno lint && deno check && deno task test (what CI runs)
deno test core/class/TypeMocker.test.ts --filter "Providing nested Interface"   # single test
deno lint              # rules: "fresh" + "recommended"; only static/script/load-editor.js is excluded
deno fmt               # proseWrap "preserve"; static SVGs, HTML and fonts/ are excluded
deno task update       # upgrade Fresh via the official updater
```

CI (`.github/workflows/ci.yml`) runs `deno install`, `deno task check` and `deno task build` on a pinned Deno version (2.9.7). The app requires Deno 2. Two test suites exist: `core/` (engine and `handleMockRequest`, runs without permissions, which also guards that loading the TypeScript compiler needs no `--allow-env`) and `tests/` (app level: builds an `App` from `createApp()` in `app.ts` plus the real route modules and calls it with plain `Request`s, so no build is needed; it needs `--allow-env` because Fresh reads build metadata from the environment). Islands, styling and `static/` are verified by running `deno task dev`, or `deno task build` + `deno task start`, and using the page.

When the engine gains or loses a capability, update the "Supported TypeScript" and "Limitations" tables in `README.md` in the same change; they are the user-facing contract.

Editor setup expects the `denoland.vscode-deno` and `bradlc.vscode-tailwindcss` extensions (see `.vscode/`); formatting is Deno's formatter, not Prettier.

## Architecture

### The mocking engine (`core/`)

The engine is split into a parser (source text -> type model) and a generator (type model -> values), with `Interface2Mock` as the facade.

- `core/class/TypeMocker.ts` exports `Interface2Mock(source, anyReturn = null, { seed?, maxDepth? })` and `MockInputError`. The constructor parses the source, creates its own Faker instance (seeded when `seed` is given, with a fixed reference date so dates repeat too) and mocks **every** declaration once, eagerly. `buildMock(name?)` returns a clone of one declaration's value, or an object keyed by every declaration name (interfaces, then type aliases, then enums, each in source order; existing tests depend on interfaces coming first). The thrown messages `No interfaces or types were found`, `Not matches for key '<name>' in [<names>]` and `... it seems empty, you cannot provide empty interface.` are relied on by tests and API users.
- `core/parser/parser.ts` (`parseSource`) runs `ts.createSourceFile` (syntax only, no program or type checker) and converts every top-level `interface`, `type` and `enum` (also inside `namespace`/`declare module` blocks) into the model in `core/parser/model.ts`. Repeated interfaces merge; any syntax error throws `MockInputError` with line/column. A backslash before `;` or `:` is stripped first, for inputs written for the old engine, which required `\;`/`\:` inside string literals. Method, call and construct signatures are dropped; types the model does not cover become `unsupported` nodes.
- `core/parser/typescript.ts` is the only place that imports the compiler. It loads `core/parser/ts_sys_guard.ts` first, which sets `process.browser` while TypeScript initializes so the compiler skips its Node `sys` setup; otherwise loading it reads env vars and `deno test` would need `--allow-env`. Import TypeScript through this module, never directly.
- `core/generator/generator.ts` (`MockGenerator`) walks the model. Object-like types (inline objects, interfaces with `extends`, intersections, mapped types, `Partial`/`Required`/`Readonly`/`Pick`/`Omit`/`Record`) are first resolved to a "shape" (property -> type + scope), then generated. Generic type parameters are bound per declaration in a scope (arguments, then defaults, otherwise unresolved -> `anyReturn`). Recursion is bounded by counting how often a declaration is already on the current expansion path: at `maxDepth` (default 3) the reference yields an internal `CUT` marker that becomes `[]` in arrays and `null` elsewhere; unions retry other members before accepting a cut one. Unknown plain references become `null`; unknown generic wrappers (`Promise<T>`, `Map<K, V>`), `typeof`, conditional types etc. become `anyReturn`. Arrays get 1-5 items, index signatures 1-3 keys. Every random choice goes through the injected Faker instance, never `Math.random`, so seeds stay deterministic.
- `core/utils/dynamicValue.ts` (`checkConstant`) maps a scalar type name (`string`, `number`, `bigint`, `boolean`, `Date`, `null`, `undefined`, `any`, `unknown`, `object`, `symbol`, ...) to a Faker value; `any`/`unknown` return `anyReturn`. Add new scalar keywords here.
- `core/utils/strings.ts` picks Faker generators from the **property name** (word `id`/`uuid`/`guid` -> uuid, contains `email`, `url`, `avatar`, `image/img/thumbnail`, `phone`, `username`, `password`, plus an exact-match table for `name`, `firstName`, `address`, `city`, `company`, `bio`, etc.). This is why mock data looks realistic without any type annotation.

Library output can contain `bigint` and `Date` values; the HTTP layer serializes bigints as strings and dates as ISO strings.

### HTTP layer (`routes/`, `app.ts`, `utils.ts` and `core/http/`)

- `core/http/mockHandler.ts` (`handleMockRequest(req)`) holds all request handling: it validates `{ value, valueForAny, mustReturn, quantity, seed }`, builds the mocks and serializes them. Input problems (bad JSON, non-string or > 100 KB `value`, unparsable `valueForAny`, `quantity` outside 1-10, non-integer `seed`, any `MockInputError`) answer 400 with `{ error }`; anything else answers 500. `quantity > 1` returns an array, each item seeded with `seed + i` when a seed is given. Tests in `core/http/mockHandler.test.ts` call it with a `Request` directly.
- `utils.ts` exports `define` (`createDefine<State>()`) and `mockApiHandler`: `POST` goes to `handleMockRequest(ctx.req)`, every other method answers 405 with `Allow: POST` (Fresh 2 would answer 404 for a route without a handler for the method). `routes/api/mock/index.ts` (public API documented in the README) and `routes/api/typemocker/index.ts` (used by the web UI) are one-line `export const handler = mockApiHandler`; keep them that way.
- `app.ts` exports `createApp()` (a `new App<State>()` with CORS mounted on `/api/mock` only) and `mockCors`: Fresh's built-in `cors()` (origin `*`, methods `POST`, headers `Content-Type`, answers `OPTIONS` with 204) plus a small middleware that also puts the method/header allow-lists on actual responses, as the old middleware did. `/api/typemocker` has no CORS headers. `main.ts` is the server entry: `createApp()` + `staticFiles()` + `fsRoutes()`. It is kept separate from `app.ts` because `fsRoutes()` needs the Vite build; `tests/app.test.tsx` mounts the real route modules on `createApp()` instead.
- `routes/index.tsx`: its `GET` handler 301-redirects requests whose host is `butlermock.deno.dev` to `https://butlermock.online/` and otherwise returns `page()`. `routes/_app.tsx` is the HTML shell (all meta/Open Graph/favicon/font tags and the Clicky and Buy Me a Coffee scripts, `<body class="bg-monaco-950 ...">`). `routes/_error.tsx` renders the 404 page (`HttpError` with status 404) or a generic error page.
- `vite.config.ts` sets `server.cors: false` so Vite's dev server does not answer CORS preflights before Fresh does.

### Web UI

- `islands/EditorView.tsx` is the only island. It does not own the editors: Monaco is loaded from a CDN by `static/script/load-editor.js`, which creates two global instances, `theEditor` (TypeScript input) and `previewer` (read-only JSON output), both `null` until Monaco has loaded. The island and `components/EditorResponse.tsx` reach them through the `declare global` block in `components/monaco.ts` (a minimal `MonacoEditor` interface). The island waits 500ms after mount before wiring Monaco events, and detects interface/type names with its own regex to populate the name datalist.
- There is no generated manifest: Fresh 2 discovers routes and islands during `vite build`/`vite dev`, and the production server entry is `_fresh/server.js` (output of the build, git-ignored). Deno Deploy runs `deno task build` and serves `_fresh/server.js`.
- Styling is Tailwind CSS 4 through `@tailwindcss/vite`: `client.ts` imports `assets/styles.css`, which holds `@import "tailwindcss"`, the custom `monaco` grey palette as `--color-monaco-50` ... `--color-monaco-950` theme tokens (so `bg-monaco-950`, `text-monaco-50` etc. work) and the few global rules. Other static assets stay in `static/` and are served by `staticFiles()`.

## Import map aliases

`@core/` -> `./core/`. Everything else in `deno.json` `imports` is a bare `jsr:`/`npm:` specifier (`fresh`, `preact`, `@preact/signals`, `vite`, `tailwindcss`, ...); `@types/node` is listed because `core/parser/ts_sys_guard.ts` imports `node:process` and `deno check` resolves its types from `node_modules`.
