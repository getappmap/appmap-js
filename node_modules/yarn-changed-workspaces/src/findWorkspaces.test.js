const { promises: fs } = require("fs");
const { readJSONFile } = require("./readJSONFile");
const _glob = require("glob");
const { findWorkspaces } = require("./findWorkspaces");

jest.mock("fs", () => ({ promises: { stat: jest.fn() } }));
jest.mock("glob");
jest.mock("./readJSONFile");

describe("findWorkspaces", () => {
  test("it uses glob to find files", async () => {
    _glob.mockImplementationOnce((_, cb) => cb(null, []));
    await expect(
      findWorkspaces({ rootPath: "/app", pattern: "packages/*" })
    ).resolves.toEqual([]);
    expect(_glob).toHaveBeenCalledWith("/app/packages/*", expect.any(Function));
  });

  test("it fails if glob fails", async () => {
    _glob.mockImplementationOnce((_, cb) => cb(new Error("error"), null));
    await expect(
      findWorkspaces({ rootPath: "/app", pattern: "packages/*" })
    ).rejects.toThrowError("error");
  });

  test("it returns parsed workspaces with dependencies and excludes files", async () => {
    _glob.mockImplementationOnce((_, cb) =>
      cb(null, ["/app/packages/workspace", "/app/packages/file"])
    );
    fs.stat.mockImplementationOnce(() => ({
      isDirectory: () => true,
    }));
    fs.stat.mockImplementationOnce(() => ({
      isDirectory: () => false,
    }));
    readJSONFile.mockImplementationOnce(() => ({
      name: "workspace",
      path: "/app/packages/workspace",
      dependencies: { dependencies: "" },
      devDependencies: { devDependencies: "" },
      peerDependencies: { peerDependencies: "" },
      bundledDependencies: { bundledDependencies: "" },
      optionalDependencies: { optionalDependencies: "" },
    }));
    await expect(
      findWorkspaces({ rootPath: "/app", pattern: "packages/*" })
    ).resolves.toEqual([
      {
        id: "workspace",
        path: "/app/packages/workspace",
        dependencies: [
          "dependencies",
          "devDependencies",
          "peerDependencies",
          "bundledDependencies",
          "optionalDependencies",
        ],
      },
    ]);
    expect(readJSONFile).toHaveBeenCalledWith(
      "/app/packages/workspace/package.json"
    );
  });
});
