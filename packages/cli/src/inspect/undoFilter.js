/**
 * @param {import('./context').default} context
 */
const undoFilter = async (context, home) => {
  await context.undoFilter();
  console.log();
  home();
};

module.exports = undoFilter;
