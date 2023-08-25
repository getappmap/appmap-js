import {SimpleTypes} from 'json-schema-spec-types';

export const isTypeSupported = (parsedTypeKeyword: SimpleTypes[], type: SimpleTypes): boolean =>
    parsedTypeKeyword.indexOf(type) >= 0;
