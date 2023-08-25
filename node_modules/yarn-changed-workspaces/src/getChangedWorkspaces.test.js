const { getChangedFiles } = require("./getChangedFiles");
const { getTouchedDependencies } = require("./getTouchedDependencies");
const { getWorkspaces } = require("./getWorkspaces");
const { getChangedWorkspaces } = require("./getChangedWorkspaces");

jest.mock("./getChangedFiles");
jest.mock("./getTouchedDependencies");
jest.mock("./getWorkspaces");

describe("getChangedWorkspaces", () => {
  test("it calls getWorkspaces", async () => {
    await getChangedWorkspaces({ branch: "mybranch", projectRoot: "/" });
    expect(getWorkspaces).toHaveBeenCalledWith("/");
  });

  test("it calls getChangedFiles", async () => {
    await getChangedWorkspaces({ branch: "mybranch", projectRoot: "/" });
    expect(getChangedFiles).toHaveBeenCalledWith({
      cwd: "/",
      branch: "mybranch",
    });
  });

  test("it calls getTouchedDependencies", async () => {
    getWorkspaces.mockImplementationOnce(() => ({
      myapp: { id: "myapp", path: "/packages/myapp", dependencies: [] },
    }));
    getChangedFiles.mockImplementationOnce(() => ["/packages/myapp/myfile"]);
    await getChangedWorkspaces({ branch: "mybranch", projectRoot: "/" });
    expect(getTouchedDependencies).toHaveBeenCalledWith({
      files: ["/packages/myapp/myfile"],
      workspaces: {
        myapp: { id: "myapp", path: "/packages/myapp", dependencies: [] },
      },
    });
  });
});
