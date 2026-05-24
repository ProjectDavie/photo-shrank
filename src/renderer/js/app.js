import { dom } from "./utils/dom.js";
import { state } from "./state/media.state.js";
import { renderGallery } from "./gallery/gallery.render.js";
import { closeModal } from "./modal/modal.js";
import { nextPhoto, prevPhoto } from "./modal/modal.navigation.js";
import { showInfo } from "./modal/modal.info.js";

dom.button.onclick = async () => {

  const folder =
    await window.api.folder.open();

  if (!folder) return;

  dom.folderPathSpan.textContent =
    `Selected: ${folder}`;

  state.allFiles =
    await window.api.folder.scan(folder);

  state.mediaFiles =
    state.allFiles.filter(
      f => !f.path.endsWith(".json")
    );

  renderGallery(state.mediaFiles);
};

dom.closeBtn.onclick = closeModal;

dom.infoBtn.onclick = showInfo;

document.addEventListener(
  "keydown",
  (e) => {

    if (
      dom.modal.style.display !== "flex"
    ) return;

    if (e.key === "ArrowRight") {
      nextPhoto();
    }

    if (e.key === "ArrowLeft") {
      prevPhoto();
    }

    if (e.key === "Escape") {
      closeModal();
    }
  }
);