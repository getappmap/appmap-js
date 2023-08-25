import {JsonSchema} from 'json-schema-spec-types';
import {DiffResult} from '../api-types';
import {WrappedLog} from './reporter/wrapped-log';

export class Reporter {
    private static getAddedValuesMessage(schema: JsonSchema): string {
        return `Values described by the following schema were added:\n${JSON.stringify(schema, null, 4)}`;
    }

    private static getRemovedValuesMessage(schema: JsonSchema): string {
        return `Values described by the following schema were removed:\n${JSON.stringify(schema, null, 4)}`;
    }

    private static getAddedAndRemovedValuesMessage(diffResult: DiffResult): string {
        return `${Reporter.getAddedValuesMessage(diffResult.addedJsonSchema)}\n\n` +
            `${Reporter.getRemovedValuesMessage(diffResult.removedJsonSchema)}`;
    }

    public constructor(private readonly wrappedLog: WrappedLog) {
    }

    public reportError(error: Error): void {
        this.wrappedLog.error(error);
    }

    public reportNoDifferencesFound(): void {
        this.wrappedLog.info('No differences found');
    }

    public reportFailureWithBreakingChanges(diffResult: DiffResult): void {
        const output = 'Breaking changes found between the two schemas.\n\n' +
            `${Reporter.getAddedAndRemovedValuesMessage(diffResult)}`;
        this.wrappedLog.error(output);
    }

    public reportNonBreakingChanges(diffResult: DiffResult): void {
        const output = 'Non-breaking changes found between the two schemas.\n\n' +
            `${Reporter.getAddedAndRemovedValuesMessage(diffResult)}`;
        this.wrappedLog.info(output);
    }
}
