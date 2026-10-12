import { base, en, Faker } from "@faker-js/faker";
import { MockGenerator } from "@core/generator/generator.ts";
import { MockInputError } from "@core/parser/errors.ts";
import { parseSource } from "@core/parser/parser.ts";

export { MockInputError };

type Primitives = string | boolean | number | bigint;

/**
 * Declared result of `buildMock`. At runtime a named root can also resolve to
 * null, an array or a Date (e.g. `type Tags = string[]`).
 */
export type MockResult = Record<string, unknown> | Primitives;

export interface MockOptions {
  /** Seed for Faker; the same seed and source give the same mock. */
  seed?: number;
  /**
   * How many times a type may be expanded inside itself before recursion is
   * cut (arrays become empty, objects become null). Defaults to 3.
   */
  maxDepth?: number;
}

export const DEFAULT_MAX_DEPTH = 3;
const SEEDED_REF_DATE = "2025-01-01T00:00:00.000Z";

/**
 * Builds mock data from TypeScript `interface`, `type` and `enum` source text.
 * The source is parsed with the TypeScript compiler (syntax only, no type
 * checking) and every declaration is mocked once, when the instance is built.
 */
export default class Interface2Mock {
  #mocks = new Map<string, unknown>();

  constructor(
    source: string,
    anyReturn: unknown = null,
    options: MockOptions = {},
  ) {
    if (typeof source !== "string") {
      throw new MockInputError("The source must be a string");
    }
    const { seed, maxDepth = DEFAULT_MAX_DEPTH } = options;
    if (seed !== undefined && !Number.isSafeInteger(seed)) {
      throw new MockInputError("The seed must be an integer");
    }
    if (!Number.isSafeInteger(maxDepth) || maxDepth < 1) {
      throw new MockInputError("maxDepth must be a positive integer");
    }

    const declarations = parseSource(source);
    const faker = new Faker({ locale: [en, base] });
    if (seed !== undefined) {
      faker.seed(seed);
      // Dates are relative to "now" unless the reference date is fixed.
      faker.setDefaultRefDate(SEEDED_REF_DATE);
    }

    const generator = new MockGenerator(declarations, {
      anyReturn,
      maxDepth,
      faker,
    });
    // Interfaces come first, then type aliases, then enums, each group in
    // source order; this is the order the regex engine used to report them.
    const rank = { interface: 0, alias: 1, enum: 2 };
    const ordered = [...declarations.values()].sort((a, b) =>
      rank[a.kind] - rank[b.kind]
    );
    for (const { name } of ordered) {
      this.#mocks.set(name, generator.generate(name));
    }
  }

  /**
   * Returns the mock of the declaration called `rootTypeInterface`, or, when
   * no name is given, an object keyed by every declared name (interfaces,
   * then type aliases, then enums, each in source order).
   */
  public buildMock(rootTypeInterface = ""): MockResult {
    if (rootTypeInterface) {
      if (!this.#mocks.has(rootTypeInterface)) {
        throw new MockInputError(
          `Not matches for key '${rootTypeInterface}' in [${
            [...this.#mocks.keys()].join(", ")
          }]`,
        );
      }
      return structuredClone(this.#mocks.get(rootTypeInterface)) as MockResult;
    }

    return structuredClone(Object.fromEntries(this.#mocks));
  }
}
