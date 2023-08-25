const { getTouchedDependencies } = require("./getTouchedDependencies");

describe("getTouchedDependencies", () => {
  test("it returns empty lists if no change", () => {
    expect(
      getTouchedDependencies({
        workspaces: {
          app1: {
            id: "app1",
            path: "/app/packages/app1",
            dependencies: [],
          },
          app2: {
            id: "app2",
            path: "/app/packages/app2",
            dependencies: [],
          },
        },
        files: [],
      })
    ).toEqual({
      app1: [],
      app2: [],
    });
  });

  test("it returns workspaces with changed files", () => {
    expect(
      getTouchedDependencies({
        workspaces: {
          app1: {
            id: "app1",
            path: "/app/packages/app1",
            dependencies: [],
          },
          app2: {
            id: "app2",
            path: "/app/packages/app2",
            dependencies: [],
          },
        },
        files: ["/app/packages/app1/file1"],
      })
    ).toEqual({
      app1: ["/app/packages/app1/file1"],
      app2: [],
    });
  });

  test("it returns deep dependants", () => {
    expect(
      getTouchedDependencies({
        workspaces: {
          app1: {
            id: "app1",
            path: "/app/packages/app1",
            dependencies: [],
          },
          app2: {
            id: "app2",
            path: "/app/packages/app2",
            dependencies: ["app1"],
          },
          app3: {
            id: "app3",
            path: "/app/packages/app3",
            dependencies: ["app2"],
          },
        },
        files: ["/app/packages/app1/file1"],
      })
    ).toEqual({
      app1: ["/app/packages/app1/file1"],
      app2: ["/app/packages/app1"],
      app3: ["/app/packages/app2"],
    });
  });

  test("it resolves circular loops", () => {
    expect(
      getTouchedDependencies({
        workspaces: {
          app1: {
            id: "app1",
            path: "/app/packages/app1",
            dependencies: ["app1"],
          },
        },
        files: ["/app/packages/app1/file1"],
      })
    ).toEqual({
      app1: ["/app/packages/app1/file1"],
    });
  });
});
