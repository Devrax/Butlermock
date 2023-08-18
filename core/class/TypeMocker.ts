import { checkConstant } from "@core/utils/dynamicValue.ts";
import { rand } from "@core/utils/randNumber.ts";
import { typeValidation } from "@core/utils/typeValidation.ts";

interface KeyValueObject<T> { [k: string]: T };
interface TsObject<T> { raw: string, obj: KeyValueObject<T>; isProcess: boolean };

export default class Interface2Mock {

    #json: KeyValueObject<unknown> = {};
    #interfacePatternRegex = /interface(([A-Za-z0-9 ]+)({)(.+)?)(})/g;
    #typePatternRegex = /type(([A-Za-z0-9 ]+)= ?)({)(.+)?(})/g;

    #interfacesCaptured: KeyValueObject<TsObject<unknown>> = {};
    #typeCaptured: KeyValueObject<TsObject<unknown>> = {};

    constructor(private interfaceReference: string, private anyReturn: unknown = null) {
        this.#captureTypesAndInterfaces(this.interfaceReference);
        [...Object.values(this.#interfacesCaptured), ...Object.values(this.#typeCaptured)].filter(Boolean).forEach(obj => this.#process(obj));
    }

    #captureTypesAndInterfaces(str: string) {
        str = str.replace(/{ +/g, '{').replace(/{\n+/g, '{').replace(/\n( +)/g, '').replace(/}/g, '}\n').replace(/;\n/g, ';'); //Remove any whitespace after line break
        const interfacesTaken = str.match(this.#interfacePatternRegex);
        const typesTaken = str.match(this.#typePatternRegex);

        const reusableIterator = (arr: string[], pattern: string, storeRef: KeyValueObject<TsObject<unknown>>) => {
            for (const item of arr) {
                if(item.match(/(.+)extends([A-Za-z0-9 ]+)/g) != null) throw new Error(`Butlermock is not capable of mocking interface inheritance yet, so we cannot provide you a mock for this interface "${item}", sorry :(`);

                const processItem = new RegExp(pattern, 'g').exec(item);
                if (processItem == null) throw new Error('Bad format for interface/type: ' + item);
                const [useless1, useless2, hashkey, openBracket, tsObject, closingBracket] = processItem;
                if(tsObject == null || tsObject === '') throw new Error(`"${item}" it seems empty, you cannot provide empty interface.`);
                storeRef[hashkey.trim()] = {
                    raw: `${openBracket} ${tsObject} ${closingBracket}`.trim(),
                    obj: {},
                    isProcess: false
                }

            }
        }

        if (interfacesTaken) reusableIterator(interfacesTaken, 'interface(([A-Za-z0-9 ]+)({)(.+)?)(})', this.#interfacesCaptured);
        if (typesTaken) reusableIterator(typesTaken, 'type(([A-Za-z0-9 ]+)= ?)({)(.+)?(})', this.#typeCaptured);
        if (typesTaken == null && interfacesTaken == null) throw new Error("No interfaces or types were found");
    }

    /**
     * This function process map each interface or types and creates the mock object assigning each value meeting its type one by one
     * is recursive
     * @param obj
     * @returns
     */
    #process(obj: TsObject<unknown>) {
        if (obj == null) return null;
        const splitEachMember = obj.raw.replace(/(\n|\t|{|}| )/g, '').split(';').filter(Boolean);
        for (const member of splitEachMember) {
            if(member.match(/\[(.+)\]/g) || member.match(/\((.+)\)/g)) break;
            let [keyName, type] = member.split(':');
            type = type == null ? (`${type}`).toLocaleLowerCase() : type.trim();
            keyName = keyName.replace('?', '');
            const deepTypeValid = typeValidation(type);
            if (deepTypeValid.isNotCustom) {
                obj.obj[keyName] = deepTypeValid.value ?? checkConstant(keyName, deepTypeValid.type, this.anyReturn);
            } else {
                const hashtype = String(deepTypeValid.type).replace(/\[\]/, '');
                const checkIfThatInterfaceExist = this.#findTypeValue(hashtype);
                if (checkIfThatInterfaceExist) {
                    const foundInterface = this.#interfacesCaptured[hashtype] ?? this.#typeCaptured[hashtype];
                    const recursiveValue = (t: string) => {
                        const val = this.#process(foundInterface);
                        return t.includes('[]') ? new Array(rand(5)).fill(structuredClone(val)) : val
                    }
                    const value = checkIfThatInterfaceExist?.isProcess ? checkIfThatInterfaceExist.obj : recursiveValue(deepTypeValid.type);
                    obj.obj[keyName] = deepTypeValid.type.includes('[]') ? Array.isArray(value) ? value : [value] : value;
                } else {
                    obj.obj[keyName] = null;
                }
            }
        }
        obj.isProcess = true;
        return structuredClone(obj.obj);
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
            return selectedInterface ? selectedInterface.obj : this.#typeCaptured[rootTypeInterface].obj;
        }

        const iterateMockedInterface = (tsObj: KeyValueObject<TsObject<unknown>>) => Object.entries(tsObj).forEach(obj => this.#json[obj[0]] = obj[1].obj);
        iterateMockedInterface(this.#interfacesCaptured);
        iterateMockedInterface(this.#typeCaptured);
        return structuredClone(this.#json);
    }

}