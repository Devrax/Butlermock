import { type Faker, fakerEN } from "@faker-js/faker";
import StringPlaceholder from "@core/utils/strings.ts";

/**
 * Maps a scalar type name to a Faker value. `name` is the property the value
 * is generated for and drives the string heuristics in `StringPlaceholder`.
 * Unknown type names return null.
 */
export const checkConstant = (
  name: string,
  type: string,
  anyReturn: unknown = null,
  faker: Faker = fakerEN,
): unknown => {
  switch (type) {
    // Primitives
    case "string":
      return new StringPlaceholder(faker).checkStringName(name);
    case "boolean":
      return faker.datatype.boolean();
    case "number":
      return faker.number.int();
    case "bigint":
      return faker.number.bigInt();
    case "symbol":
      return `Symbol(${faker.lorem.word()})`;
    case "null":
    case "undefined":
    case "void":
    case "never":
      return null;
    // Non primitives
    case "Date":
      return faker.date.anytime();
    case "object":
      return {};
    case "any":
    case "unknown":
      return anyReturn;
    default:
      return null;
  }
};
