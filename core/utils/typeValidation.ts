import { validTypes } from "@core/constants/ValidTypes.ts";
import { rand } from "@core/utils/randNumber.ts";

export const typeValidation = (type: string): { type: string, isNotCustom: boolean, value: string | number | boolean | null} => {

    if(type.includes("|")) {
        const splitTypes = type.split("|"),
        findPossibleValues = splitTypes.filter(t => {
            if(t.includes("'") || t.includes('"')) return true;
            if(!isNaN(Number(type))) return true;
            return false;
        });

        if(findPossibleValues.length > 0) {
            const randomValue = findPossibleValues[rand(findPossibleValues.length)];
            return { type: randomValue, isNotCustom: true, value: randomValue.replace(/('|")/g, '')};
        } else {
            const types = splitTypes.filter(t => validTypes.includes(t));
            const fixedType = types[rand(types.length)]
            return { type: fixedType, isNotCustom: validTypes.includes(fixedType), value: null}
        }

    }

    return {type, isNotCustom: validTypes.includes(type), value: null};
}