import { Telemetry } from '@appland/telemetry';
import type yargs from 'yargs';

const TelemetryTestCommand = {
  command: 'test-telemetry',
  describe: false as const, // hidden command
  builder: (args: yargs.Argv) => args,
  // eslint-disable-next-line @typescript-eslint/require-await
  handler: async () => {
    Telemetry.enabled = true;
    Telemetry.debug = true;
    Telemetry.sendEvent({
      name: 'test_event',
      properties: { source: 'cli', timestamp: new Date().toISOString() },
    });
    Telemetry.flush(() => { /* no-op */ });
    // No output for hidden command
  },
};

export default TelemetryTestCommand;
