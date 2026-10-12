import { assertEquals, assertThrows } from "@std/assert";
import { parseSource } from "@core/parser/parser.ts";
import { MockInputError } from "@core/parser/errors.ts";

Deno.test("parser: interface members become a property model", () => {
  const declarations = parseSource(`
    interface User<T = string> extends Base<T> {
      readonly id: string;
      tags?: T[];
      [key: string]: unknown;
      greet(): void;
    }
  `);
  assertEquals(declarations.get("User"), {
    kind: "interface",
    name: "User",
    typeParams: [{
      name: "T",
      default: { kind: "keyword", name: "string" },
    }],
    heritage: [{
      kind: "reference",
      name: "Base",
      args: [{ kind: "reference", name: "T", args: [] }],
    }],
    body: {
      kind: "object",
      members: [
        {
          name: "id",
          type: { kind: "keyword", name: "string" },
          optional: false,
          readonly: true,
        },
        {
          name: "tags",
          type: {
            kind: "array",
            element: { kind: "reference", name: "T", args: [] },
          },
          optional: true,
          readonly: false,
        },
      ],
      indexes: [{
        key: { kind: "keyword", name: "string" },
        value: { kind: "keyword", name: "unknown" },
      }],
    },
  });
});

Deno.test("parser: type nodes", () => {
  const declarations = parseSource(`
    type A = "x" | -1 | null;
    type B = [name: string, ...rest: number[]];
    type C = \`id-\${number}\`;
    type D = Ns.Thing<keyof E>;
    type F = E["key"];
    type G = (a: string) => void;
    type H = { [K in "a" | "b"]: K };
  `);
  const type = (name: string) => {
    const declaration = declarations.get(name);
    return declaration?.kind === "alias" ? declaration.type : undefined;
  };
  assertEquals(type("A"), {
    kind: "union",
    types: [
      { kind: "literal", value: "x" },
      { kind: "literal", value: -1 },
      { kind: "keyword", name: "null" },
    ],
  });
  assertEquals(type("B"), {
    kind: "tuple",
    elements: [
      {
        type: { kind: "keyword", name: "string" },
        optional: false,
        rest: false,
      },
      {
        type: { kind: "array", element: { kind: "keyword", name: "number" } },
        optional: false,
        rest: true,
      },
    ],
  });
  assertEquals(type("C"), {
    kind: "template",
    head: "id-",
    spans: [{ type: { kind: "keyword", name: "number" }, literal: "" }],
  });
  assertEquals(type("D"), {
    kind: "reference",
    name: "Ns.Thing",
    args: [{
      kind: "keyof",
      type: { kind: "reference", name: "E", args: [] },
    }],
  });
  assertEquals(type("F"), {
    kind: "indexed",
    object: { kind: "reference", name: "E", args: [] },
    index: { kind: "literal", value: "key" },
  });
  assertEquals(type("G"), { kind: "function" });
  assertEquals(type("H")?.kind, "mapped");
});

Deno.test("parser: enums get TypeScript's member values", () => {
  const declaration = parseSource(
    `enum E { A, B = 10, C, D = "d", E = -2, F }`,
  ).get("E");
  assertEquals(declaration, {
    kind: "enum",
    name: "E",
    members: [
      { name: "A", value: 0 },
      { name: "B", value: 10 },
      { name: "C", value: 11 },
      { name: "D", value: "d" },
      { name: "E", value: -2 },
      { name: "F", value: -1 },
    ],
  });
});

Deno.test("parser: repeated interfaces merge, namespaces are searched", () => {
  const declarations = parseSource(`
    interface A { a: string }
    namespace Outer.Inner { export interface B { b: string } }
    interface A { c: number }
    declare module "pkg" { type C = string; }
  `);
  assertEquals([...declarations.keys()], ["A", "B", "C"]);
  const merged = declarations.get("A");
  assertEquals(
    merged?.kind === "interface" && merged.body.members.map((m) => m.name),
    ["a", "c"],
  );
});

Deno.test("parser: legacy escapes are removed before parsing", () => {
  const declaration = parseSource(`type A = "a\;b\\:c"`).get("A");
  assertEquals(
    declaration?.kind === "alias" && declaration.type,
    { kind: "literal", value: "a;b:c" },
  );
});

Deno.test("parser: syntax errors report their position", () => {
  assertThrows(
    () => parseSource("interface A {\n  a: string\n  b: = 1\n}"),
    MockInputError,
    "(line 3, column 6)",
  );
});
