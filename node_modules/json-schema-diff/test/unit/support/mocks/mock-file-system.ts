import * as assert from 'assert';
import {FileSystem} from '../../../../lib/json-schema-diff/file-reader/file-system';

interface MockFileSystemHelpers {
    givenReadFileReturnsContent(stringContent: string): void;
    givenReadFileReturnsContents(files: {[fileName: string]: Promise<string>}): void;
    givenReadFileReturnsJsonContent(jsonContent: object): void;
    givenReadFileReturnsError(error: Error): void;
}

export type MockFileSystem = jasmine.SpyObj<FileSystem> & MockFileSystemHelpers;

export const createMockFileSystem = (): MockFileSystem => {
    const mockFileSystem: MockFileSystem = jasmine.createSpyObj('mockFileSystem', ['readFile']);

    mockFileSystem.givenReadFileReturnsContent = (stringContent) => {
        mockFileSystem.readFile.and.returnValue(Promise.resolve(stringContent));
    };

    mockFileSystem.givenReadFileReturnsContents = (files) => {
        mockFileSystem.readFile.and.callFake((filePath: string): Promise<string> => {
            const file = files[filePath];
            assert.ok(file !== undefined, `Unexpected call to fileSystem.readFile with "${filePath}"`);
            return file;
        });
    };

    mockFileSystem.givenReadFileReturnsJsonContent = (jsonContent) => {
        const contentAsJsonString = JSON.stringify(jsonContent);
        mockFileSystem.givenReadFileReturnsContent(contentAsJsonString);
    };

    mockFileSystem.givenReadFileReturnsError = (error) => {
        mockFileSystem.readFile.and.returnValue(Promise.reject(error));
    };

    mockFileSystem.givenReadFileReturnsJsonContent({});

    return mockFileSystem;
};
