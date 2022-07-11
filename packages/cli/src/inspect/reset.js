/**
 * @param {Context} context
 */
const reset = async (context, home) => {
  await context.clearFilters();
  console.log();
  home();
};

module.exports = reset;
