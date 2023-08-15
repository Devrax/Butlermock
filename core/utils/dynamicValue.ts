import { fakerEN } from "https://esm.sh/@faker-js/faker@8.0.2";
import StringPlaceholder from "@core/utils/strings.ts";
const faker = fakerEN;

const forStrings = new StringPlaceholder(faker);

export const checkConstant = (name: string, type: string, isArray = false) => {
    switch(type) {
        case "string":
            return forStrings.checkStringName(name, isArray) ?? faker.lorem.slug(Math.floor(Math.random() * 5));
        case "boolean":
            return isArray ? new Array(Math.floor(Math.random() * 10)).fill(!!Math.floor(Math.random() * 2)) : Boolean(Math.floor(Math.random() * 2)) ;
        case "number":
        case "bigInt":
            return isArray ? new Array(Math.floor(Math.random() * 10)).fill(Math.floor(Math.random() * 10)) : faker.number[type === "bigInt" ? 'bigInt' : 'int']();
        case "null":
        case "undefined":
            return isArray ? [null] : null;
        case "Date":
            return isArray ? new Array(Math.floor(Math.random() * 10)).fill(faker.date.anytime()) : faker.date.anytime();
        default:
            return null;
    }
}