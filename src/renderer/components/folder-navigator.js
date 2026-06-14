import { state, getCurrentFolder, getCurrentMediaFiles, getAllMediaFiles } from "../state/media.state.js";
import { renderGallery } from "./gallery/gallery.render.js";

function createFolderElement(folder, index) {
  const div = document.createElement("div");
  div.className = "folder-item";
  if (index === state.currentFolderIndex && state.viewMode === "folder") {
    div.classList.add("active");
  }

  const folderPath = folder.path.split("\\").pop();

  div.innerHTML = `
    <div class="folder-name">${folderPath}</div>
    <div class="folder-status">
      <span class="status-badge ${folder.scanned ? "scanned" : ""}">
        ${folder.scanned ? "✓ Scanned" : "Pending"}
      </span>
      <span class="status-badge ${folder.migrated ? "migrated" : ""}">
        ${folder.migrated ? "✓ Migrated" : ""}
      </span>
    </div>
    <div class="folder-actions">
      <button class="select-btn">Select</button>
      ${!folder.migrated ? `<button class="migrate-btn">Migrate</button>` : ""}
    </div>
  `;

  const selectBtn = div.querySelector(".select-btn");
  selectBtn.onclick = (e) => {
    e.stopPropagation();
    selectFolder(index);
  };

  const migrateBtn = div.querySelector(".migrate-btn");
  if (migrateBtn) {
    migrateBtn.onclick = (e) => {
      e.stopPropagation();
      migrateFolder(index);
    };
  }

  return div;
}

function selectFolder(index) {
  state.viewMode = "folder";
  state.currentFolderIndex = index;
  state.currentIndex = 0;
  state.showMetadataStatus = false;
  renderFoldersList();
  updateMainContent();
}

function viewAllFolders() {
  state.viewMode = "all";
  state.currentIndex = 0;
  renderFoldersList();
  updateMainContent();
}

async function migrateFolder(index) {
  const folder = state.folders[index];
  try {
    const results = await window.api.migration.autoRename(folder.path);
    
    if (results.success > 0) {
      folder.migrated = true;
    }

    let message = `Migration complete:\n✓ ${results.success} migrated`;
    if (results.skipped > 0) message += `\n⊘ ${results.skipped} skipped (no title)`;
    if (results.failed > 0) {
      message += `\n✗ ${results.failed} failed`;
      if (results.errors.length > 0) {
        message += `\n\nErrors:\n${results.errors.slice(0, 3).join('\n')}`;
        if (results.errors.length > 3) message += `\n... and ${results.errors.length - 3} more`;
      }
    }

    alert(message);
    renderFoldersList();
    
  } catch (err) {
    console.error("Migration failed:", err);
    alert(`Migration error: ${err.message}`);
  }
}

async function getFileDate(filePath) {
  const folder = state.folders.find(f => f.allFiles.some(file => file.path === filePath));
  if (!folder) return null;

  const jsonFile = folder.allFiles.find(
    (file, idx, arr) =>
      arr[idx - 1]?.path === filePath &&
      file.path.endsWith(".json")
  );

  if (!jsonFile) return null;

  try {
    const json = await window.api.metadata.read(jsonFile.path);
    return json.date || json.created || null;
  } catch (err) {
    return null;
  }
}

async function sortAndFilterMediaFiles(mediaFiles) {
  // Apply metadata filter first
  let filtered = mediaFiles;

  if (state.filterByMetadata !== null) {
    filtered = mediaFiles.filter(file => {
      const hasMetadata = 
        state.metadataStatus?.[file.path] ?? true;

      if (state.filterByMetadata === "has") {
        return hasMetadata;
      } else if (state.filterByMetadata === "missing") {
        return !hasMetadata;
      }
      return true;
    });
  }

  // Apply sorting
  if (state.sortBy === "date") {
    const filesWithDates = await Promise.all(
      filtered.map(async (file) => ({
        ...file,
        date: await getFileDate(file.path)
      }))
    );

    return filesWithDates.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB;
    });
  } else if (state.sortBy === "metadata") {
    return filtered.sort((a, b) => {
      const aHas = state.metadataStatus?.[a.path] ?? true;
      const bHas = state.metadataStatus?.[b.path] ?? true;
      return (bHas ? 1 : 0) - (aHas ? 1 : 0);
    });
  }

  return filtered;
}

async function checkMetadataCompleteness() {
  const mediaFiles = getCurrentMediaFiles();
  const metadataStatus = {};

  const folder = state.viewMode === "all" 
    ? null 
    : getCurrentFolder();

  mediaFiles.forEach(mediaFile => {
    const allFiles = folder?.allFiles || 
      state.folders.flatMap(f => f.allFiles);

    const mediaIndex = allFiles.findIndex(
      f => f.path === mediaFile.path
    );

    if (mediaIndex === -1) {
      metadataStatus[mediaFile.path] = false;
      return;
    }

    const nextFile = allFiles[mediaIndex + 1];
    const hasJsonPair = 
      nextFile?.path.endsWith(".json");

    metadataStatus[mediaFile.path] = 
      hasJsonPair;
  });

  state.showMetadataStatus = true;
  state.metadataStatus = metadataStatus;

  const missingCount = Object.values(
    metadataStatus
  ).filter(v => !v).length;

  alert(
    `Metadata Check:\n✓ ${mediaFiles.length - missingCount} files have JSON\n✕ ${missingCount} files missing JSON`
  );

  updateMainContent();
}

