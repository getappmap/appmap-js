import readReportFile from './readReportFile';

export default async function verifyReportContents(
  expectedReportFileName: string,
  actualReportPath: string
) {
  const actualReport = readReportFile(actualReportPath);

  // .txt file to disable IDE auto-formatting.
  // Note that the IDE auto-formatting is actually good, beacuse it does things like replace
  // markdown elements such as '_' with '\_'. But it's not in scope for me to manually
  // make all the necessary changes right now.
  const expectedReport = readReportFile(expectedReportFileName);
  expect(actualReport).toEqual(expectedReport);
}
