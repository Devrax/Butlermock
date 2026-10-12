import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
  assertThrows,
} from "@std/assert";
import Interface2Mock, { MockInputError } from "@core/class/TypeMocker.ts";

type Obj = Record<string, unknown>;

/** Builds `name` from `source` with a fixed seed so failures are reproducible. */
const mockOf = <T = Obj>(
  source: string,
  name: string,
  anyReturn: unknown = null,
  seed = 1,
) => new Interface2Mock(source, anyReturn, { seed }).buildMock(name) as T;

/** Collects one generated value per seed, to check what a union can produce. */
const sample = (source: string, name: string, pick: (mock: Obj) => unknown) =>
  Array.from(
    { length: 60 },
    (_, seed) => pick(mockOf(source, name, null, seed)),
  );

Deno.test("inline object literals, nested and in arrays", () => {
  const mock = mockOf<{
    hello: string;
    cursed: { damn: string; deeper: { level: number } }[];
  }>(
    `interface Greeting {
      hello: string;
      cursed: {
        damn: string;
        deeper: { level: number };
      }[];
    }`,
    "Greeting",
  );
  assertEquals(typeof mock.hello, "string");
  assert(Array.isArray(mock.cursed) && mock.cursed.length >= 1);
  for (const item of mock.cursed) {
    assertEquals(typeof item.damn, "string");
    assertEquals(typeof item.deeper.level, "number");
  }
});

Deno.test("array forms and tuples", () => {
  const mock = mockOf<{
    a: string[];
    b: Array<number>;
    c: boolean[][];
    d: ReadonlyArray<string>;
    e: readonly number[];
    f: [string, number];
    g: [name: string, age?: number];
    h: [string, ...boolean[]];
  }>(
    `interface Lists {
      a: string[];
      b: Array<number>;
      c: boolean[][];
      d: ReadonlyArray<string>;
      e: readonly number[];
      f: [string, number];
      g: [name: string, age?: number];
      h: [string, ...boolean[]];
    }`,
    "Lists",
  );
  assert(mock.a.every((v) => typeof v === "string"));
  assert(mock.b.every((v) => typeof v === "number"));
  assert(mock.c.every((row) => row.every((v) => typeof v === "boolean")));
  assert(mock.d.every((v) => typeof v === "string"));
  assert(mock.e.every((v) => typeof v === "number"));
  assertEquals(mock.f.length, 2);
  assertEquals([typeof mock.f[0], typeof mock.f[1]], ["string", "number"]);
  assertEquals([typeof mock.g[0], typeof mock.g[1]], ["string", "number"]);
  assertEquals(typeof mock.h[0], "string");
  assert(mock.h.slice(1).every((v) => typeof v === "boolean"));
});

Deno.test("literal unions pick one of the literals", () => {
  const source = `interface U { kind: "a" | 'b' | 3 | true }`;
  const values = new Set(sample(source, "U", (m) => m.kind));
  for (const value of values) {
    assert(["a", "b", 3, true].includes(value as never));
  }
  assert(values.size > 1);
});

Deno.test("type unions pick a supported member and may yield null", () => {
  const source = `interface U {
    value: string | number | NotDeclaredAnywhere;
    maybe: string | null;
  }`;
  const values = sample(source, "U", (m) => m.value);
  assert(values.every((v) => typeof v === "string" || typeof v === "number"));
  assert(values.some((v) => typeof v === "string"));
  assert(values.some((v) => typeof v === "number"));

  const maybes = sample(source, "U", (m) => m.maybe);
  assert(maybes.some((v) => v === null));
  assert(maybes.some((v) => typeof v === "string"));
});

Deno.test("intersections merge their members", () => {
  const mock = mockOf(
    `interface A { a: string; shared: number }
     interface B { b: boolean; shared: string }
     type AB = A & B & { c: number };`,
    "AB",
  );
  assertEquals(Object.keys(mock), ["a", "shared", "b", "c"]);
  assertEquals(typeof mock.shared, "string");
});

Deno.test("extends with several parents and type extension", () => {
  const source = `
    interface Named { name: string }
    interface Aged { age: number }
    interface Person extends Named, Aged { email: string }
    type Employee = Person & { company: string };
  `;
  assertEquals(Object.keys(mockOf(source, "Person")), ["name", "age", "email"]);
  assertEquals(
    Object.keys(mockOf(source, "Employee")),
    ["name", "age", "email", "company"],
  );
});

