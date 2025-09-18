import { Telemetry } from '@appland/telemetry';
import type { CommandModule } from 'yargs';

const TelemetryTestCommand: CommandModule = {
  command: 'test-telemetry',
  describe: false, // hidden command
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
