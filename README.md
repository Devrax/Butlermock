# Butlermock

[![Made with Fresh](https://fresh.deno.dev/fresh-badge-dark.svg)](https://fresh.deno.dev)
[![CI](https://github.com/Devrax/Butlermock/actions/workflows/ci.yml/badge.svg)](https://github.com/Devrax/Butlermock/actions/workflows/ci.yml)

<a href="https://www.buymeacoffee.com/devrafx" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 37px !important;width: 170px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

Paste TypeScript `interface`, `type` and `enum` declarations, get back JSON mock data filled with realistic values from [Faker](https://fakerjs.dev/). No AI involved: the source is read with the TypeScript parser and every member is mocked from its type and its name (`email` gets an email, `id` gets a UUID, `createdAt` gets a date).

```typescript
interface User {
  id: string;
  email: string;
  role: "admin" | "member";
  createdAt: Date;
  tags: string[];
}
```

```json
{
  "User": {
    "id": "4a4a0ac6-4e4a-4b8b-9a08-2fd6a1b3c0f7",
    "email": "Sonia_Johnson41@yahoo.com",
    "role": "member",
    "createdAt": "2027-07-06T18:44:35.507Z",
    "tags": ["tandem", "delibero", "bardus"]
  }
}
```

## Table of contents

- [Quick start](#quick-start)
  - [Web](#web)
  - [HTTP API](#http-api)
  - [As a library](#as-a-library)
- [API reference](#api-reference)
- [Supported TypeScript](#supported-typescript)
- [Limitations](#limitations)
- [FAQ](#faq)
- [Development](#development)

## Quick start

### Web

Open https://butlermock.online/, paste your declarations in the left editor and press the play button. The mock shows up in the right editor.

![Butlermock's landing](doc/assets/landing.png)

![button guide](doc/assets/buttons.png)

- **play** builds the mock (pasting into the editor also builds it).
- **clipboard** copies the mock.
- **X** clears both editors.
- **any** chooses the value used for `any`/`unknown` members.
- The text field filters the output to one declaration (it autocompletes with the names found in the editor) and the number field returns an array of that many mocks.

### HTTP API

```typescript
fetch("https://butlermock.online/api/mock", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    value: `interface Test { Hello: "World!"; }`,
    mustReturn: "Test",
  }),
})
  .then((res) => res.json())
  .then(console.log); // { "Hello": "World!" }
```

```bash
curl -X POST https://butlermock.online/api/mock \
  -H 'content-type: application/json' \
  -d '{"value":"interface Test { Hello: \"World!\"; }","quantity":2,"seed":1}'
```

The endpoint allows cross-origin requests from any site, so you can call it straight from a browser app. Nothing you send is stored.

### As a library

The engine has no dependency on the web app and can be used directly from this repository (a standalone package is [under construction](https://github.com/Devrax/Butlermock-package)):

```typescript
import Interface2Mock from "./core/class/TypeMocker.ts";

const mock = new Interface2Mock(`
  interface Greeting {
    hello: string;
    cursed: { damn: string }[];
  }
`);

mock.buildMock("Greeting"); // { hello: "...", cursed: [{ damn: "..." }, ...] }
mock.buildMock(); // { Greeting: { ... } }, one key per interface/type/enum

// Second argument: the value used for `any`/`unknown`.
// Third argument: a seed for repeatable output and the recursion limit.
new Interface2Mock(source, null, { seed: 42, maxDepth: 3 });
```

Invalid input throws `MockInputError` (exported from the same module) with a message that includes the line and column of a syntax error.

## API reference

`POST /api/mock` with a JSON body:

| field         | required | description                                                                                                                                      |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`       | yes      | TypeScript source with your interfaces, types and enums. Up to 100 KB.                                                                           |
| `mustReturn`  | no       | Name of the declaration to return. Empty or omitted returns an object keyed by every declaration (interfaces, then types, then enums).           |
| `quantity`    | no       | Integer from 1 to 10. Above 1 the response is an array of that many mocks. Defaults to 1.                                                        |
| `valueForAny` | no       | JSON text used for `any`/`unknown` members and unresolved generics, e.g. `"null"`, `"{}"`, `"\"text\""`. Defaults to `"null"`.                   |
| `seed`        | no       | Integer. The same seed and source always produce the same mock. With `quantity` above 1, item _n_ uses `seed + n`, so a batch is repeatable too. |

Responses:

| status | body                     | when                                                                                                                                                                                                                                 |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 200    | the mock, or an array    | Success. `Date` values are ISO strings and `bigint` values are strings.                                                                                                                                                              |
| 400    | `{ "error": "message" }` | Malformed JSON, missing or oversized `value`, a syntax error in the source (the message names the line and column), an unknown `mustReturn`, `quantity` out of range, a non-integer `seed`, or `valueForAny` that is not valid JSON. |
| 500    | `{ "error": "message" }` | Anything unexpected.                                                                                                                                                                                                                 |

The response carries `Access-Control-Allow-Origin: *`, and `OPTIONS` preflight requests are answered with 204.

## Supported TypeScript

Anything the TypeScript parser accepts is read; comments, `export`, `declare`, `readonly` and optional `?` members are fine, and declarations inside `namespace` or `declare module` blocks are picked up too. Members do not need a trailing `;`.

| category     | supported                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Declarations | `interface` (also repeated ones, which merge), `type` aliases, `enum` (string and numeric; a random member is picked).                                                                                 |
| Inheritance  | `extends` with one or more parents, intersections `A & B & { extra: string }`.                                                                                                                         |
| Objects      | Nested interfaces and types, inline object literals at any depth, index signatures `[key: string]: T` (1 to 3 random keys).                                                                            |
| Collections  | `T[]`, `T[][]`, `Array<T>`, `ReadonlyArray<T>` (1 to 5 items), tuples `[string, number]`.                                                                                                              |
| Unions       | Literal unions pick one literal (`"a" \| "b"`, `1 \| 2`), type unions pick one member (`string \| number`), unions with `null`/`undefined` may yield `null`.                                           |
| Generics     | Type parameters with arguments and defaults, including generic interfaces that extend other generic interfaces. A parameter with neither argument nor default gets the `any` value.                    |
| Utilities    | `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, mapped types `{ [K in keyof T]: U }`, `keyof T`, indexed access `T["key"]`.                                                               |
| Scalars      | `string`, `number`, `bigint`, `boolean`, `Date`, `null`, `undefined`, `any`, `unknown`, `object`, `symbol`, literal values (`"text"`, `300`, `true`), template literal types (`` `user-${number}` ``). |
| Recursion    | Self-referential and mutually recursive types are expanded up to 3 levels (`maxDepth`), then arrays become `[]` and objects `null`.                                                                    |

A few examples that all work:

```typescript
enum Status {
  Active = "ACTIVE",
  Banned = "BANNED",
}

interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

interface Page<T, Cursor = string> {
  items: T[];
  next?: Cursor | null;
}

interface User extends Timestamps {
  id: string;
  status: Status;
  profile: { bio: string; links: Array<{ label: string; url: string }> };
  settings: Record<string, boolean>;
  friends: User[]; // recursion is cut after 3 levels
}

type UserPage = Page<User>;
type PublicUser = Omit<User, "settings">;
type UserKey = keyof User;
```

Fixed values are written as literal types, exactly as you would in TypeScript:

```typescript
interface ThisIsSparta {
  troops: 300;
  leader: "Leonidas";
  murderedBy: true;
}

interface MightBeSparta {
  troops: 200 | 594 | 2893 | 39;
  leader: "Trump" | "Me" | "You?";
  alive: boolean; // use `boolean` for a random true/false
}
```

Escaping `;` and `:` inside fixed strings (`"a\; b"`) was required by the previous engine. It is no longer needed but still accepted, so `"https\://example.com"` and `"https://example.com"` both produce `https://example.com`.

## Limitations

| case                     | example                                   | result                                                                                        |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Unknown types            | `owner: User` without declaring `User`    | `null`.                                                                                       |
| Unknown generic wrappers | `Promise<User>`, `Map<string, User>`      | The `any` value. Only the utilities listed above and the array forms are understood.          |
| Advanced type operators  | `typeof x`, conditional types, `infer`    | The `any` value.                                                                              |
| Functions                | `onClick(): void`, `callback: () => void` | Methods and call signatures are left out of the mock; function-typed properties are `null`.   |
| Classes                  | `class User { ... }`                      | Only `interface`, `type` and `enum` declarations are mocked.                                  |
| Empty declarations       | `interface Empty {}`                      | Rejected with an error.                                                                       |
| Numbers                  | `count: number`                           | Drawn from the whole safe-integer range. Use a literal union when you need a realistic range. |

## FAQ

**Is it using an AI?** No.

**Can I paste a whole file?** Yes, as long as it is valid TypeScript (JSX is not supported). Every `interface`, `type` and `enum` in it is detected, including the ones inside `namespace` blocks.

![Can I copy full code snippet and it will detect the interfaces?](doc/assets/IlustrationQuestion.png)

**How do I get the same mock twice?** Pass a `seed`. The same seed and source always return the same output, dates included.

**Why does `name` give a full name and `id` a UUID?** Values are picked from the member name as well as its type. Names containing `id`, `uuid`, `guid`, `email`, `url`, `avatar`, `image`, `phone`, `username` or `password`, and exact names such as `name`, `firstName`, `address`, `city`, `country`, `company` or `bio`, get matching Faker generators. Everything else gets lorem words.

## Development

Butlermock is a [Deno](https://deno.com/) + [Fresh](https://fresh.deno.dev/) 1.3 app. There is no Node toolchain or `package.json`; dependencies are resolved through the import map in `deno.json`. It runs on Deno 2 (CI uses 2.9.7) and has also been verified on Deno 1.46.

```bash
deno task start   # dev server on http://localhost:8000 with file watching
deno task test    # engine and HTTP handler tests (deno test core/)
deno task check   # fmt check + lint + tests, exactly what CI runs
deno fmt          # format
deno task update  # upgrade Fresh
```

Run a single test with `deno test core/class/TypeMocker.test.ts --filter "name of the test"`.

### Project layout

```
core/
  class/TypeMocker.ts     Interface2Mock, the public engine API
  parser/                 TypeScript source -> type model (uses the TypeScript compiler, syntax only)
  generator/              type model -> mock values (Faker)
  utils/                  scalar values and name-based heuristics
  http/mockHandler.ts     request validation and JSON responses, shared by both API routes
routes/
  api/mock/               public API (+ CORS middleware)
  api/typemocker/         same handler, used by the web UI
  index.tsx               landing page
islands/EditorView.tsx    the editor UI (Monaco is loaded from a CDN by static/script/load-editor.js)
static/                   assets
```

### Testing

Everything under `core/` is covered by unit tests, including the HTTP handler, which is tested by calling it with a plain `Request`. The routes and the island are thin wrappers that need the Fresh runtime, so changes to them are checked by running `deno task start` and using the page. `fresh.gen.ts` is generated by the dev server; commit it after adding routes or islands, never edit it by hand.

## License

[MIT](LICENSE)
