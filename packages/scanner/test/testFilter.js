const FILTERED_TESTS = process.platform === 'win32' ? ['commands'] : [];

function filterTests(testPath) {
  if (FILTERED_TESTS.length === 0) {
    return true;
  }

  return FILTERED_TESTS.some((filteredTest) => !testPath.includes(filteredTest));
}

module.exports = (testPaths) => {
  const allowedPaths = testPaths.filter(filterTests).map((test) => ({ test }));

  return {
    filtered: allowedPaths,
  };
};
