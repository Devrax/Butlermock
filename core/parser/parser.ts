import ts from "@core/parser/typescript.ts";
import { MockInputError } from "@core/parser/errors.ts";
import type {
  Declaration,
  DeclarationMap,
  EnumMember,
  IndexSignature,
  KeywordName,
  ObjectType,
  PropertyMember,
  ReferenceType,
  TupleElement,
  TypeNode,
  TypeParameter,
} from "@core/parser/model.ts";

const KEYWORDS: Partial<Record<ts.SyntaxKind, KeywordName>> = {
  [ts.SyntaxKind.StringKeyword]: "string",
  [ts.SyntaxKind.NumberKeyword]: "number",
  [ts.SyntaxKind.BigIntKeyword]: "bigint",
  [ts.SyntaxKind.BooleanKeyword]: "boolean",
  [ts.SyntaxKind.NullKeyword]: "null",
  [ts.SyntaxKind.UndefinedKeyword]: "undefined",
  [ts.SyntaxKind.AnyKeyword]: "any",
  [ts.SyntaxKind.UnknownKeyword]: "unknown",
  [ts.SyntaxKind.ObjectKeyword]: "object",
  [ts.SyntaxKind.SymbolKeyword]: "symbol",
  [ts.SyntaxKind.NeverKeyword]: "never",
  [ts.SyntaxKind.VoidKeyword]: "void",
};

/**
 * Older versions of Butlermock required `\;` and `\:` inside fixed string
 * values. Those escapes are no longer needed, but inputs written for the old
 * engine keep working because the backslash is dropped before parsing.
 */
const stripLegacyEscapes = (source: string) =>
  source.replace(/\\([;:])/g, "$1");

/**
 * Parses TypeScript source text and returns every `interface`, `type` alias
 * and `enum` declared at the top level (or inside `namespace`/`module`
 * blocks), keyed by name in order of first appearance. Repeated interfaces
 * are merged like TypeScript does; a repeated alias or enum replaces the
 * earlier one.
 */
export function parseSource(source: string): DeclarationMap {
  const sourceFile = ts.createSourceFile(
    "input.ts",
    stripLegacyEscapes(source),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  assertNoSyntaxErrors(sourceFile);

  const declarations: DeclarationMap = new Map();
  collect(sourceFile.statements, sourceFile, declarations);

  if (declarations.size === 0) {
    throw new MockInputError("No interfaces or types were found");
  }

  return declarations;
}

function assertNoSyntaxErrors(sourceFile: ts.SourceFile) {
  // `parseDiagnostics` is not part of the public typings, but it is the list
  // `program.getSyntacticDiagnostics()` returns for a .ts file, without the
  // cost of creating a program.
  const diagnostics =
    (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] })
      .parseDiagnostics ?? [];
  if (diagnostics.length === 0) return;

  const [first] = diagnostics;
  const message = ts.flattenDiagnosticMessageText(first.messageText, "\n");
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    first.start ?? 0,
  );
  throw new MockInputError(
    `Unable to parse the TypeScript source: ${message} (line ${
      line + 1
    }, column ${character + 1})`,
  );
}

function collect(
  statements: ts.NodeArray<ts.Statement>,
  sourceFile: ts.SourceFile,
  declarations: DeclarationMap,
) {
  for (const statement of statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      add(declarations, convertInterface(statement, sourceFile));
    } else if (ts.isTypeAliasDeclaration(statement)) {
      add(declarations, convertAlias(statement, sourceFile));
    } else if (ts.isEnumDeclaration(statement)) {
      add(declarations, convertEnum(statement));
    } else if (ts.isModuleDeclaration(statement)) {
      let body = statement.body;
      while (body && ts.isModuleDeclaration(body)) body = body.body;
      if (body && ts.isModuleBlock(body)) {
        collect(body.statements, sourceFile, declarations);
      }
    }
  }
}

function add(declarations: DeclarationMap, declaration: Declaration) {
  const existing = declarations.get(declaration.name);
  if (existing?.kind === "interface" && declaration.kind === "interface") {
    existing.body.members.push(...declaration.body.members);
    existing.body.indexes.push(...declaration.body.indexes);
    existing.heritage.push(...declaration.heritage);
    return;
  }
  declarations.set(declaration.name, declaration);
}