async function createMissingJsons() {
  const folder = getCurrentFolder();
  if (!folder) {
    alert("Please select a folder first");
    return;
  }

  const missingFiles = Object.entries(
    state.metadataStatus || {}
  )
    .filter(([path, hasJson]) => !hasJson)
    .map(([path]) => path);

  if (missingFiles.length === 0) {
    alert("All files have JSON metadata!");
    return;
  }

  const proceed = confirm(
    `Create ${missingFiles.length} JSON files for missing metadata?`
  );

  if (!proceed) return;

  let createdCount = 0;
  const errors = [];

  for (const filePath of missingFiles) {
    try {
      const fileName = filePath
        .split("\\")
        .pop()
        .replace(/\.[^/.]+$/, "");

      const metadata = {
        title: fileName,
        date: new Date().toISOString(),
        created: new Date().toISOString(),
        tags: [],
        people: []
      };

      await window.api.metadata.save(
        filePath,
        metadata
      );

      createdCount++;
    } catch (err) {
      errors.push(
        `Failed for ${filePath}: ${err.message}`
      );
    }
  }

  let message = 
    `Created ${createdCount} JSON files`;

  if (errors.length > 0) {
    message += `\n\n${errors.length} errors:\n${errors
      .slice(0, 3)
      .join('\n')}`;
  }

  alert(message);
  
  // Refresh metadata check
  await checkMetadataCompleteness();
}

function toggleMetadataDisplay() {
  state.showMetadataStatus = 
    !state.showMetadataStatus;
  updateMainContent();
}

async function updateMainContent() {
  state.currentIndex = 0;
  let mediaFiles = getCurrentMediaFiles();
  mediaFiles = await sortAndFilterMediaFiles(mediaFiles);

  let displayText = "";
  const fileCount = mediaFiles.length;

  if (state.viewMode === "all") {
    const totalFiles = getAllMediaFiles().length;
    state.totalFileCount = totalFiles;
    const filtered = state.filterByMetadata 
      ? ` (${fileCount}/${totalFiles})` 
      : ` (${totalFiles} total)`;
    displayText = `Viewing: All Folders${filtered}`;
  } else {
    const folder = getCurrentFolder();
    if (folder) {
      const folderPath = folder.path.split("\\").pop();
      const filtered = state.filterByMetadata 
        ? ` (${fileCount}/${folder.mediaFiles.length})` 
        : ` (${folder.mediaFiles.length})`;
      displayText = `Selected: ${folderPath}${filtered}`;
    }
  }

  document.getElementById("folder-path").textContent = displayText;

  const metadataStatusToPass = 
    state.showMetadataStatus 
      ? state.metadataStatus 
      : null;

  renderGallery(
    mediaFiles, 
    metadataStatusToPass
  );
}

function handleSortChange(event) {
  state.sortBy = event.target.value;
  updateMainContent();
}

export function renderFoldersList() {
  const container = document.getElementById("folders-list");
  container.innerHTML = "";

  // View All button
  const viewAllDiv = document.createElement("div");
  viewAllDiv.className = "view-all-btn";
  if (state.viewMode === "all") {
    viewAllDiv.classList.add("active");
  }
  const viewAllBtn = document.createElement("button");
  viewAllBtn.textContent = "👁 View All";
  viewAllBtn.onclick = viewAllFolders;
  viewAllDiv.appendChild(viewAllBtn);
  container.appendChild(viewAllDiv);

  // Separator
  const separator = document.createElement("div");
  separator.className = "folders-separator";
  container.appendChild(separator);

  // Folders list
  const foldersList = document.createElement("div");
  foldersList.className = "folders-items";

  state.folders.forEach((folder, index) => {
    const element = createFolderElement(folder, index);
    foldersList.appendChild(element);
  });

  container.appendChild(foldersList);

  // Metadata check button
  const metadataDiv = document.createElement("div");
  metadataDiv.className = "metadata-check-section";
  const checkBtn = document.createElement("button");
  checkBtn.textContent = "🔍 Check Metadata";
  checkBtn.onclick = checkMetadataCompleteness;
  metadataDiv.appendChild(checkBtn);
  
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = state.showMetadataStatus 
    ? "Hide Status" 
    : "Show Status";
  toggleBtn.onclick = toggleMetadataDisplay;
  toggleBtn.style.display = state.metadataStatus 
    ? "block" 
    : "none";
  metadataDiv.appendChild(toggleBtn);
  container.appendChild(metadataDiv);

  // Sort dropdown
  const sortDiv = document.createElement("div");
  sortDiv.className = "sort-section";
  const sortLabel = document.createElement("label");
  sortLabel.textContent = "Sort by:";
  const sortSelect = document.createElement("select");
  sortSelect.innerHTML = `
    <option value="date">Date</option>
    <option value="name">Name</option>
  `;
  sortSelect.value = state.sortBy;
  sortSelect.onchange = handleSortChange;
  sortDiv.appendChild(sortLabel);
  sortDiv.appendChild(sortSelect);
  container.appendChild(sortDiv);
}

export { updateMainContent, selectFolder, migrateFolder, viewAllFolders, checkMetadataCompleteness };
