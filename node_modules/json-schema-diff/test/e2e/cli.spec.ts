import {exec} from 'child_process';
import {expectToFail} from '../support/expect-to-fail';

const invokeJsonSchemaDiff = (sourceSchemaFile: string, destinationSchemaFile: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        exec(`./bin/json-schema-diff-local ${sourceSchemaFile} ${destinationSchemaFile}`, (error, stdout, stderr) => {
            const output = stdout.toString() + stderr.toString();

            if (error) {
                reject(new Error(`${error.message} ${output}`));
            } else {
                resolve(output);
            }
        });
    });
};

describe('json-schema-diff cli', () => {
    it('should find a difference in type', async () => {
        const error = await expectToFail(
            invokeJsonSchemaDiff(
                './test/e2e/fixtures/type-string-spec.json',
                './test/e2e/fixtures/type-number-spec.json'
            )
        );

        expect(error.message).toContain('Breaking changes found between the two schemas');
        expect(error.message).toContain('added');
        expect(error.message).toContain('removed');
    });

    it('should be successful when no differences are found', async () => {
        const output = await invokeJsonSchemaDiff(
            './test/e2e/fixtures/type-string-spec.json',
            './test/e2e/fixtures/type-string-spec.json'
        );

        expect(output).toContain('No differences found');
    });

    it('should return the error when a file cannot be found', async () => {
        const error = await expectToFail(
            invokeJsonSchemaDiff(
                './test/e2e/fixtures/type-string-spec.json',
                './test/e2e/fixtures/missing-file.json'
            )
        );

        expect(error.message).toContain('Error loading "./test/e2e/fixtures/missing-file.json"');
    });
});
