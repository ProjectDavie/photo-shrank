import { dom }
from "./utils/dom.js";

import { state }
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
  showInfo
} from "./components/modal/modal.info.js";

dom.button.onclick =
  async () => {

    try {

      console.log(
        "Opening folder..."
      );

      const folder =
        await window.api
          .folder
          .open();

      console.log(
        "Selected folder:",
        folder
      );

      if (!folder) return;

      dom.folderPathSpan
        .textContent =
          `Selected: ${folder}`;

      state.allFiles =
        await window.api
          .folder
          .scan(folder);

      console.log(
        "All scanned files:",
        state.allFiles
      );

      state.mediaFiles =
        state.allFiles.filter(
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
        state.mediaFiles
      );

      await renderGallery(
        state.mediaFiles
      );

    } catch (error) {

      console.error(
        "Folder open/scan failed:",
        error
      );

      dom.folderPathSpan
        .textContent =
          "Failed to open folder.";
    }
  };

dom.closeBtn.onclick =
  closeModal;

dom.infoBtn.onclick =
  showInfo;

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