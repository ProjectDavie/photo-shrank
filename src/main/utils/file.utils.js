const fs = require("fs");
const path = require("path");

function getAllFiles(folderPath) {
  return fs.readdirSync(folderPath)
    .map(name => path.join(folderPath, name))
    .filter(p => fs.statSync(p).isFile())
    .sort((a, b) => a.localeCompare(b));
}

function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

module.exports = {
  getAllFiles,
  sanitizeFileName
};