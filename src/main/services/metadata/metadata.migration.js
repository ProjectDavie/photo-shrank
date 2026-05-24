const fs = require("fs");
const path = require("path");

const {
  getAllFiles,
  sanitizeFileName
} = require("../../utils/file.utils");

const {
  readJson,
  writeJson
} = require("../../utils/json.utils");

function autoMigrateFolder(folderPath) {
  const files = getAllFiles(folderPath);

  for (let i = 0; i < files.length - 1; i++) {
    const current = files[i];
    const next = files[i + 1];

    const isMedia = !current.endsWith(".json");
    const isJson = next.endsWith(".json");

    if (!isMedia || !isJson) continue;

    const json = readJson(next);

    if (!json?.title) continue;

    const safeName = sanitizeFileName(json.title);

    const newMedia = path.join(
      folderPath,
      safeName + path.extname(current)
    );

    const newJson = path.join(
      folderPath,
      safeName + ".json"
    );

    try {
      fs.renameSync(current, newMedia);
      fs.renameSync(next, newJson);

      json.migrated = true;

      writeJson(newJson, json);

    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = {
  autoMigrateFolder
};