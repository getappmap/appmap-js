const { readJSONFile } = require("./readJSONFile");
const { findWorkspaces } = require("./findWorkspaces");
const { getWorkspaces } = require("./getWorkspaces");

jest.mock("./readJSONFile");
jest.mock("./findWorkspaces");

describe("getWorkspaces", () => {
  test("it fails if readJSONFile fails", async () => {
    readJSONFile.mockImplementationOnce(() => {
      throw new Error("error");
    });
    await expect(getWorkspaces("/app")).rejects.toThrowError("error");
  });

  test("it reads package.json in rootDir", async () => {
    readJSONFile.mockImplementationOnce(() => ({ workspaces: [] }));
    await expect(getWorkspaces("/app")).resolves.toEqual({});
    expect(readJSONFile).toHaveBeenCalledWith("/app/package.json");
  });

  test("it returns workspaces", async () => {
    readJSONFile.mockImplementationOnce(() => ({
      workspaces: ["packages/*"],
    }));
    findWorkspaces.mockImplementationOnce(() => [
      { id: "app1", path: "/app/packages/app1", dependencies: [] },
      { id: "app2", path: "/app/packages/app2", dependencies: ["app1"] },
    ]);
    await expect(getWorkspaces("/app")).resolves.toEqual({
      app1: { id: "app1", path: "/app/packages/app1", dependencies: [] },
      app2: { id: "app2", path: "/app/packages/app2", dependencies: ["app1"] },
    });
    expect(findWorkspaces).toHaveBeenCalledWith({
      pattern: "packages/*",
      rootPath: "/app",
    });
  });

  test("it returns workspaces.packages", async () => {
    readJSONFile.mockImplementationOnce(() => ({
      workspaces: {
        packages: ["packages/*"],
      },
    }));
    findWorkspaces.mockImplementationOnce(() => [
      { id: "app1", path: "/app/packages/app1", dependencies: [] },
      { id: "app2", path: "/app/packages/app2", dependencies: ["app1"] },
    ]);
    await expect(getWorkspaces("/app")).resolves.toEqual({
      app1: { id: "app1", path: "/app/packages/app1", dependencies: [] },
      app2: { id: "app2", path: "/app/packages/app2", dependencies: ["app1"] },
    });
    expect(findWorkspaces).toHaveBeenCalledWith({
      pattern: "packages/*",
      rootPath: "/app",
    });
  });
});
