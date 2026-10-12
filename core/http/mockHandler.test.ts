import { assert, assertEquals, assertMatch } from "@std/assert";
import { handleMockRequest, MAX_SOURCE_BYTES } from "@core/http/mockHandler.ts";

const post = (body: unknown) =>
  handleMockRequest(
    new Request("http://localhost/api/mock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const source = `interface Test { Hello: "World!"; count: number; big: bigint }`;

Deno.test("http: returns every declaration by default", async () => {
  const res = await post({ value: source, valueForAny: "null" });
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/json");
  const body = await res.json();
  assertEquals(body.Test.Hello, "World!");
  // bigint values are serialized as strings.
  assertMatch(body.Test.big, /^\d+$/);
});

Deno.test("http: mustReturn, quantity and valueForAny", async () => {
  const res = await post({
    value: `interface A { a: any }`,
    valueForAny: '"lorem"',
    mustReturn: "A",
    quantity: 3,
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), [{ a: "lorem" }, { a: "lorem" }, {
    a: "lorem",
  }]);

  // The web UI sends `quantity: null` when its field is empty.
  const single = await post({
    value: `interface A { a: any }`,
    valueForAny: "{}",
    mustReturn: "A",
    quantity: null,
  });
  assertEquals(await single.json(), { a: {} });
});

Deno.test("http: seed gives repeatable output", async () => {
  const body = { value: source, mustReturn: "Test", seed: 42, quantity: 2 };
  const first = await (await post(body)).json();
  const second = await (await post(body)).json();
  assertEquals(first, second);
  assert(first[0].count !== first[1].count);
});

Deno.test("http: invalid input answers 400 with an error", async () => {
  const cases: [unknown, RegExp][] = [
    ["{not json", /valid JSON/],
    [[], /JSON object/],
    [{ valueForAny: "null" }, /`value` must be a string/],
    [
      { value: source, valueForAny: "{oops" },
      /`valueForAny` is not valid JSON/,
    ],
    [{ value: source, quantity: 0 }, /between 1 and 10/],
    [{ value: source, quantity: 11 }, /between 1 and 10/],
    [{ value: source, quantity: 2.5 }, /between 1 and 10/],
    [{ value: source, seed: "abc" }, /`seed` must be an integer/],
    [{ value: source, mustReturn: 3 }, /`mustReturn` must be a string/],
    [
      { value: "x".repeat(MAX_SOURCE_BYTES + 1) },
      /larger than 100 KB/,
    ],
    [{ value: "interface A { a: string" }, /Unable to parse/],
    [{ value: "" }, /No interfaces or types were found/],
    [{ value: source, mustReturn: "Nope" }, /Not matches for key 'Nope'/],
  ];
  for (const [body, error] of cases) {
    const res = await post(body);
    assertEquals(res.status, 400, `status for ${JSON.stringify(body)}`);
    assertMatch((await res.json()).error, error);
  }
});

Deno.test("http: accepts numeric strings for quantity", async () => {
  const res = await post({ value: source, mustReturn: "Test", quantity: "2" });
  assertEquals(res.status, 200);
  assertEquals((await res.json()).length, 2);
});
