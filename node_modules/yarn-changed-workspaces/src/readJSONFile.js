const { promises: fs } = require("fs");

const readJSONFile = async (filePath) => {
  const buf = await fs.readFile(filePath, "utf-8");
  return JSON.parse(buf.toString());
};

exports.readJSONFile = readJSONFile;
