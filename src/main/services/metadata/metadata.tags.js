const {
  loadMetadata,
  saveMetadata
} = require("./metadata.service");

function addTags(mediaPath, tags = []) {
  const metadata = loadMetadata(mediaPath);

  metadata.tags = [
    ...new Set([
      ...metadata.tags,
      ...tags
    ])
  ];

  return saveMetadata(mediaPath, metadata);
}

function addPeople(mediaPath, people = []) {
  const metadata = loadMetadata(mediaPath);

  metadata.people = [
    ...new Set([
      ...metadata.people,
      ...people
    ])
  ];

  return saveMetadata(mediaPath, metadata);
}

module.exports = {
  addTags,
  addPeople
};