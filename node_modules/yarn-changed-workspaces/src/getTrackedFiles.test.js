const { exec: _exec } = require("child_process");
const { getTrackedFiles } = require("./getTrackedFiles");

jest.mock("child_process");

describe("getTrackedFiles", () => {
  test("it uses git status", async () => {
    _exec.mockImplementationOnce((_, __, cb) =>
      cb(null, { stdout: "", stderr: "" })
    );
    await expect(getTrackedFiles({ cwd: "/app" })).resolves.toEqual([]);
    expect(_exec).toHaveBeenCalledWith(
      "git status --short --untracked-files=all",
      { cwd: "/app" },
      expect.any(Function)
    );
  });

  test("it throws if error", async () => {
    _exec.mockImplementationOnce((_, __, cb) =>
      cb(null, { stdout: "", stderr: "error" })
    );
    await expect(getTrackedFiles({ cwd: "/app" })).rejects.toThrowError(
      "error"
    );
  });

  test("it returns resolved files paths", async () => {
    _exec.mockImplementationOnce((_, __, cb) =>
      cb(null, { stdout: " D ./file1\n M ./file2", stderr: "" })
    );
    await expect(getTrackedFiles({ cwd: "/app" })).resolves.toEqual([
      "/app/file1",
      "/app/file2",
    ]);
  });
});
