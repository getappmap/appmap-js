import * as JsonSchemaDiff from './api-types';
import {JsonSchemaDiffFactory} from './json-schema-diff-factory';

const jsonSchemaDiff: typeof JsonSchemaDiff = {
    diffSchemas: (options) => JsonSchemaDiffFactory.create().diffSchemas(options)
};

export = jsonSchemaDiff;
