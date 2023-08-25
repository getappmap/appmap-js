import {JsonSchema} from 'json-schema-spec-types';
import {DiffResult} from '../../../lib/api-types';
import {expectToFail} from '../../support/expect-to-fail';
import {createJsonSchemaDiff} from './create-json-schema-diff';

export const invokeDiff = async (sourceSchema: JsonSchema, destinationSchema: JsonSchema): Promise<DiffResult> => {
    try {
        const jsonSchemaDiff = createJsonSchemaDiff();
        return await jsonSchemaDiff.diffSchemas({sourceSchema, destinationSchema});
    } catch (error) {
        fail(error.stack);
        throw error;
    }
};

export const invokeDiffAndExpectToFail = async (sourceSchema: JsonSchema,
                                                destinationSchema: JsonSchema): Promise<Error> => {
    const jsonSchemaDiff = createJsonSchemaDiff();
    return expectToFail(jsonSchemaDiff.diffSchemas({sourceSchema, destinationSchema}));
};
