import { fakerEN } from "https://esm.sh/@faker-js/faker@8.0.2";
import StringPlaceholder from "@core/utils/strings.ts";
import { rand } from "@core/utils/randNumber.ts";
const faker = fakerEN;

const forStrings = new StringPlaceholder(faker);

export const checkConstant = (name: string, type: string) => {
    switch(type) {
        // Primitives
        case "string":
            return forStrings.checkStringName(name) ?? faker.lorem.slug(Math.floor(Math.random() * 5));
        case "boolean":
            return Boolean(Math.floor(Math.random() * 2));
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
            return new Array(rand(10)).fill('.').map(b => !!rand(2));
        case "number[]":
        case "bigint[]":
            return new Array(rand(10)).fill('.').map(n => type === 'bigint[]' ? BigInt(rand(10)) : rand(10));
        case 'null[]':
        case 'undefined[]':
            return new Array(rand(5)).fill(null);
        // Array non-primitive
        case 'Date[]':
            return new Array(rand(10)).fill('.').map((_) => faker.date.anytime())
        default:
            return null;
    }
}