import { validTypes } from "@core/constants/ValidTypes.ts";
import { rand } from "@core/utils/randNumber.ts";

export const typeValidation = (type: string): { type: string, isNotCustom: boolean, value: string | number | boolean | null} => {
    if(type.includes("|")) {
        const splitTypes = type.split("|"),
        findPossibleValues = splitTypes.filter(t => {
            if(t.includes("'") || t.includes('"')) return true;
            if(!isNaN(Number(t))) return true;
            return false;
        });

        if(findPossibleValues.length > 0) {
            const randomValue = findPossibleValues[rand(findPossibleValues.length, 0)];

            const isNumber = !(randomValue.includes('"') || randomValue.includes("'")) && !isNaN(randomValue as unknown as number);

            return { type: typeof randomValue, isNotCustom: true, value: isNumber ? Number(randomValue) : randomValue.replace(/('|")/g, '').trim()};
        } else {
            const types = splitTypes.filter(t => validTypes.includes(t));

            const fixedType = types[rand(types.length)]

            return { type: fixedType, isNotCustom: validTypes.includes(fixedType), value: null}
        }

    }

    if(type.includes("'") || type.includes('"')) {
        return { type: typeof type, isNotCustom: true, value: type.replace(/('|")/g, '')};
    }

    if(!isNaN(Number(type))) {
        return { type: typeof type, isNotCustom: true, value: Number(type)};
    }

    if(type === 'true' || type === 'false') {
        return { type: 'boolean', isNotCustom: true, value: JSON.parse(type)};
    }

    return {type, isNotCustom: validTypes.includes(type), value: null};
}