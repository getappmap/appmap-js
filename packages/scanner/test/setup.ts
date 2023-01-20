import { stubTelemetry, unstubTelemetry } from './util';

beforeEach(stubTelemetry);
afterEach(unstubTelemetry);
