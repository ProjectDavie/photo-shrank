import { dom } from "../../utils/dom.js";
import { state, getCurrentFolder, getCurrentMediaFiles } from "../../state/media.state.js";
import { VIDEO_EXTENSIONS } from "../../constants/media.constants.js";
import { renderDetails } from "../metadata/json.render.js";

function findPairedJson(mediaPath) {
  const folder = getCurrentFolder();
  if (!folder) return null;

  const index = folder.allFiles.findIndex(
    file => file.path === mediaPath
  );

  if (index === -1) return null;

  const next = folder.allFiles[index + 1];

  if (!next?.path.endsWith(".json")) {
    return null;
  }

  return next;
}

async function renderModalContent() {
  const mediaFiles = getCurrentMediaFiles();
  const file = mediaFiles[state.currentIndex];

  if (!file) return;

  const ext =
    file.path
      .split(".")
      .pop()
      .toLowerCase();

  // Media
  if (
    VIDEO_EXTENSIONS.includes(ext)
  ) {
    dom.modalImg.style.display =
      "none";

    dom.modalVideo.src =
      `file://${file.path}`;

    dom.modalVideo.style.display =
      "block";
  } else {
    dom.modalVideo.pause();

    dom.modalVideo.style.display =
      "none";

    dom.modalImg.src =
      `file://${file.path}`;

    dom.modalImg.style.display =
      "block";
  }

  // Metadata
  const paired =
    findPairedJson(file.path);

  if (!paired) {
    dom.infoBox.innerHTML =
      "No metadata available";
  } else {
    try {
      const json =
        await window.api.metadata.read(
          paired.path
        );

      dom.infoBox.innerHTML =
        renderDetails(json);
    } catch (err) {
      dom.infoBox.innerHTML =
        "Failed to load metadata";

      console.error(err);
    }
  }

  dom.infoBox.style.display =
    "block";
}

async function openModal(index) {
  state.currentIndex = index;

  await renderModalContent();

  dom.modal.style.display =
    "flex";
}

function closeModal() {
  dom.modal.style.display =
    "none";

  dom.modalVideo.pause();
}

async function nextMedia() {
  const mediaFiles = getCurrentMediaFiles();
  if (
    state.currentIndex < mediaFiles.length - 1
  ) {
    state.currentIndex++;

    await renderModalContent();
  }
}

async function previousMedia() {
  if (
    state.currentIndex > 0
  ) {
    state.currentIndex--;

    await renderModalContent();
  }
}

export {
  openModal,
  closeModal,
  nextMedia,
  previousMedia,
  renderModalContent,
};