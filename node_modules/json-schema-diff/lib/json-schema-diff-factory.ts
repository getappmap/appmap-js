import {JsonSchemaDiff} from './json-schema-diff';
import {FileReader} from './json-schema-diff/file-reader';
import {FileSystem} from './json-schema-diff/file-reader/file-system';
import {Reporter} from './json-schema-diff/reporter';
import {WrappedLog} from './json-schema-diff/reporter/wrapped-log';

export class JsonSchemaDiffFactory {
    public static create(): JsonSchemaDiff {
        const fileSystem = new FileSystem();
        const fileReader = new FileReader(fileSystem);
        const wrappedLog = new WrappedLog();
        const reporter = new Reporter(wrappedLog);
        return new JsonSchemaDiff(fileReader, reporter);
    }
}
