# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Butlermock turns TypeScript `interface`/`type`/`enum` source text into mock JSON populated with Faker.js data. It is a Deno + Fresh 1.3 app (Preact, twind) with a pure-TypeScript mocking engine in `core/`. There is no Node or package.json; dependencies resolve through the import map in `deno.json` (`lock: false`, so there is no lockfile). Fresh, Preact and twind come from deno.land/esm.sh URLs; the engine's dependencies use `npm:` (`@faker-js/faker`, `typescript`) and `jsr:` (`@std/assert`, tests only) specifiers.

## Commands

```bash
deno task start        # dev server with --watch on static/ and routes/; regenerates fresh.gen.ts
deno task test         # deno test core/ (all engine and HTTP handler tests, with type checking)
deno task check        # deno fmt --check && deno lint && deno test core/ (what CI runs)
deno test core/class/TypeMocker.test.ts --filter "Providing nested Interface"   # single test
deno lint              # rules: "fresh" + "recommended"; islands/, components/, static/ are excluded
deno fmt               # proseWrap "preserve"; islands/, components/, static/ are excluded
deno task update       # upgrade Fresh via the official updater
```

CI (`.github/workflows/ci.yml`) runs fmt check, lint and `deno test core/` on a pinned Deno version. Only `core/` is tested: routes and islands import `$fresh/` and cannot be exercised without the Fresh runtime, so request handling lives in `core/http/` where it can be tested with a plain `Request`. Changes to `routes/`, `islands/` or `static/` are verified by running `deno task start` and using the page; the app runs on Deno 2 (CI uses 2.9.7) and Deno 1.46.

When the engine gains or loses a capability, update the "Supported TypeScript" and "Limitations" tables in `README.md` in the same change; they are the user-facing contract.

Editor setup expects the `denoland.vscode-deno` extension (see `.vscode/settings.json`); formatting is Deno's formatter, not Prettier.

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

### HTTP layer (`routes/` and `core/http/`)

- `core/http/mockHandler.ts` (`handleMockRequest(req)`) holds all request handling: it validates `{ value, valueForAny, mustReturn, quantity, seed }`, builds the mocks and serializes them. Input problems (bad JSON, non-string or > 100 KB `value`, unparsable `valueForAny`, `quantity` outside 1-10, non-integer `seed`, any `MockInputError`) answer 400 with `{ error }`; anything else answers 500. `quantity > 1` returns an array, each item seeded with `seed + i` when a seed is given. Tests in `core/http/mockHandler.test.ts` call it with a `Request` directly.
- `routes/api/mock/index.ts` (public API documented in the README) and `routes/api/typemocker/index.ts` (used by the web UI) are one-line wrappers around `handleMockRequest`; keep them that way. `routes/api/mock/_middleware.ts` adds permissive CORS (`*`, POST) and answers OPTIONS for `/api/mock` only.
- `routes/index.tsx` 301-redirects requests on `butlermock.deno.dev` to `https://butlermock.online` and otherwise renders the landing page.

### Web UI

- `islands/EditorView.tsx` is the only island. It does not own the editors: Monaco is loaded from a CDN by `static/script/load-editor.js`, which creates two global instances, `theEditor` (TypeScript input) and `previewer` (read-only JSON output). The island and `components/EditorResponse.tsx` reach them via `declare var`. The island waits 500ms after mount before wiring Monaco events, and detects interface/type names with its own regex to populate the name datalist.
- `fresh.gen.ts` is generated by `dev.ts`; never edit it by hand, but do commit it after adding routes or islands.
- Styling is twind (Tailwind-style classes); the custom `monaco` grey palette lives in `twind.config.ts`.

## Import map aliases

`@core/` -> `./core/`. `@private/` -> `./private/` is declared but that directory is not in the repo.
