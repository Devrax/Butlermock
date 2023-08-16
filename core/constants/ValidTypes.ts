const allowedNonPrimitives = ['Date', 'any'];
const allowedArrayNonPrimitives = ['Date[]', 'any[]'];
const allowedPrimitives = ['string', 'number', 'boolean', 'bigint', 'null', 'undefined']; // TODO: In the future I will check for symbol
const allowedArrayPrimitives = ['string[]', 'number[]', 'boolean[]', 'bigint[]', 'null[]', 'undefined[]']
export const validTypes = [...allowedPrimitives, ...allowedNonPrimitives, ...allowedArrayPrimitives, ...allowedArrayNonPrimitives]