Deno.test("generics, defaults and unresolved type parameters", () => {
  const source = `
    interface Box<T> { value: T }
    interface Pair<K = string, V = K> { key: K; value: V }
    interface Uses {
      text: Box<string>;
      flags: Box<boolean[]>;
      nested: Box<Box<number>>;
      pair: Pair;
      numbers: Pair<number>;
    }
  `;
  const mock = mockOf<{
    text: { value: unknown };
    flags: { value: unknown[] };
    nested: { value: { value: unknown } };
    pair: { key: unknown; value: unknown };
    numbers: { key: unknown; value: unknown };
  }>(source, "Uses");
  assertEquals(typeof mock.text.value, "string");
  assert(mock.flags.value.every((v) => typeof v === "boolean"));
  assertEquals(typeof mock.nested.value.value, "number");
  assertEquals([typeof mock.pair.key, typeof mock.pair.value], [
    "string",
    "string",
  ]);
  assertEquals([typeof mock.numbers.key, typeof mock.numbers.value], [
    "number",
    "number",
  ]);
  // Used directly, `Box` has nothing to bind `T` to.
  assertEquals(mockOf<unknown>(source, "Box", "ANY"), { value: "ANY" });
});

Deno.test("index signatures emit 1-3 keys; method signatures are skipped", () => {
  const source = `interface Dictionary {
    fixed: string;
    [key: string]: number | string;
  }
  interface WithMethods {
    before: string;
    method(): void;
    other(arg: string): number;
    callback: () => void;
    after: number;
  }`;
  for (let seed = 0; seed < 20; seed++) {
    const dictionary = mockOf(source, "Dictionary", null, seed);
    const extra = Object.keys(dictionary).filter((key) => key !== "fixed");
    assert(extra.length >= 1 && extra.length <= 3, `${extra.length} keys`);
    assertEquals(typeof dictionary.fixed, "string");
  }
  assertEquals(Object.keys(mockOf(source, "WithMethods")), ["before", "after"]);
});

Deno.test("modifiers, optional members and comments", () => {
  const mock = mockOf(
    `/** docs */
    export declare interface Modifiers {
      readonly id: string; // trailing comment
      /* inline */ optional?: number
      'quoted-key': boolean,
      42: string
    }`,
    "Modifiers",
  );
  assertEquals(Object.keys(mock).sort(), [
    "42",
    "id",
    "optional",
    "quoted-key",
  ]);
  assertEquals(typeof mock.optional, "number");
});

Deno.test("enums pick a member value", () => {
  const source = `
    enum Color { Red, Green = 5, Blue }
    const enum Direction { Up = "UP", Down = "DOWN" }
    interface Uses { color: Color; direction: Direction; green: Color.Green }
  `;
  const colors = new Set(sample(source, "Uses", (m) => m.color));
  for (const color of colors) assert([0, 5, 6].includes(color as number));
  const directions = new Set(sample(source, "Uses", (m) => m.direction));
  assertEquals([...directions].sort(), ["DOWN", "UP"]);
  assertEquals(mockOf(source, "Uses").green, 5);
  assert(["UP", "DOWN"].includes(mockOf<string>(source, "Direction")));
});

Deno.test("built-in utility types", () => {
  const source = `
    interface User { id: string; name: string; age: number }
    type A = Partial<User>;
    type B = Required<User>;
    type C = Readonly<User>;
    type D = Pick<User, "id" | "age">;
    type E = Omit<User, "age">;
    type F = Record<"x" | "y", number>;
    type G = Record<string, boolean>;
    type H = Promise<User>;
    type I = keyof User;
  `;
  const keys = (name: string) => Object.keys(mockOf(source, name));
  assertEquals(keys("A"), ["id", "name", "age"]);
  assertEquals(keys("B"), ["id", "name", "age"]);
  assertEquals(keys("C"), ["id", "name", "age"]);
  assertEquals(keys("D"), ["id", "age"]);
  assertEquals(keys("E"), ["id", "name"]);
  assertEquals(keys("F"), ["x", "y"]);
  const record = mockOf(source, "G");
  assert(Object.keys(record).length >= 1);
  assert(Object.values(record).every((v) => typeof v === "boolean"));
  assertEquals(mockOf<unknown>(source, "H", "ANY"), "ANY");
  assert(["id", "name", "age"].includes(mockOf<string>(source, "I")));
});

