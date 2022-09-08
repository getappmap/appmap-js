import assert from 'assert';
import chalk from 'chalk';
import { openTicket } from '../../../lib/ticket/openTicket';
import UI from '../../userInteraction';
import printAppMapCount from '../action/printAppMapCount';
import RecordContext from '../recordContext';

export default async function testCasesComplete(
  recordContext: RecordContext
): Promise<undefined> {
  // Handle command failures here, rather than in a separate state, so we maintain compatibility
  // with the Azure Function that processes telemetry events.
  if (recordContext.failures > 0 || recordContext.appMapsCreated === 0) {
    UI.warn(
      `\n${chalk.yellow('!')} The test commands failed to create AppMaps\n`
    );

    const errors: string[] = recordContext.output || [
      `
Test command failed with no output`,
    ];
    await openTicket(errors);

    return;
  }

  assert(recordContext.appMapDir);
  await printAppMapCount(recordContext.appMapDir);

  return;
}
