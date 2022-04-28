import chalk from 'chalk';
import UI from '../../userInteraction';
import RecordContext from '../recordContext';
import TestCaseRecording from '../testCaseRecording';
import { State } from '../types/state';
import testCasesComplete from './testCasesComplete';

export default async function testCasesRunning(
  recordContext: RecordContext
): Promise<State> {
  const exitCodes = await TestCaseRecording.waitFor();

  recordContext.exitCodes = exitCodes;
  if (!exitCodes.every((code) => code === 0)) {
    UI.warn(`\n${chalk.yellow('!')} Some test commands failed\n`);
    await UI.continue('Press enter to continue');
  }

  return testCasesComplete;
}
