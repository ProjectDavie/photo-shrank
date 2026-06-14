import { dom }
from "./utils/dom.js";

import { state, getCurrentFolder }
from "./state/media.state.js";

import { renderGallery }
from "./components/gallery/gallery.render.js";

import {
  closeModal
} from "./components/modal/modal.js";

import {
  nextPhoto,
  prevPhoto
} from "./components/modal/modal.navigation.js";

import {
  renderFoldersList,
  selectFolder,
  updateMainContent
} from "./components/folder-navigator.js";

async function addFolder() {
  try {
    console.log("Opening folder...");

    const folderPath =
      await window.api
        .folder
        .open();

    console.log(
      "Selected folder:",
      folderPath
    );

    if (!folderPath) return;

    const allFiles =
      await window.api
        .folder
        .scan(folderPath);

    console.log(
      "All scanned files:",
      allFiles
    );

    const mediaFiles =
      allFiles.filter(
        f => {
          const lower =
            f.path
              .toLowerCase();

          return (
            !lower.endsWith(
              ".json"
            )
          );
        }
      );

    console.log(
      "Media files:",
      mediaFiles
    );

    state.folders.push({
      path: folderPath,
      scanned: true,
      migrated: false,
      allFiles: allFiles,
      mediaFiles: mediaFiles
    });

    selectFolder(
      state.folders.length - 1
    );

    renderFoldersList();
    updateMainContent();

  } catch (error) {
    console.error(
      "Folder operation failed:",
      error
    );
  }
}

dom.button.onclick = addFolder;

dom.closeBtn.onclick =
  closeModal;

document.addEventListener(
  "keydown",
  (e) => {

    if (
      dom.modal
        .style
        .display !== "flex"
    ) {
      return;
    }

    if (
      e.key ===
      "ArrowRight"
    ) {
      nextPhoto();
    }

    if (
      e.key ===
      "ArrowLeft"
    ) {
      prevPhoto();
    }

    if (
      e.key ===
      "Escape"
    ) {
      closeModal();
    }
  }
);