Deno.test("scalar types and literals", () => {
  const mock = mockOf(
    `interface Scalars {
      s: string; n: number; big: bigint; b: boolean; d: Date;
      nul: null; undef: undefined; a: any; u: unknown; o: object; sym: symbol;
      yes: true; no: false; neg: -1; num: 42; text: "fixed"; bigLiteral: 10n;
      template: \`order-\${number}\`;
    }`,
    "Scalars",
    "ANY",
  );
  assertEquals(typeof mock.s, "string");
  assertEquals(typeof mock.n, "number");
  assertEquals(typeof mock.big, "bigint");
  assertEquals(typeof mock.b, "boolean");
  assertInstanceOf(mock.d, Date);
  assertEquals(mock.nul, null);
  assertEquals(mock.undef, null);
  assertEquals(mock.a, "ANY");
  assertEquals(mock.u, "ANY");
  assertEquals(mock.o, {});
  assertEquals(typeof mock.sym, "string");
  assertEquals(
    [mock.yes, mock.no, mock.neg, mock.num, mock.text, mock.bigLiteral],
    [true, false, -1, 42, "fixed", 10n],
  );
  assert(/^order-\d+$/.test(mock.template as string));
});

Deno.test("self-referential and mutually recursive types are depth-bounded", () => {
  const source = `
    interface TreeNode { id: string; children: TreeNode[]; parent?: TreeNode }
    interface Ping { pong: Pong }
    interface Pong { ping: Ping }
  `;
  const depth = (node: Obj | null): number =>
    node === null ? 0 : 1 + Math.max(
      0,
      depth(node.parent as Obj | null),
      ...(node.children as Obj[]).map(depth),
    );
  for (let seed = 0; seed < 5; seed++) {
    assertEquals(depth(mockOf(source, "TreeNode", null, seed)), 3);
  }
  assertEquals(mockOf(source, "Ping"), {
    pong: { ping: { pong: { ping: { pong: { ping: null } } } } },
  });
  const shallow = new Interface2Mock(source, null, { maxDepth: 1 });
  assertEquals((shallow.buildMock("TreeNode") as Obj).children, []);
  assertEquals((shallow.buildMock("TreeNode") as Obj).parent, null);
});

Deno.test("seed makes the output deterministic", () => {
  const source =
    `interface User { id: string; name: string; tags: string[]; at: Date }`;
  const build = (seed: number) =>
    new Interface2Mock(source, null, { seed }).buildMock();
  assertEquals(build(7), build(7));
  assertNotEquals(build(7), build(8));
  assertThrows(
    () => new Interface2Mock(source, null, { seed: 1.5 }),
    MockInputError,
  );
  assertThrows(
    () => new Interface2Mock(source, null, { maxDepth: 0 }),
    MockInputError,
  );
});

Deno.test("legacy escapes and missing separators still work", () => {
  const mock = mockOf(
    `interface Legacy {
      url: "https\\://example.com"
      text: "semi\; colon\\: done"
      a: string, b: number
    }`,
    "Legacy",
  );
  assertEquals(mock.url, "https://example.com");
  assertEquals(mock.text, "semi; colon: done");
  assertEquals(Object.keys(mock), ["url", "text", "a", "b"]);
});

Deno.test("buildMock() is keyed by every declaration", () => {
  const mock = new Interface2Mock(`
    type Name = string;
    enum Level { Low, High }
    interface User { name: Name; level: Level }
    type Tags = string[];
  `);
  assertEquals(Object.keys(mock.buildMock()), [
    "User",
    "Name",
    "Tags",
    "Level",
  ]);
  assert(Array.isArray(mock.buildMock("Tags")));
});

Deno.test("input errors are reported as MockInputError", () => {
  assertThrows(
    () => new Interface2Mock("interface Broken { a: string"),
    MockInputError,
    "Unable to parse the TypeScript source",
  );
  assertThrows(
    () => new Interface2Mock("interface Empty {}"),
    MockInputError,
    "it seems empty",
  );
  assertThrows(
    () => new Interface2Mock("type Empty = {};"),
    MockInputError,
    "it seems empty",
  );
  assertThrows(
    () => new Interface2Mock("const a = 1;"),
    MockInputError,
    "No interfaces or types were found",
  );
  assertThrows(
    () => new Interface2Mock("interface A { a: string }").buildMock("B"),
    MockInputError,
    "Not matches for key 'B' in [A]",
  );
  // An interface that only extends another one is not empty.
  const extended = new Interface2Mock(
    "interface A { a: string } interface B extends A {}",
  );
  assertEquals(Object.keys(extended.buildMock("B") as Obj), ["a"]);
});
