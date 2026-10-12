import { assert, assertEquals } from "@std/assert";
import { base, en, Faker } from "@faker-js/faker";
import { MockGenerator } from "@core/generator/generator.ts";
import { parseSource } from "@core/parser/parser.ts";

const generator = (source: string, maxDepth = 3, seed = 1) => {
  const faker = new Faker({ locale: [en, base] });
  faker.seed(seed);
  return new MockGenerator(parseSource(source), {
    anyReturn: "ANY",
    maxDepth,
    faker,
  });
};

Deno.test("generator: unknown names are null, unknown generics use anyReturn", () => {
  const mock = generator(`interface A {
    missing: NotDeclared;
    wrapper: Promise<string>;
    conditional: string extends number ? 1 : 2;
  }`).generate("A");
  assertEquals(mock, { missing: null, wrapper: "ANY", conditional: "ANY" });
});

Deno.test("generator: recursion is cut at maxDepth", () => {
  const source =
    `type List = { value: number; next: List | null; all: List[] }`;
  const depth = (node: unknown): number => {
    if (node === null) return 0;
    const list = node as { next: unknown; all: unknown[] };
    return 1 + Math.max(depth(list.next), ...list.all.map(depth), 0);
  };
  for (const maxDepth of [1, 2, 4]) {
    assertEquals(depth(generator(source, maxDepth).generate("List")), maxDepth);
  }
});

Deno.test("generator: unions avoid members that hit the recursion limit", () => {
  const source = `type Json = string | Json[] | { [key: string]: Json }`;
  for (let seed = 0; seed < 20; seed++) {
    const leaves: unknown[] = [];
    const walk = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") {
        Object.values(value).forEach(walk);
      } else leaves.push(value);
    };
    walk(generator(source, 3, seed).generate("Json"));
    assert(leaves.every((leaf) => typeof leaf === "string"));
  }
});

Deno.test("generator: property names drive string values", () => {
  const mock = generator(`interface P {
    userId: string;
    email: string;
    avatarUrl: string;
    hidden: string;
  }`).generate("P") as Record<string, string>;
  assert(/^[0-9a-f-]{36}$/.test(mock.userId));
  assert(mock.email.includes("@"));
  assert(mock.avatarUrl.startsWith("http"));
  // "hidden" contains "id" but is not an id.
  assert(!/^[0-9a-f-]{36}$/.test(mock.hidden));
});

Deno.test("generator: mapped types and indexed access", () => {
  const mock = generator(`
    interface User { id: number; name: string }
    type Flags = { [K in keyof User]: boolean };
    type Copy = { [K in keyof User]: User[K] };
    type Name = User["name"];
  `);
  assertEquals(Object.keys(mock.generate("Flags") as object), ["id", "name"]);
  const copy = mock.generate("Copy") as Record<string, unknown>;
  assertEquals([typeof copy.id, typeof copy.name], ["number", "string"]);
  assertEquals(typeof mock.generate("Name"), "string");
});
