import { checkConstant } from "@core/utils/dynamicValue.ts";
import { rand } from "@core/utils/randNumber.ts";
import { typeValidation } from "@core/utils/typeValidation.ts";

type Primitives = string | boolean | number;
interface KeyValueObject<T> { [k: string]: T };
interface TsObject<T> { raw: string, value: KeyValueObject<T> | Primitives; isProcess: boolean };

export default class Interface2Mock {

    #json: KeyValueObject<unknown> = {};
    #interfacePatternRegex = /interface(([A-Za-z0-9 ]+)({)(.+)?)(})/g;
    #interfaceExtendsPatternRegex = /interface(([A-Za-z0-9 ]+)extends([A-Za-z0-9 ]+)({)(.+)?)(})/g
    #typePatternRegex = /type(([A-Za-z0-9 ]+)= ?)({)(.+)?(})/g;
    #typePrimitivePatternRegex = /type(([A-Za-z0-9 ]+)= ?)(.+);/g;

    #interfacesCaptured: KeyValueObject<TsObject<unknown>> = {};
    #typeCaptured: KeyValueObject<TsObject<unknown>> = {};

    constructor(private interfaceReference: string, private anyReturn: unknown = null) {
        this.interfaceReference = this.interfaceReference.replace(/\\;/g, "#SEMICOLON#").replace(/\\:/g, "#TWO_POINTS#");
        this.#capturePrimitiveTypes(this.interfaceReference);
        this.#captureStandardTypesAndInterfaces(this.interfaceReference);

        if(Object.values(this.#interfacesCaptured).length === 0 && Object.values(this.#typeCaptured).length === 0) throw new Error('No interfaces or types were found');

        [...Object.values(this.#interfacesCaptured), ...Object.values(this.#typeCaptured)]
        .filter(el => Boolean(el) && !el.isProcess)
        .forEach(obj => this.#process(obj));

        this.#captureExtendedInterfaces(this.interfaceReference);
    }

    #captureExtendedInterfaces(str: string) {
        str = str.replace(/{ +/g, '{').replace(/{\n+/g, '{').replace(/\n( +)/g, '').replace(/}/g, '}\n').replace(/;\n/g, ';'); //Remove any whitespace after line break
        const interfacesExtends = str.match(this.#interfaceExtendsPatternRegex);
        if(interfacesExtends == null) return;
        for(let interfaceExtend of interfacesExtends) {
            interfaceExtend = interfaceExtend.replace(/\n+/g, ' ');
            const processItem = (/interface(([A-Za-z0-9 ]+)extends([A-Za-z0-9 ]+)({)(.+)?)(})/g).exec(interfaceExtend)!;
            if (processItem == null) throw new Error('Bad format for interface/type: ' + interfaceExtend);
            const [useless1, useless2, keyObject, keyExtends, ...uselessRest] = processItem;
            const existKeyExtends = (this.#interfacesCaptured[keyExtends.trim()]?.value as {}) ?? {};
            this.#interfacesCaptured[keyObject.trim()].value = {
                ...existKeyExtends,
                ...this.#interfacesCaptured[keyObject.trim()].value as {},
            }

        }
    }


    #capturePrimitiveTypes(str: string) {
        str = str.replace(/{ +/g, '{').replace(/{\n+/g, '{').replace(/\n( +)/g, '').replace(/}/g, '}\n').replace(/;\n/g, ';'); //Remove any whitespace after line break
        const primitiveTypes = str.match(this.#typePrimitivePatternRegex);
        if(primitiveTypes == null)  return;
        for(let primitiveStr of primitiveTypes) {
            primitiveStr = primitiveStr.replace(/\n+/g, ' ');
            const processItem = (/type(([A-Za-z0-9 ]+)= ?)([A-Za-z0-9 |"\n]+);/g).exec(primitiveStr)!;
            if (processItem == null) throw new Error('Bad format for interface/type: ' + primitiveStr);
            const [useless, useless2, typeName, typeValue] = processItem;

            const deepTypeValid = typeValidation(typeValue),
            value = deepTypeValid.value ?? checkConstant(typeName.trim(), deepTypeValid.type, this.anyReturn) as any;

            this.#typeCaptured[typeName.trim()] = {
                raw: typeValue,
                value,
                isProcess: true
            }

        }

    }

    #captureStandardTypesAndInterfaces(str: string) {
        str = str.replace(/{ +/g, '{').replace(/{\n+/g, '{').replace(/\n( +)/g, '').replace(/}/g, '}\n').replace(/;\n/g, ';'); //Remove any whitespace after line break
        const interfacesTaken = str.match(this.#interfacePatternRegex);
        const typesTaken = str.match(this.#typePatternRegex);

        const reusableIterator = (arr: string[], pattern: string, storeRef: KeyValueObject<TsObject<unknown>>) => {
            for (const item of arr) {
                const processItem = new RegExp(pattern, 'g').exec(item.replace(/extends([A-Za-z0-9 ]+)/, ''));
                if (processItem == null) throw new Error('Bad format for interface/type: ' + item);
                const [useless1, useless2, hashkey, openBracket, tsObject, closingBracket] = processItem;
                if((tsObject == null || tsObject === '') && !item.includes('extends')) throw new Error(`"${item}" it seems empty, you cannot provide empty interface.`);
                storeRef[hashkey.trim()] = {
                    raw: `${openBracket} ${tsObject ?? ''} ${closingBracket}`.trim(),
                    value: {},
                    isProcess: false
                }

            }
        }

        if (interfacesTaken) reusableIterator(interfacesTaken, 'interface(([A-Za-z0-9 ]+)({)(.+)?)(})', this.#interfacesCaptured);
        if (typesTaken) reusableIterator(typesTaken, 'type(([A-Za-z0-9 ]+)= ?)({)(.+)?(})', this.#typeCaptured);
    }

    /**
     * This function process/map each interface or types and creates the mock object assigning each value meeting its type one by one
     * is recursive
     * @param obj
     * @returns
     */
    #process(obj: TsObject<unknown>) {
        if (obj == null) return null;
        const splitEachMember = obj.raw.replace(/(\n|\t|{|}| |readonly )/g, '').split(';').filter(Boolean);
        for (const member of splitEachMember) {

            if(member.match(/\[(.+)\]/g) || member.match(/\((.+)\)/g)) break;

            let [keyName, ...typeValue] = member.replace('#SEMICOLON#', ';').split(':');
            const type = typeValue == null ? (`${typeValue}`).toLocaleLowerCase() : typeValue.map(v => v.replace("#TWO_POINTS#", ':')).join('').trim();
            keyName = keyName.replace('?', '');
            const deepTypeValid = typeValidation(type);
            if (deepTypeValid.isNotCustom) {
                (obj.value as KeyValueObject<unknown>)[keyName] = deepTypeValid.value ?? checkConstant(keyName, deepTypeValid.type, this.anyReturn);
            } else {
                const hashtype = String(deepTypeValid.type).replace(/\[\]/, '');
                const checkIfThatInterfaceExist = this.#findTypeValue(hashtype);
                if (checkIfThatInterfaceExist) {
                    const foundInterface = this.#interfacesCaptured[hashtype] ?? this.#typeCaptured[hashtype];
                    const recursiveValue = (t: string) => {
                        const val = this.#process(foundInterface);
                        return t.includes('[]') ? new Array(rand(5)).fill(structuredClone(val)) : val
                    }
                    const value = checkIfThatInterfaceExist?.isProcess ? checkIfThatInterfaceExist.value : recursiveValue(deepTypeValid.type);
                    (obj.value as KeyValueObject<unknown>)[keyName] = deepTypeValid.type.includes('[]') ? Array.isArray(value) ? value : [value] : value;
                } else {
                    (obj.value as KeyValueObject<unknown>)[keyName] = null;
                }
            }
        }
        obj.isProcess = true;
        return structuredClone(obj.value);
    }

    #findTypeValue(type: string) {
        const checkInterfaces = this.#interfacesCaptured[type];
        const checkTypes = this.#typeCaptured[type];

        if (checkInterfaces) return checkInterfaces;
        if (checkTypes) return checkTypes
    }

    public buildMock(rootTypeInterface = '') {
        if (rootTypeInterface) {
            if (this.#interfacesCaptured[rootTypeInterface] == null && this.#typeCaptured[rootTypeInterface] == null) {
                throw new Error(`Not matches for key '${rootTypeInterface}' in [${Object.keys({...this.#interfacesCaptured, ...this.#typeCaptured}).join(', ')}]`);
            }

            const selectedInterface = this.#interfacesCaptured[rootTypeInterface];
            return selectedInterface ? selectedInterface.value : this.#typeCaptured[rootTypeInterface].value;
        }

        const iterateMockedInterface = (tsObj: KeyValueObject<TsObject<unknown>>) => Object.entries(tsObj).forEach(obj => this.#json[obj[0]] = obj[1].value);
        iterateMockedInterface(this.#interfacesCaptured);
        iterateMockedInterface(this.#typeCaptured);
        return structuredClone(this.#json);
    }

}