const emptyDeclarationError = (node: ts.Node, sourceFile: ts.SourceFile) =>
  new MockInputError(
    `"${
      node.getText(sourceFile).replace(/\s+/g, " ")
    }" it seems empty, you cannot provide empty interface.`,
  );

function convertInterface(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
): Declaration {
  const heritage: ReferenceType[] = [];
  for (const clause of node.heritageClauses ?? []) {
    for (const parent of clause.types) {
      heritage.push({
        kind: "reference",
        name: expressionName(parent.expression),
        args: (parent.typeArguments ?? []).map(convertType),
      });
    }
  }

  if (node.members.length === 0 && heritage.length === 0) {
    throw emptyDeclarationError(node, sourceFile);
  }

  return {
    kind: "interface",
    name: node.name.text,
    typeParams: convertTypeParameters(node.typeParameters),
    heritage,
    body: convertMembers(node.members),
  };
}

function convertAlias(
  node: ts.TypeAliasDeclaration,
  sourceFile: ts.SourceFile,
): Declaration {
  if (ts.isTypeLiteralNode(node.type) && node.type.members.length === 0) {
    throw emptyDeclarationError(node, sourceFile);
  }

  return {
    kind: "alias",
    name: node.name.text,
    typeParams: convertTypeParameters(node.typeParameters),
    type: convertType(node.type),
  };
}

function convertEnum(node: ts.EnumDeclaration): Declaration {
  const members: EnumMember[] = [];
  let next = 0;
  for (const member of node.members) {
    const name = propertyName(member.name) ?? member.name.getText();
    const literal = member.initializer && literalValue(member.initializer);
    if (typeof literal === "string") {
      members.push({ name, value: literal });
      continue;
    }
    const value = typeof literal === "number" ? literal : next;
    members.push({ name, value });
    next = value + 1;
  }
  return { kind: "enum", name: node.name.text, members };
}

function convertTypeParameters(
  params: ts.NodeArray<ts.TypeParameterDeclaration> | undefined,
): TypeParameter[] {
  return (params ?? []).map((param) => ({
    name: param.name.text,
    default: param.default ? convertType(param.default) : undefined,
  }));
}

function convertMembers(members: ts.NodeArray<ts.TypeElement>): ObjectType {
  const properties: PropertyMember[] = [];
  const indexes: IndexSignature[] = [];

  for (const member of members) {
    if (ts.isPropertySignature(member) || ts.isGetAccessor(member)) {
      const name = propertyName(member.name);
      if (name === undefined) continue;
      properties.push({
        name,
        type: member.type ? convertType(member.type) : keyword("any"),
        optional: Boolean(member.questionToken),
        readonly: Boolean(
          ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Readonly,
        ),
      });
    } else if (ts.isIndexSignatureDeclaration(member)) {
      const keyType = member.parameters[0]?.type;
      indexes.push({
        key: keyType ? convertType(keyType) : keyword("string"),
        value: convertType(member.type),
      });
    }
    // Method, call and construct signatures have no JSON representation and
    // are skipped without affecting the remaining members.
  }

  return { kind: "object", members: properties, indexes };
}

function keyword(name: KeywordName): TypeNode {
  return { kind: "keyword", name };
}

/** Text of a property/enum member name, or undefined for computed names. */
function propertyName(name: ts.PropertyName): string | undefined {
  if (
    ts.isIdentifier(name) || ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text;
  }
  if (ts.isComputedPropertyName(name)) {
    const value = literalValue(name.expression);
    return value === undefined ? undefined : String(value);
  }
  return undefined;
}

function literalValue(expression: ts.Node): string | number | undefined {
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.text;
  }
  if (ts.isNumericLiteral(expression)) return Number(expression.text);
  if (
    ts.isPrefixUnaryExpression(expression) &&
    ts.isNumericLiteral(expression.operand)
  ) {
    const value = Number(expression.operand.text);
    if (expression.operator === ts.SyntaxKind.MinusToken) return -value;
    if (expression.operator === ts.SyntaxKind.PlusToken) return value;
  }
  if (ts.isParenthesizedExpression(expression)) {
    return literalValue(expression.expression);
  }
  return undefined;
}

