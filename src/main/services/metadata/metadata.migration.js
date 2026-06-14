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

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function renameWithRetry(oldPath, newPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (err) {
      const isRetryable = err.code === 'EBUSY' || err.code === 'EPERM';
      const isLastAttempt = attempt === maxRetries;

      if (isRetryable && !isLastAttempt) {
        const waitTime = Math.min(1000 * attempt, 5000);
        await delay(waitTime);
        continue;
      }

      return {
        success: false,
        error: err,
        message: `Failed to rename ${path.basename(oldPath)}: ${err.message}`
      };
    }
  }
}

async function autoMigrateFolder(folderPath) {
  const files = getAllFiles(folderPath);
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (let i = 0; i < files.length - 1; i++) {
    const current = files[i];
    const next = files[i + 1];

    const isMedia = !current.endsWith(".json");
    const isJson = next.endsWith(".json");

    if (!isMedia || !isJson) continue;

    const json = readJson(next);

    if (!json?.title) {
      results.skipped++;
      continue;
    }

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
      const mediaResult = await renameWithRetry(current, newMedia);
      if (!mediaResult.success) {
        results.failed++;
        results.errors.push(mediaResult.message);
        console.error(mediaResult.message);
        continue;
      }

      await delay(100);

      const jsonResult = await renameWithRetry(next, newJson);
      if (!jsonResult.success) {
        results.failed++;
        results.errors.push(jsonResult.message);
        console.error(jsonResult.message);
        continue;
      }

      json.migrated = true;

      try {
        writeJson(newJson, json);
        results.success++;
      } catch (writeErr) {
        results.failed++;
        results.errors.push(`Failed to write metadata: ${writeErr.message}`);
        console.error(writeErr);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
      console.error(err);
    }

    await delay(50);
  }

  return results;
}

module.exports = {
  autoMigrateFolder
};