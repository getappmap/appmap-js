const undoFilter = async (filters, buildStats, home) => {
  if (filters.length > 0) {
    filters.pop();
  }
  await buildStats();
  console.log();
  home();
};

module.exports = undoFilter;