function entityName(name: ts.EntityName): string {
  return ts.isIdentifier(name)
    ? name.text
    : `${entityName(name.left)}.${name.right.text}`;
}

function expressionName(expression: ts.Expression): string {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    return `${expressionName(expression.expression)}.${expression.name.text}`;
  }
  return expression.getText();
}

function convertTupleElement(node: ts.TypeNode): TupleElement {
  if (ts.isNamedTupleMember(node)) {
    return {
      type: convertType(node.type),
      optional: Boolean(node.questionToken),
      rest: Boolean(node.dotDotDotToken),
    };
  }
  if (ts.isOptionalTypeNode(node)) {
    return { type: convertType(node.type), optional: true, rest: false };
  }
  if (ts.isRestTypeNode(node)) {
    return { type: convertType(node.type), optional: false, rest: true };
  }
  return { type: convertType(node), optional: false, rest: false };
}

export function convertType(node: ts.TypeNode): TypeNode {
  const keywordName = KEYWORDS[node.kind];
  if (keywordName) return keyword(keywordName);

  if (ts.isLiteralTypeNode(node)) {
    const literal = node.literal;
    if (literal.kind === ts.SyntaxKind.NullKeyword) return keyword("null");
    if (literal.kind === ts.SyntaxKind.TrueKeyword) {
      return { kind: "literal", value: true };
    }
    if (literal.kind === ts.SyntaxKind.FalseKeyword) {
      return { kind: "literal", value: false };
    }
    if (ts.isBigIntLiteral(literal)) {
      return { kind: "literal", value: BigInt(literal.text.slice(0, -1)) };
    }
    if (
      ts.isPrefixUnaryExpression(literal) &&
      ts.isBigIntLiteral(literal.operand)
    ) {
      return {
        kind: "literal",
        value: -BigInt(literal.operand.text.slice(0, -1)),
      };
    }
    const value = literalValue(literal);
    if (value !== undefined) return { kind: "literal", value };
    return { kind: "unsupported", text: node.getText() };
  }

  if (ts.isTemplateLiteralTypeNode(node)) {
    return {
      kind: "template",
      head: node.head.text,
      spans: node.templateSpans.map((span) => ({
        type: convertType(span.type),
        literal: span.literal.text,
      })),
    };
  }

  if (ts.isArrayTypeNode(node)) {
    return { kind: "array", element: convertType(node.elementType) };
  }

  if (ts.isTupleTypeNode(node)) {
    return { kind: "tuple", elements: node.elements.map(convertTupleElement) };
  }

  if (ts.isTypeLiteralNode(node)) return convertMembers(node.members);

  if (ts.isMappedTypeNode(node)) {
    return {
      kind: "mapped",
      param: node.typeParameter.name.text,
      constraint: node.typeParameter.constraint
        ? convertType(node.typeParameter.constraint)
        : keyword("string"),
      type: node.type ? convertType(node.type) : keyword("any"),
    };
  }

  if (ts.isUnionTypeNode(node)) {
    return { kind: "union", types: node.types.map(convertType) };
  }

  if (ts.isIntersectionTypeNode(node)) {
    return { kind: "intersection", types: node.types.map(convertType) };
  }

  if (
    ts.isParenthesizedTypeNode(node) || ts.isOptionalTypeNode(node) ||
    ts.isRestTypeNode(node)
  ) {
    return convertType(node.type);
  }

  if (ts.isTypeReferenceNode(node)) {
    return {
      kind: "reference",
      name: entityName(node.typeName),
      args: (node.typeArguments ?? []).map(convertType),
    };
  }

  if (ts.isTypeOperatorNode(node)) {
    switch (node.operator) {
      case ts.SyntaxKind.KeyOfKeyword:
        return { kind: "keyof", type: convertType(node.type) };
      case ts.SyntaxKind.UniqueKeyword:
        return keyword("symbol");
      default: // readonly
        return convertType(node.type);
    }
  }

  if (ts.isIndexedAccessTypeNode(node)) {
    return {
      kind: "indexed",
      object: convertType(node.objectType),
      index: convertType(node.indexType),
    };
  }

  if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node)) {
    return { kind: "function" };
  }

  return { kind: "unsupported", text: node.getText() };
}
