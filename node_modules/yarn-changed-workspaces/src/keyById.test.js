const { keyById } = require("./keyById");

describe("keyById", () => {
  test("it groups by id", () => {
    expect(
      [
        { id: "app1", dependencies: [] },
        { id: "app2", dependencies: [] },
      ].reduce(keyById, {})
    ).toEqual({
      app1: { id: "app1", dependencies: [] },
      app2: { id: "app2", dependencies: [] },
    });
  });

  test("it groups by id", () => {
    expect(
      [
        { id: "app1", dependencies: [] },
        { id: "app2", dependencies: [] },
      ].reduce(keyById, {})
    ).toEqual({
      app1: { id: "app1", dependencies: [] },
      app2: { id: "app2", dependencies: [] },
    });
  });

  test("it picks only existing dependent workspaces", () => {
    expect(
      [
        { id: "app1", dependencies: [] },
        { id: "app2", dependencies: ["app1", "react"] },
      ].reduce(keyById, {})
    ).toEqual({
      app1: { id: "app1", dependencies: [] },
      app2: { id: "app2", dependencies: ["app1"] },
    });
  });
});
