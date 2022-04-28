import printAppMapCount from '../action/printAppMapCount';
import RecordContext from '../recordContext';

export default async function testCasesComplete(
  recordContext: RecordContext
): Promise<undefined> {
  await recordContext.populateAppMapCount();

  await printAppMapCount(recordContext.appMapDir);

  return;
}
