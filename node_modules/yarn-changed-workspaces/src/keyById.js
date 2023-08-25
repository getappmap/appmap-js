const keyById = (obj, workspaceA, _, workspaces) => ({
  ...obj,
  [workspaceA.id]: {
    ...workspaceA,
    dependencies: workspaceA.dependencies.filter((dependencyId) =>
      workspaces.some((workspaceB) => workspaceB.id === dependencyId)
    ),
  },
});

exports.keyById = keyById;
