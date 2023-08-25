import {JsonSchemaDiff} from '../../../lib/json-schema-diff';
import {FileReader} from '../../../lib/json-schema-diff/file-reader';
import {createMockFileSystem, MockFileSystem} from './mocks/mock-file-system';
import {createMockReporter, MockReporter} from './mocks/mock-reporter';

interface CreateJsonSchemaDiffMocks {
    mockFileSystem: MockFileSystem;
    mockReporter: MockReporter;
}

export const createJsonSchemaDiffWithMocks = (mocks: CreateJsonSchemaDiffMocks): JsonSchemaDiff => {
    const fileReader = new FileReader(mocks.mockFileSystem);
    return new JsonSchemaDiff(fileReader, mocks.mockReporter);
};

export const createJsonSchemaDiff = (): JsonSchemaDiff => {
    return createJsonSchemaDiffWithMocks({
        mockFileSystem: createMockFileSystem(),
        mockReporter: createMockReporter()
    });
};
