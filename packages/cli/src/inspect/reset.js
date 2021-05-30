const reset = async (filters, buildStats, home) => {
  while (filters.length > 0) {
    filters.pop();
  }
  await buildStats();
  console.log();
  home();
};

module.exports = reset;
