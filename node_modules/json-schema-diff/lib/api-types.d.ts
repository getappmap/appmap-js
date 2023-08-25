// tslint:disable:no-namespace

import {JsonSchema} from 'json-schema-spec-types';

declare namespace JsonSchemaDiff {
    export type Path = Array<string | number>;

    export interface DiffResult {
        additionsFound: boolean;
        addedJsonSchema: JsonSchema;
        removalsFound: boolean;
        removedJsonSchema: JsonSchema;
    }

    export interface JsonSchemaDiffOptions {
        sourceSchema: JsonSchema;
        destinationSchema: JsonSchema;
    }
}

declare interface JsonSchemaDiffStatic {
    diffSchemas: (options: JsonSchemaDiff.JsonSchemaDiffOptions) => Promise<JsonSchemaDiff.DiffResult>;
}

declare const JsonSchemaDiff: JsonSchemaDiffStatic;
export = JsonSchemaDiff;
