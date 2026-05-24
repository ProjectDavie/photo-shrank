const path = require("path");

function getMetadataPath(mediaPath) {
  const dir = path.dirname(mediaPath);
  const ext = path.extname(mediaPath);
  const base = path.basename(mediaPath, ext);

  return path.join(dir, `${base}.json`);
}

module.exports = {
  getMetadataPath
};