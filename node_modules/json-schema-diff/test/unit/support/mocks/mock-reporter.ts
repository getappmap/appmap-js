import {Reporter} from '../../../../lib/json-schema-diff/reporter';

export type MockReporter = jasmine.SpyObj<Reporter>;

export const createMockReporter = (): MockReporter => {
    const mockReporter: MockReporter = jasmine.createSpyObj('reporter', [
        'reportError',
        'reportNoDifferencesFound',
        'reportFailureWithBreakingChanges',
        'reportNonBreakingChanges'
    ]);

    return mockReporter;
};
