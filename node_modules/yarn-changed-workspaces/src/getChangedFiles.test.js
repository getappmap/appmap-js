const { getTouchedFiles } = require("./getTouchedFiles");
const { getTrackedFiles } = require("./getTrackedFiles");
const { getChangedFiles } = require("./getChangedFiles");

jest.mock("./getTouchedFiles");
jest.mock("./getTrackedFiles");

describe("getChangedFiles", () => {
  test("it returns unique files paths", async () => {
    getTouchedFiles.mockImplementationOnce(() => ["/myapp/myfile"]);
    getTrackedFiles.mockImplementationOnce(() => ["/myapp/myfile"]);
    await expect(
      getChangedFiles({ branch: "master", cwd: "/myapp" })
    ).resolves.toEqual(["/myapp/myfile"]);
    expect(getTouchedFiles).toHaveBeenCalledWith({
      cwd: "/myapp",
      branch: "master",
    });
    expect(getTrackedFiles).toHaveBeenCalledWith({
      cwd: "/myapp",
    });
  });
});
