const { promises: fs } = require("fs");
const { readJSONFile } = require("./readJSONFile");

jest.mock("fs", () => ({ promises: { readFile: jest.fn() } }));

describe("readJSONFile", () => {
  test("it throws if readFile fails", async () => {
    fs.readFile.mockImplementationOnce(() => {
      throw new Error("error");
    });
    await expect(readJSONFile("/file1")).rejects.toThrowError("error");
  });

  test("it reads and parses JSON", async () => {
    const parse = jest.spyOn(JSON, "parse");
    fs.readFile.mockImplementationOnce(() => Buffer.from('{ "id": "app" }'));
    await expect(readJSONFile("/file1")).resolves.toEqual({ id: "app" });
    expect(fs.readFile).toHaveBeenCalledWith("/file1", "utf-8");
    expect(parse).toHaveBeenCalledWith('{ "id": "app" }');
  });
});
