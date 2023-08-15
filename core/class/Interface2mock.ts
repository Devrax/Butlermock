import { checkConstant } from "@core/utils/dynamicValue.ts";
import { validTypes } from "@core/constants/ValidTypes.ts";


interface KeyValueObject<T> { [k: string]: T };
interface TsObject<T> { raw: string, obj: KeyValueObject<T>; isProcess: boolean };

export default class Interface2Mock {

    #json: KeyValueObject<unknown> = {};
    #interfacePatternRegex = /interface(([A-Za-z0-9 ]+)({(\n.+)+))/g;
    #typePatternRegex = /type(([A-Za-z0-9 ]+)( ?= ?){(\n.+)+)/g;

    #interfacesCaptured: KeyValueObject<TsObject<unknown>>  = {};
    #typeCaptured: KeyValueObject<TsObject<unknown>> = {};

    constructor(private interfaceReference: string) {
        this.#captureTypesAndInterfaces(this.interfaceReference);
        this.#process(Object.values(this.#interfacesCaptured)[0]);
        this.#process(Object.values(this.#typeCaptured)[0]);
    }

    #captureTypesAndInterfaces(str: string) {
        const interfacesTaken = str.match(this.#interfacePatternRegex);
        const typesTaken = str.match(this.#typePatternRegex);

        const reusableIterator = (arr: string[], pattern: string, storeRef: KeyValueObject<TsObject<unknown>>) => {
            for(const item of arr) {
                const processItem = new RegExp(pattern, 'g').exec(item);
                if(processItem == null) throw new Error('Bad format for interface/type: '+item);
                const [useless1, useless2, hashkey, tsObject, useless3] = processItem;

                storeRef[hashkey.trim()] = {
                    raw: tsObject.replace('=', '').trim(),
                    obj: {},
                    isProcess: false
                }
            }
        }

        if(interfacesTaken) reusableIterator(interfacesTaken, 'interface(([A-Za-z0-9 ]+)({(\n.+)+))', this.#interfacesCaptured);
        if(typesTaken) reusableIterator(typesTaken, 'type(([A-Za-z0-9 ]+)( ?= ?{(\n.+)+))' ,this.#typeCaptured);
        if(typesTaken == null && interfacesTaken == null) throw new Error("No interfaces or types were found");
    }

    /**
     * This function process map each interface or types and creates the mock object assigning each value meeting its type one by one
     * is recursive
     * @param obj 
     * @returns 
     */
    #process(obj: TsObject<unknown>) {
        const splitEachMember = obj.raw.replace(/(\n|\t|{|})/g, '').split(';').filter(Boolean);
        for(const member of splitEachMember) {
            let [keyName, type] = member.split(':');
            type = type == null ? (`${type}`).toLocaleLowerCase() : type.trim();
            keyName = keyName.replace('?', '');
            if(validTypes.includes(type)) {
                obj.obj[keyName] = checkConstant(keyName, type);
            } else {
                const checkIfThatInterfaceExist = this.#findTypeValue(type);
                if(checkIfThatInterfaceExist) {
                    obj.obj[keyName] = checkIfThatInterfaceExist?.isProcess ? checkIfThatInterfaceExist.obj : structuredClone(this.#process(this.#interfacesCaptured[type]));
                } else {
                    obj.obj[keyName] = null;
                }
            }
        }
        obj.isProcess = true;
        return obj.obj;
    }

    #findTypeValue(type: string) {
        const checkInterfaces = this.#interfacesCaptured[type];
        const checkTypes = this.#typeCaptured[type];

        if(checkInterfaces) return checkInterfaces;
        if(checkTypes) return checkTypes
    }

    public buildMock(rootTypeInterface = '') {
        if(rootTypeInterface) {
            const selectedInterface = this.#interfacesCaptured[rootTypeInterface];
            return selectedInterface ? selectedInterface.obj : this.#typeCaptured[rootTypeInterface].obj;
        }

        const iterateMockedInterface = (tsObj: KeyValueObject<TsObject<unknown>>) => Object.entries(tsObj).forEach(obj => this.#json[obj[0]] = obj[1].obj);
        iterateMockedInterface(this.#interfacesCaptured);
        iterateMockedInterface(this.#typeCaptured);
        
        return structuredClone(this.#json);
    }

}