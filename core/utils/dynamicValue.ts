import { fakerEN } from "https://esm.sh/@faker-js/faker@8.0.2";
import StringPlaceholder from "@core/utils/strings.ts";
import { rand } from "@core/utils/randNumber.ts";
const faker = fakerEN;

const forStrings = new StringPlaceholder(faker);

export const checkConstant = (name: string, type: string, anyReturn: unknown = null) => {
    switch(type) {
        // Primitives
        case "string":
            return forStrings.checkStringName(name) ?? faker.lorem.slug(rand(5, 0));
        case "boolean":
            return Boolean(rand(2,0));
        case "number":
        case "bigInt":
            return faker.number[type === "bigInt" ? 'bigInt' : 'int']();
        case "null":
        case "undefined":
            return null;
        // Non primitives
        case "Date":
            return faker.date.anytime();
        // Array primitives
        case "string[]":
            return forStrings.checkStringName(name, true);
        case "boolean[]":
            return new Array(rand(10)).fill('.').map(b => !!rand(2, 0));
        case "number[]":
        case "bigint[]":
            return new Array(rand(10)).fill('.').map(n => type === 'bigint[]' ? BigInt(rand(10, 0)) : rand(10, 0));
        case 'null[]':
        case 'undefined[]':
            return new Array(rand(5, 0)).fill(null);
        // Array non-primitive
        case 'Date[]':
            return new Array(rand(10, 0)).fill('.').map((_) => faker.date.anytime())
        case 'any':
        case 'any[]':
            return anyReturn;
        default:
            return null;
    }
}