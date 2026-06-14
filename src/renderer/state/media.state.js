export const state = {
  folders: [],
  currentFolderIndex: -1,
  currentIndex: 0,
  viewMode: "folder", // "folder" or "all"
  sortBy: "date", // "date", "name", "metadata"
  filterByMetadata: null, // null, "has", "missing"
  showMetadataStatus: false,
  metadataStatus: {},
  thumbnails: {},
  fileInfos: {},
  totalFileCount: 0
};

export function getCurrentFolder() {
  if (state.currentFolderIndex === -1) return null;
  return state.folders[state.currentFolderIndex];
}

export function getAllMediaFiles() {
  let allMedia = [];
  state.folders.forEach(folder => {
    allMedia = allMedia.concat(folder.mediaFiles);
  });
  return allMedia;
}

export function getCurrentMediaFiles() {
  if (state.viewMode === "all") {
    return getAllMediaFiles();
  }
  const folder = getCurrentFolder();
  return folder?.mediaFiles || [];
}