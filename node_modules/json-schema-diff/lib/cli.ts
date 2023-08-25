import * as commander from 'commander';
import {JsonSchemaDiffFactory} from './json-schema-diff-factory';

// tslint:disable:no-var-requires
const packageJson = require('../package.json');

const jsonSchemaDiff = JsonSchemaDiffFactory.create();

commander
    .version(packageJson.version)
    .arguments('<sourceSchemaFile> <destinationSchemaFile>')
    .description('Finds differences between two json schema files')
    .action(async (sourceSchemaFile, destinationSchemaFile) => {
        try {
            await jsonSchemaDiff.diffFiles(sourceSchemaFile, destinationSchemaFile);
        } catch (error) {
            process.exitCode = 1;
        }
    })
    .on('--help', () => {
        console.log(`
The <sourceSchemaFile> and <destinationSchemaFile> are file paths where the source and destination schemas are located.
The files must be encoded in JSON format.
The files must be valid according to Json Schema draft-07.

The command will return a collection of any differences found in a human readable format.
It fail if any removed differences are detected.`
        );
    })
    .parse(process.argv);

if (!commander.args.length) {
    commander.help();
    process.exitCode = 1;
}
