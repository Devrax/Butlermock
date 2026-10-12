import type { Faker } from "@faker-js/faker";
import { checkConstant } from "@core/utils/dynamicValue.ts";
import type {
  Declaration,
  DeclarationMap,
  EnumDeclaration,
  ObjectType,
  ReferenceType,
  TypeNode,
} from "@core/parser/model.ts";

export interface GeneratorOptions {
  /** Value used for `any`, `unknown`, unresolved generics and unsupported types. */
  anyReturn: unknown;
  /** How many times a type may appear on one path before recursion is cut. */
  maxDepth: number;
  faker: Faker;
}

/** Returned when the recursion limit is hit; callers turn it into null or []. */
const CUT: unique symbol = Symbol("recursion limit");
type Generated = unknown;

/** A type argument bound to a type parameter, with the scope it came from. */
interface Binding {
  node: TypeNode;
  scope: Scope;
}

interface Scope {
  /** Type parameters in scope; null means "declared but not resolvable". */
  env: Map<string, Binding | null>;
  /** Names of the declarations being expanded on the current path. */
  path: string[];
}

interface ShapeProperty {
  node: TypeNode;
  scope: Scope;
}

interface Shape {
  props: Map<string, ShapeProperty>;
  indexes: { key: TypeNode; value: TypeNode; scope: Scope }[];
}

const ROOT_SCOPE: Scope = { env: new Map(), path: [] };

const PRIMITIVE_WRAPPERS: Record<string, string> = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
  BigInt: "bigint",
  Symbol: "symbol",
  Object: "object",
  Date: "Date",
};

const SHAPE_UTILITIES = new Set([
  "Partial",
  "Required",
  "Readonly",
  "Pick",
  "Omit",
  "Record",
]);

const ARRAY_WRAPPERS = new Set(["Array", "ReadonlyArray"]);

/**
 * Turns the parser's type model into values. Every random choice goes through
 * the Faker instance it receives, so a seeded Faker gives repeatable output.
 */
export class MockGenerator {
  #declarations: DeclarationMap;
  #anyReturn: unknown;
  #maxDepth: number;
  #faker: Faker;

  constructor(declarations: DeclarationMap, options: GeneratorOptions) {
    this.#declarations = declarations;
    this.#anyReturn = options.anyReturn;
    this.#maxDepth = options.maxDepth;
    this.#faker = options.faker;
  }

