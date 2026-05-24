const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { getMetadataPath } = require("./metadata.helpers");

function createDefaultMetadata(mediaPath) {
  const stats = fs.statSync(mediaPath);

  return {
    id: crypto.randomUUID(),

    fileName: path.basename(mediaPath),

    fileType: path.extname(mediaPath)
      .replace(".", "")
      .toLowerCase(),

    createdAt: stats.birthtime.toISOString(),

    modifiedAt: stats.mtime.toISOString(),

    tags: [],
    people: [],

    ai: {
      captions: [],
      labels: []
    },

    system: {
      corrupted: false
    }
  };
}

function saveMetadata(mediaPath, metadata) {
  const metadataPath = getMetadataPath(mediaPath);

  fs.writeFileSync(
    metadataPath,
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  return metadata;
}

function loadMetadata(mediaPath) {
  try {
    const metadataPath = getMetadataPath(mediaPath);

    if (!fs.existsSync(metadataPath)) {
      const metadata = createDefaultMetadata(mediaPath);

      saveMetadata(mediaPath, metadata);

      return metadata;
    }

    return JSON.parse(
      fs.readFileSync(metadataPath, "utf8")
    );

  } catch {
    const fresh = createDefaultMetadata(mediaPath);

    fresh.system.corrupted = true;

    saveMetadata(mediaPath, fresh);

    return fresh;
  }
}

module.exports = {
  createDefaultMetadata,
  saveMetadata,
  loadMetadata
};