import assert from 'assert';
import chalk from 'chalk';
import openTicket from '../../../lib/ticket/openTicket';
import UI from '../../userInteraction';
import printAppMapCount from '../action/printAppMapCount';
import RecordContext from '../recordContext';

export default async function testCasesComplete(recordContext: RecordContext): Promise<undefined> {
  // Handle command failures here, rather than in a separate state, so we maintain compatibility
  // with the Azure Function that processes telemetry events.

  // If the reason test recording generated no appmaps is that there
  // were no testcases, then this isn't a failure.
  let isRubyWithNoTestcases = false;
  if (recordContext.output && recordContext.output.length > 0) {
    isRubyWithNoTestcases = /^No examples found./.test(recordContext.output[0]);
  }

  if (
    !isRubyWithNoTestcases &&
    (recordContext.failures > 0 || recordContext.appMapsCreated === 0)
  ) {
    if (recordContext.appMapsCreated === 0)
      UI.warn(`\n${chalk.yellow('!')} The test commands failed to create AppMaps\n`);

    const errors: string | string[] =
      recordContext.output?.join('\n').length > 0
        ? recordContext.output
        : `[Test command failed with no output]`;
    const helpMsg = ` If you want assistance, the test command, error message, exit code, and APPMAP environment variables can be uploaded securely to the AppMap ZenDesk support portal.`;
    await openTicket(errors, helpMsg);

    return;
  }

  assert(recordContext.appMapDir);
  await printAppMapCount(recordContext.appMapDir);

  return;
}
