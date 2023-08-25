const { filterWorkspaces } = require("./filterWorkspaces");

describe("filterWorkspaces", () => {
  test("it selects files which match workspace path", () => {
    expect(
      filterWorkspaces({
        workspace: { id: "myapp", path: "/myapp" },
        files: ["/myapp/src/myfile.js", "/test/myfile.js"],
      })
    ).toEqual(["/myapp/src/myfile.js"]);
  });

  test("it filters files based on config.files", () => {
    expect(
      filterWorkspaces({
        workspace: {
          id: "myapp",
          path: "/myapp",
          config: { files: ["!**/*.test.js", "**/*.js"] },
        },
        files: ["/myapp/src/myfile.js", "/myapp/src/mytest.test.js"],
      })
    ).toEqual(["/myapp/src/myfile.js"]);
  });
});
