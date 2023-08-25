const { getChangedWorkspaces } = require("./getChangedWorkspaces");
const { getChangedWorkspacesIds } = require("./getChangedWorkspacesIds");

jest.mock("./getChangedWorkspaces");

describe("getChangedWorkspacesIds", () => {
  test("it removes namespaces", async () => {
    getChangedWorkspaces.mockImplementationOnce(() => ({
      "packages/app": ["packages/app/file"],
    }));
    await expect(
      getChangedWorkspacesIds({ namespace: "packages/" })
    ).resolves.toEqual({ app: ["packages/app/file"] });
  });

  test("it applies a naming convention", async () => {
    getChangedWorkspaces.mockImplementationOnce(() => ({
      "packages/app": ["packages/app/file"],
    }));
    await expect(
      getChangedWorkspacesIds({ keyNaming: "snakeCase" })
    ).resolves.toEqual({ packages_app: ["packages/app/file"] });
  });

  test("it returns empty list if no files changed", async () => {
    getChangedWorkspaces.mockImplementationOnce(() => ({
      "packages/app": [],
    }));
    await expect(
      getChangedWorkspacesIds({ namespace: "packages/" })
    ).resolves.toEqual({});
  });
});
