import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
} from "@std/assert";
import type { App } from "fresh";
import { createApp } from "../app.ts";
import type { State } from "../utils.ts";
import { handler as mockHandler } from "../routes/api/mock/index.ts";
import { handler as typemockerHandler } from "../routes/api/typemocker/index.ts";
import Home, { handler as indexHandler } from "../routes/index.tsx";
import AppWrapper from "../routes/_app.tsx";

// `define.page` components are typed with `data: never`, which `App` does not
// accept for `appWrapper()`/`route()`. They are plain components at runtime.
type RouteComponent = Parameters<App<State>["appWrapper"]>[0];

// Mirrors what `fsRoutes()` registers, with the real route modules. The Vite
// build is not needed, so these tests run with a plain `deno test`.
const handler = createApp()
  .appWrapper(AppWrapper as unknown as RouteComponent)
  .all("/api/mock", mockHandler)
  .all("/api/typemocker", typemockerHandler)
  .route("/", {
    component: Home as unknown as RouteComponent,
    handler: indexHandler,
  })
  .handler();

const SOURCE = "interface User { id: string; name: string }";

const post = (path: string, headers: HeadersInit = {}) =>
  handler(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ value: SOURCE, seed: 1 }),
    }),
  );

for (const path of ["/api/mock", "/api/typemocker"]) {
  Deno.test(`POST ${path} mocks the source`, async () => {
    const res = await post(path);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Object.keys(body), ["User"]);
    assertEquals(Object.keys(body.User), ["id", "name"]);
  });

  Deno.test(`POST ${path} answers 400 for invalid input`, async () => {
    const res = await handler(
      new Request(`http://localhost${path}`, { method: "POST", body: "nope" }),
    );
    assertEquals(res.status, 400);
    assertEquals(typeof (await res.json()).error, "string");
  });

  Deno.test(`GET ${path} answers 405`, async () => {
    const res = await handler(new Request(`http://localhost${path}`));
    assertEquals(res.status, 405);
    assertEquals(res.headers.get("allow"), "POST");
    await res.body?.cancel();
  });
}

Deno.test("/api/mock sends CORS headers on POST responses", async () => {
  const res = await post("/api/mock", { origin: "https://example.com" });
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assertStringIncludes(
    res.headers.get("access-control-allow-methods") ?? "",
    "POST",
  );
  assertStringIncludes(
    res.headers.get("access-control-allow-headers") ?? "",
    "Content-Type",
  );
  await res.body?.cancel();
});

Deno.test("OPTIONS /api/mock answers the preflight with 204", async () => {
  const res = await handler(
    new Request("http://localhost/api/mock", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    }),
  );
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assertStringIncludes(
    res.headers.get("access-control-allow-methods") ?? "",
    "POST",
  );
  assertStringIncludes(
    res.headers.get("access-control-allow-headers") ?? "",
    "Content-Type",
  );
});

Deno.test("/api/typemocker has no CORS headers", async () => {
  const origin = "https://example.com";
  const res = await post("/api/typemocker", { origin });
  assertEquals(res.headers.get("access-control-allow-origin"), null);
  assertEquals(res.headers.get("access-control-allow-methods"), null);
  await res.body?.cancel();

  const preflight = await handler(
    new Request("http://localhost/api/typemocker", {
      method: "OPTIONS",
      headers: { origin, "access-control-request-method": "POST" },
    }),
  );
  assert(preflight.status !== 204);
  assertEquals(preflight.headers.get("access-control-allow-origin"), null);
  await preflight.body?.cancel();
});

Deno.test("GET / on butlermock.deno.dev redirects to butlermock.online", async () => {
  const res = await handler(new Request("http://butlermock.deno.dev/"));
  assertEquals(res.status, 301);
  assertEquals(res.headers.get("location"), "https://butlermock.online/");
  await res.body?.cancel();
});

Deno.test("GET / on any other host renders the page", async () => {
  for (const host of ["localhost", "butlermock.online"]) {
    const res = await handler(new Request(`http://${host}/`));
    assertEquals(res.status, 200);
    const html = await res.text();
    assertStringIncludes(html, "<title>Butlermock</title>");
    assertMatch(html, /<meta name="description" content="Interface to JSON/);
    assertStringIncludes(html, "Just type that mock!");
    assertStringIncludes(
      html,
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js",
    );
    assertStringIncludes(html, "/script/load-editor.js");
  }
});
