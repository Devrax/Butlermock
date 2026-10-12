/**
 * Internal type model produced by the parser and consumed by the generator.
 * It is a small, JSON-friendly subset of the TypeScript type syntax: anything
 * the generator cannot mock is kept as an `unsupported` node instead of being
 * dropped, so the generator decides how to degrade.
 */

export type KeywordName =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "null"
  | "undefined"
  | "any"
  | "unknown"
  | "object"
  | "symbol"
  | "never"
  | "void";

export interface KeywordType {
  kind: "keyword";
  name: KeywordName;
}

export interface LiteralType {
  kind: "literal";
  value: string | number | boolean | bigint;
}

export interface TemplateLiteralType {
  kind: "template";
  head: string;
  spans: { type: TypeNode; literal: string }[];
}

export interface ArrayType {
  kind: "array";
  element: TypeNode;
}

export interface TupleElement {
  type: TypeNode;
  optional: boolean;
  rest: boolean;
}

export interface TupleType {
  kind: "tuple";
  elements: TupleElement[];
}

export interface PropertyMember {
  name: string;
  type: TypeNode;
  optional: boolean;
  readonly: boolean;
}

export interface IndexSignature {
  key: TypeNode;
  value: TypeNode;
}

export interface ObjectType {
  kind: "object";
  members: PropertyMember[];
  indexes: IndexSignature[];
}

/** `{ [K in Constraint]: Type }` */
export interface MappedType {
  kind: "mapped";
  param: string;
  constraint: TypeNode;
  type: TypeNode;
}

export interface UnionType {
  kind: "union";
  types: TypeNode[];
}

export interface IntersectionType {
  kind: "intersection";
  types: TypeNode[];
}

/** A named type, e.g. `User`, `Array<string>`, `Color.Red`. */
export interface ReferenceType {
  kind: "reference";
  name: string;
  args: TypeNode[];
}

export interface KeyofType {
  kind: "keyof";
  type: TypeNode;
}

/** `T["key"]` */
export interface IndexedAccessType {
  kind: "indexed";
  object: TypeNode;
  index: TypeNode;
}

/** Function and constructor types; they have no JSON representation. */
export interface FunctionType {
  kind: "function";
}

export interface UnsupportedType {
  kind: "unsupported";
  text: string;
}

export type TypeNode =
  | KeywordType
  | LiteralType
  | TemplateLiteralType
  | ArrayType
  | TupleType
  | ObjectType
  | MappedType
  | UnionType
  | IntersectionType
  | ReferenceType
  | KeyofType
  | IndexedAccessType
  | FunctionType
  | UnsupportedType;

export interface TypeParameter {
  name: string;
  default?: TypeNode;
}

export interface InterfaceDeclaration {
  kind: "interface";
  name: string;
  typeParams: TypeParameter[];
  /** Parents from the `extends` clause, as references. */
  heritage: ReferenceType[];
  body: ObjectType;
}

export interface AliasDeclaration {
  kind: "alias";
  name: string;
  typeParams: TypeParameter[];
  type: TypeNode;
}

export interface EnumMember {
  name: string;
  value: string | number;
}

export interface EnumDeclaration {
  kind: "enum";
  name: string;
  members: EnumMember[];
}

export type Declaration =
  | InterfaceDeclaration
  | AliasDeclaration
  | EnumDeclaration;

/** Declarations keyed by name, in order of first appearance. */
export type DeclarationMap = Map<string, Declaration>;
