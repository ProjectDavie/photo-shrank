const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Returns the JSON sidecar path for a media file.
 * Example:
 * photo.jpg -> photo.json
 */
function getMetadataPath(mediaPath) {
  const dir = path.dirname(mediaPath);
  const ext = path.extname(mediaPath);
  const base = path.basename(mediaPath, ext);

  return path.join(dir, `${base}.json`);
}

/**
 * Creates default metadata structure.
 */
function createDefaultMetadata(mediaPath) {
  const stats = fs.statSync(mediaPath);

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),

    fileName: path.basename(mediaPath),

    originalFileName: path.basename(mediaPath),

    fileType: path.extname(mediaPath).replace(".", "").toLowerCase(),

    createdAt: stats.birthtime
      ? stats.birthtime.toISOString()
      : now,

    modifiedAt: stats.mtime
      ? stats.mtime.toISOString()
      : now,

    tags: [],

    people: [],

    description: "",

    favorite: false,

    rating: 0,

    ai: {
      captions: [],
      objects: [],
      faces: [],
      locations: [],
      labels: []
    },

    system: {
      archived: false,
      indexed: false,
      corrupted: false,
      portable: true
    }
  };
}

/**
 * Safely writes metadata JSON to disk.
 */
function saveMetadata(mediaPath, metadata) {
  try {
    const metadataPath = getMetadataPath(mediaPath);

    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    return metadata;
  } catch (error) {
    console.error("Failed to save metadata:", error);

    return null;
  }
}

/**
 * Creates metadata file if missing.
 */
function ensureMetadataFile(mediaPath) {
  const metadataPath = getMetadataPath(mediaPath);

  if (!fs.existsSync(metadataPath)) {
    const metadata = createDefaultMetadata(mediaPath);

    saveMetadata(mediaPath, metadata);

    return metadata;
  }

  return loadMetadata(mediaPath);
}

/**
 * Safely loads metadata JSON.
 * Handles:
 * - missing files
 * - invalid JSON
 * - corrupted JSON
 */
function loadMetadata(mediaPath) {
  try {
    const metadataPath = getMetadataPath(mediaPath);

    // Create if missing
    if (!fs.existsSync(metadataPath)) {
      return ensureMetadataFile(mediaPath);
    }

    const raw = fs.readFileSync(metadataPath, "utf8");

    // Empty JSON file fallback
    if (!raw.trim()) {
      const metadata = createDefaultMetadata(mediaPath);

      saveMetadata(mediaPath, metadata);

      return metadata;
    }

    const parsed = JSON.parse(raw);

    return parsed;

  } catch (error) {
    console.error("Invalid metadata JSON:", error);

    // Backup corrupted JSON
    try {
      const metadataPath = getMetadataPath(mediaPath);

      if (fs.existsSync(metadataPath)) {
        const corruptedPath = metadataPath.replace(
          ".json",
          `.corrupted.${Date.now()}.json`
        );

        fs.renameSync(metadataPath, corruptedPath);
      }
    } catch (backupError) {
      console.error("Failed to backup corrupted metadata:", backupError);
    }

    // Create fresh metadata
    const freshMetadata = createDefaultMetadata(mediaPath);

    freshMetadata.system.corrupted = true;

    saveMetadata(mediaPath, freshMetadata);

    return freshMetadata;
  }
}

/**
 * Updates metadata safely.
 * Merges existing fields.
 */
function updateMetadata(mediaPath, updates = {}) {
  const metadata = loadMetadata(mediaPath);

  const updated = {
    ...metadata,
    ...updates,

    modifiedAt: new Date().toISOString()
  };

  saveMetadata(mediaPath, updated);

  return updated;
}

/**
 * Adds tags safely without duplicates.
 */
function addTags(mediaPath, tags = []) {
  const metadata = loadMetadata(mediaPath);

  const mergedTags = [
    ...new Set([
      ...metadata.tags,
      ...tags
    ])
  ];

  metadata.tags = mergedTags;

  return updateMetadata(mediaPath, metadata);
}

/**
 * Adds people safely without duplicates.
 */
function addPeople(mediaPath, people = []) {
  const metadata = loadMetadata(mediaPath);

  const mergedPeople = [
    ...new Set([
      ...metadata.people,
      ...people
    ])
  ];

  metadata.people = mergedPeople;

  return updateMetadata(mediaPath, metadata);
}

/**
 * Deletes metadata JSON sidecar.
 */
function deleteMetadata(mediaPath) {
  try {
    const metadataPath = getMetadataPath(mediaPath);

    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }

    return true;
  } catch (error) {
    console.error("Failed to delete metadata:", error);

    return false;
  }
}

/**
 * SAFE FILENAME CLEANER
 */
function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, "")  // remove unsafe chars
    .trim()
    .replace(/\s+/g, "_")            // spaces → _
    .slice(0, 80);                   // limit length
}

/**
 * READ JSON SAFELY
 */
function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * WRITE JSON
 */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * GET ALL FILES IN FOLDER (SORTED)
 */
function getAllFiles(folderPath) {
  return fs.readdirSync(folderPath)
    .map(name => path.join(folderPath, name))
    .filter(p => fs.statSync(p).isFile())
    .sort((a, b) => a.localeCompare(b));
}

/**
 * MAIN AUTO MIGRATION ENGINE
 */
function autoMigrateFolder(folderPath) {
  const files = getAllFiles(folderPath);

  for (let i = 0; i < files.length - 1; i++) {
    const current = files[i];
    const next = files[i + 1];

    const isMedia = !current.endsWith(".json");
    const isJson = next.endsWith(".json");

    if (!isMedia || !isJson) continue;

    const json = readJson(next);
    if (!json || !json.title) continue;

    // skip already migrated
    if (json.migrated) continue;

    const safeName = sanitizeFileName(json.title);

    const extMedia = path.extname(current);
    const extJson = ".json";

    const dir = folderPath;

    const newMedia = path.join(dir, safeName + extMedia);
    const newJson = path.join(dir, safeName + extJson);

    // avoid overwrite collisions
    if (fs.existsSync(newMedia) || fs.existsSync(newJson)) continue;

    try {
      // rename media first
      fs.renameSync(current, newMedia);

      // rename json
      fs.renameSync(next, newJson);

      // mark metadata
      const updated = readJson(newJson);
      updated.migrated = true;
      updated.originalName = path.basename(current);
      writeJson(newJson, updated);

      console.log(`Migrated: ${current} → ${safeName}`);

    } catch (err) {
      console.error("Migration failed:", err);
    }
  }
}

module.exports = {
  getMetadataPath,

  createDefaultMetadata,

  ensureMetadataFile,

  loadMetadata,

  saveMetadata,

  updateMetadata,

  addTags,

  addPeople,

  deleteMetadata,

  sanitizeFileName,

  readJson,

  writeJson,

  getAllFiles,

  autoMigrateFolder
};