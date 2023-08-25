const { filterWorkspaces } = require("./filterWorkspaces");

const getTouchedDependencies = ({ workspaces, files }) => {
  return Object.values(workspaces).reduce((changed, ws) => {
    const matched = filterWorkspaces({ workspace: ws, files });
    changed[ws.id] = changed[ws.id] || [];
    changed[ws.id] = changed[ws.id].concat(matched);
    if (matched.length > 0) {
      const queue = [ws];
      while (queue.length > 0) {
        const wa = queue.pop();
        Object.values(workspaces).forEach((wb) => {
          if (wa === wb) return;
          if (!wb.dependencies.includes(wa.id)) return;
          changed[wb.id] = changed[wb.id] || [];
          changed[wb.id] = changed[wb.id].concat(wa.path);
          queue.push(wb);
        });
      }
    }
    return changed;
  }, {});
};

exports.getTouchedDependencies = getTouchedDependencies;