  /** Generates a value for the declaration called `name`. */
  generate(name: string): unknown {
    const value = this.#gen(
      { kind: "reference", name, args: [] },
      ROOT_SCOPE,
      name,
    );
    return value === CUT ? null : value;
  }

  /**
   * `strict` is set for union members: a member that only produces an empty
   * array or an object of nulls because of the recursion limit then reports
   * CUT, so the union can pick another member instead.
   */
  #gen(node: TypeNode, scope: Scope, name: string, strict = false): Generated {
    switch (node.kind) {
      case "keyword":
        return checkConstant(name, node.name, this.#anyReturn, this.#faker);
      case "literal":
        return node.value;
      case "template":
        return node.head + node.spans.map((span) => {
          const value = this.#gen(span.type, scope, name);
          return `${value === CUT ? "" : value}${span.literal}`;
        }).join("");
      case "array":
        return this.#array(() => this.#gen(node.element, scope, name), strict);
      case "tuple":
        return this.#tuple(node, scope, name);
      case "object":
      case "mapped":
      case "intersection":
        return this.#objectOrFirstMember(node, scope, name, strict);
      case "union":
        return this.#union(node.types, scope, name);
      case "reference":
        return this.#reference(node, scope, name, strict);
      case "keyof": {
        const keys = this.#keysOf(node, scope);
        return keys && keys.length > 0
          ? this.#faker.helpers.arrayElement(keys)
          : checkConstant(name, "string", this.#anyReturn, this.#faker);
      }
      case "indexed":
        return this.#indexed(node.object, node.index, scope, name);
      case "function":
        return null;
      case "unsupported":
        return this.#anyReturn;
    }
  }

  #array(produce: () => Generated, strict = false): Generated {
    const first = produce();
    if (first === CUT) return strict ? CUT : [];
    const length = this.#faker.number.int({ min: 1, max: 5 });
    const items = [first];
    while (items.length < length) items.push(produce());
    return items.filter((item) => item !== CUT);
  }

  #tuple(
    node: Extract<TypeNode, { kind: "tuple" }>,
    scope: Scope,
    name: string,
  ): unknown[] {
    const items: unknown[] = [];
    for (const element of node.elements) {
      const value = this.#gen(element.type, scope, name);
      if (element.rest && Array.isArray(value)) items.push(...value);
      else items.push(value === CUT ? null : value);
    }
    return items;
  }

  #objectOrFirstMember(
    node: TypeNode,
    scope: Scope,
    name: string,
    strict = false,
  ): Generated {
    const shape = this.#shapeOf(node, scope);
    if (shape === CUT) return CUT;
    if (shape) return this.#objectFromShape(shape, strict);
    // An intersection with a non-object member, e.g. `string & { brand: 1 }`.
    if (node.kind === "intersection") {
      for (const member of node.types) {
        if (this.#shapeOf(member, scope) === null) {
          return this.#gen(member, scope, name, strict);
        }
      }
    }
    return this.#anyReturn;
  }

  #objectFromShape(shape: Shape, strict = false): Generated {
    const out: Record<string, unknown> = {};
    let values = 0;
    let cuts = 0;
    const assign = (key: string, value: Generated) => {
      values++;
      if (value === CUT) cuts++;
      out[key] = value === CUT ? null : value;
    };
    for (const [key, prop] of shape.props) {
      if (prop.node.kind === "function") continue;
      assign(key, this.#gen(prop.node, prop.scope, key));
    }
    for (const index of shape.indexes) {
      const count = this.#faker.number.int({ min: 1, max: 3 });
      for (let i = 0; i < count; i++) {
        const key = this.#indexKey(index.key, index.scope);
        if (Object.hasOwn(out, key)) continue;
        assign(key, this.#gen(index.value, index.scope, key));
      }
    }
    return strict && values > 0 && cuts === values ? CUT : out;
  }

  #indexKey(node: TypeNode, scope: Scope): string {
    const keys = this.#keysOf(node, scope);
    if (keys && keys.length > 0) return this.#faker.helpers.arrayElement(keys);
    if (node.kind === "keyword" && node.name === "number") {
      return String(this.#faker.number.int({ min: 0, max: 99 }));
    }
    if (node.kind === "template") return String(this.#gen(node, scope, "key"));
    return this.#faker.lorem.word();
  }

  #union(types: TypeNode[], scope: Scope, name: string): Generated {
    const mockable = types.filter((type) => this.#isMockable(type, scope));
    const candidates = this.#faker.helpers.shuffle(
      mockable.length > 0 ? mockable : types,
    );
    // Prefer members that do not hit the recursion limit.
    for (const candidate of candidates) {
      const value = this.#gen(candidate, scope, name, true);
      if (value !== CUT) return value;
    }
    return CUT;
  }

  #isMockable(node: TypeNode, scope: Scope): boolean {
    switch (node.kind) {
      case "function":
      case "unsupported":
        return false;
      case "keyword":
        return node.name !== "never";
      case "reference":
        return scope.env.has(node.name) ||
          this.#declarations.has(node.name) ||
          this.#enumMember(node.name) !== undefined ||
          Object.hasOwn(PRIMITIVE_WRAPPERS, node.name) ||
          SHAPE_UTILITIES.has(node.name) ||
          ARRAY_WRAPPERS.has(node.name);
      default:
        return true;
    }
  }

  #reference(
    node: ReferenceType,
    scope: Scope,
    name: string,
    strict = false,
  ): Generated {
    if (node.args.length === 0 && scope.env.has(node.name)) {
      const binding = scope.env.get(node.name);
      return binding
        ? this.#gen(binding.node, binding.scope, name, strict)
        : this.#anyReturn;
    }

    const declaration = this.#declarations.get(node.name);
    if (declaration) {
      if (declaration.kind === "enum") return this.#enumValue(declaration);
      if (declaration.kind === "interface") {
        return this.#objectOrFirstMember(node, scope, name, strict);
      }
      const inner = this.#enter(declaration, node.args, scope);
      return inner === CUT
        ? CUT
        : this.#gen(declaration.type, inner, name, strict);
    }

    const member = this.#enumMember(node.name);
    if (member !== undefined) return member;

    if (Object.hasOwn(PRIMITIVE_WRAPPERS, node.name)) {
      return checkConstant(
        name,
        PRIMITIVE_WRAPPERS[node.name],
        this.#anyReturn,
        this.#faker,
      );
    }

    if (ARRAY_WRAPPERS.has(node.name) && node.args.length === 1) {
      return this.#array(() => this.#gen(node.args[0], scope, name), strict);
    }

    if (SHAPE_UTILITIES.has(node.name)) {
      return this.#objectOrFirstMember(node, scope, name, strict);
    }

    // Unknown names: a plain reference to a type that is not in the source
    // yields null (as it always has); an unknown generic wrapper such as
    // `Promise<T>` or `Map<K, V>` yields the `any` value.
    return node.args.length > 0 ? this.#anyReturn : null;
  }

  #enumValue(declaration: EnumDeclaration): string | number | null {
    if (declaration.members.length === 0) return null;
    return this.#faker.helpers.arrayElement(declaration.members).value;
  }

  /** Resolves `Enum.Member` references. */
  #enumMember(name: string): string | number | undefined {
    const dot = name.lastIndexOf(".");
    if (dot === -1) return undefined;
    const declaration = this.#declarations.get(name.slice(0, dot));
    if (declaration?.kind !== "enum") return undefined;
    const memberName = name.slice(dot + 1);
    return declaration.members.find((member) => member.name === memberName)
      ?.value;
  }

  /**
   * Opens the scope of a generic declaration: binds its type parameters to
   * the given arguments (or their defaults) and records it on the path.
   * Returns CUT when the declaration is already `maxDepth` deep on the path.
   */
  #enter(
    declaration: Exclude<Declaration, EnumDeclaration>,
    args: TypeNode[],
    scope: Scope,
  ): Scope | typeof CUT {
    const depth = scope.path.filter((n) => n === declaration.name).length;
    if (depth >= this.#maxDepth) return CUT;

    const env = new Map<string, Binding | null>();
    const inner: Scope = { env, path: [...scope.path, declaration.name] };
    declaration.typeParams.forEach((param, i) => {
      if (args[i]) env.set(param.name, { node: args[i], scope });
      else if (param.default) {
        env.set(param.name, { node: param.default, scope: inner });
      } else env.set(param.name, null);
    });
    return inner;
  }

  /**
   * Resolves a type to the properties of the object it describes, or null
   * when it is not an object type. Handles inline objects, interfaces with
   * `extends`, intersections, mapped types and the built-in utility types.
   */
  #shapeOf(node: TypeNode, scope: Scope): Shape | null | typeof CUT {
    switch (node.kind) {
      case "object":
        return this.#ownShape(node, scope);
      case "keyword":
        return node.name === "object"
          ? { props: new Map(), indexes: [] }
          : null;
      case "mapped": {
        const keys = this.#keysOf(node.constraint, scope);
        if (keys === null) {
          const env = new Map(scope.env);
          env.set(node.param, { node: node.constraint, scope });
          return {
            props: new Map(),
            indexes: [{
              key: node.constraint,
              value: node.type,
              scope: { ...scope, env },
            }],
          };
        }
        const props = new Map<string, ShapeProperty>();
        for (const key of keys) {
          const env = new Map(scope.env);
          env.set(node.param, {
            node: { kind: "literal", value: key },
            scope,
          });
          props.set(key, { node: node.type, scope: { ...scope, env } });
        }
        return { props, indexes: [] };
      }
      case "intersection": {
        const merged: Shape = { props: new Map(), indexes: [] };
        for (const member of node.types) {
          const shape = this.#shapeOf(member, scope);
          if (shape === CUT) return CUT;
          if (shape === null) return null;
          mergeInto(merged, shape);
        }
        return merged;
      }
      case "reference":
        return this.#referenceShape(node, scope);
      default:
        return null;
    }
  }

  #ownShape(node: ObjectType, scope: Scope): Shape {
    const props = new Map<string, ShapeProperty>();
    for (const member of node.members) {
      props.set(member.name, { node: member.type, scope });
    }
    return {
      props,
      indexes: node.indexes.map((index) => ({ ...index, scope })),
    };
  }

  #referenceShape(
    node: ReferenceType,
    scope: Scope,
  ): Shape | null | typeof CUT {
    if (node.args.length === 0 && scope.env.has(node.name)) {
      const binding = scope.env.get(node.name);
      return binding ? this.#shapeOf(binding.node, binding.scope) : null;
    }

    const declaration = this.#declarations.get(node.name);
    if (declaration) {
      if (declaration.kind === "enum") return null;
      const inner = this.#enter(declaration, node.args, scope);
      if (inner === CUT) return CUT;
      if (declaration.kind === "alias") {
        return this.#shapeOf(declaration.type, inner);
      }
      const shape: Shape = { props: new Map(), indexes: [] };
      for (const parent of declaration.heritage) {
        const parentShape = this.#shapeOf(parent, inner);
        if (parentShape && parentShape !== CUT) mergeInto(shape, parentShape);
      }
      mergeInto(shape, this.#ownShape(declaration.body, inner));
      return shape;
    }

    const [target, keysNode] = node.args;
    switch (node.name) {
      case "Partial":
      case "Required":
      case "Readonly":
        return target ? this.#shapeOf(target, scope) : null;
      case "Pick":
      case "Omit": {
        if (!target || !keysNode) return null;
        const shape = this.#shapeOf(target, scope);
        if (!shape || shape === CUT) return shape;
        const keys = new Set(this.#keysOf(keysNode, scope) ?? []);
        const keep = node.name === "Pick"
          ? (key: string) => keys.has(key)
          : (key: string) => !keys.has(key);
        return {
          props: new Map([...shape.props].filter(([key]) => keep(key))),
          indexes: node.name === "Omit" ? shape.indexes : [],
        };
      }
      case "Record": {
        if (!target || !keysNode) return null;
        const keys = this.#keysOf(target, scope);
        if (keys === null) {
          return {
            props: new Map(),
            indexes: [{ key: target, value: keysNode, scope }],
          };
        }
        return {
          props: new Map(keys.map((key) => [key, { node: keysNode, scope }])),
          indexes: [],
        };
      }
      case "Object":
        return { props: new Map(), indexes: [] };
      default:
        return null;
    }
  }

  /**
   * The finite set of keys a key type stands for (`"a" | "b"`, `keyof T`, an
   * enum), or null when it is open-ended (`string`, `number`, templates).
   */
  #keysOf(node: TypeNode, scope: Scope): string[] | null {
    switch (node.kind) {
      case "literal":
        return [String(node.value)];
      case "union": {
        const keys: string[] = [];
        for (const member of node.types) {
          const memberKeys = this.#keysOf(member, scope);
          if (memberKeys === null) return null;
          keys.push(...memberKeys);
        }
        return [...new Set(keys)];
      }
      case "keyof": {
        const shape = this.#shapeOf(node.type, scope);
        if (!shape || shape === CUT) return null;
        if (shape.props.size === 0 && shape.indexes.length > 0) return null;
        return [...shape.props.keys()];
      }
      case "reference": {
        if (node.args.length === 0 && scope.env.has(node.name)) {
          const binding = scope.env.get(node.name);
          return binding ? this.#keysOf(binding.node, binding.scope) : null;
        }
        const declaration = this.#declarations.get(node.name);
        if (declaration?.kind === "enum") {
          return declaration.members.map((member) => String(member.value));
        }
        if (declaration?.kind === "alias") {
          const inner = this.#enter(declaration, node.args, scope);
          return inner === CUT ? null : this.#keysOf(declaration.type, inner);
        }
        const member = this.#enumMember(node.name);
        return member === undefined ? null : [String(member)];
      }
      default:
        return null;
    }
  }

  #indexed(
    objectNode: TypeNode,
    indexNode: TypeNode,
    scope: Scope,
    name: string,
  ): Generated {
    const shape = this.#shapeOf(objectNode, scope);
    if (shape === CUT) return CUT;
    const keys = this.#keysOf(indexNode, scope);
    if (shape && keys) {
      const props = keys
        .map((key) => shape.props.get(key))
        .filter((prop): prop is ShapeProperty => prop !== undefined);
      if (props.length > 0) {
        const prop = this.#faker.helpers.arrayElement(props);
        return this.#gen(prop.node, prop.scope, name);
      }
    }
    if (shape && shape.indexes.length > 0 && !keys) {
      const index = shape.indexes[0];
      return this.#gen(index.value, index.scope, name);
    }
    // `Item[number]` on an array type.
    const element = this.#elementType(objectNode, scope);
    if (element) return this.#gen(element.node, element.scope, name);
    return this.#anyReturn;
  }

  #elementType(node: TypeNode, scope: Scope): Binding | null {
    if (node.kind === "array") return { node: node.element, scope };
    if (node.kind === "reference") {
      if (node.args.length === 0 && scope.env.has(node.name)) {
        const binding = scope.env.get(node.name);
        return binding ? this.#elementType(binding.node, binding.scope) : null;
      }
      const declaration = this.#declarations.get(node.name);
      if (declaration?.kind === "alias") {
        const inner = this.#enter(declaration, node.args, scope);
        return inner === CUT
          ? null
          : this.#elementType(declaration.type, inner);
      }
      if (ARRAY_WRAPPERS.has(node.name) && node.args.length === 1) {
        return { node: node.args[0], scope };
      }
    }
    return null;
  }
}

/**
 * Later members win, like a child overriding a parent property; an overridden
 * key keeps its original position, as with object spread.
 */
function mergeInto(target: Shape, source: Shape) {
  for (const [key, prop] of source.props) target.props.set(key, prop);
  target.indexes.push(...source.indexes);
}
