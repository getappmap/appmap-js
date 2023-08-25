const { exec: _exec } = require("child_process");
const { getTouchedFiles } = require("./getTouchedFiles");

jest.mock("child_process");

describe("getTouchedFiles", () => {
  test("it uses git diff with the given branch", async () => {
    _exec.mockImplementationOnce((_, __, cb) =>
      cb(null, { stdout: "", stderr: "" })
    );
    await expect(
      getTouchedFiles({ branch: "master", cwd: "/app" })
    ).resolves.toEqual([]);
    expect(_exec).toHaveBeenCalledWith(
      "git diff --name-only master",
      { cwd: "/app" },
      expect.any(Function)
    );
  });

  test("it returns resolved files paths", async () => {
    _exec.mockImplementationOnce((_, __, cb) =>
      cb(null, { stdout: "./file1\n./file2" })
    );
    await expect(
      getTouchedFiles({ branch: "master", cwd: "/app" })
    ).resolves.toEqual(["/app/file1", "/app/file2"]);
  });

  test("it throws if error", async () => {
    _exec.mockImplementationOnce((_, __, cb) =>
      cb(null, { stdout: "", stderr: "error" })
    );
    await expect(
      getTouchedFiles({ branch: "master", cwd: "/app" })
    ).rejects.toThrowError("error");
  });
});
