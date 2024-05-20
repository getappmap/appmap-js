import readReportFile from './readReportFile';

export default async function verifyReportContents(
  expectedReportFileName: string,
  actualReportPath: string,
  replacePatterns: [RegExp, string][] = []
) {
  let actualReport = readReportFile(actualReportPath);

  // .txt file to disable IDE auto-formatting.
  // Note that the IDE auto-formatting is actually good, because it does things like replace
  // markdown elements such as '_' with '\_'. But it's not in scope for me to manually
  // make all the necessary changes right now.
  let expectedReport = readReportFile(expectedReportFileName);
  for (const [pattern, replacement] of replacePatterns) {
    actualReport = actualReport.replace(pattern, replacement);
    expectedReport = expectedReport.replace(pattern, replacement);
  }
  expect(actualReport).toEqual(expectedReport);
}
