import printAppMapCount from '../action/printAppMapCount';

export default async function testCasesComplete(): Promise<undefined> {
  await printAppMapCount();

  return;
}
