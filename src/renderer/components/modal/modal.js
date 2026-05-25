import { dom }
from "../../utils/dom.js";

import { state }
from "../../state/media.state.js";

import { VIDEO_EXTENSIONS }
from "../../constants/media.constants.js";

function openModal(index) {

  state.currentIndex =
    index;

  const file =
    state.mediaFiles[index];

  const ext =
    file.path
      .split(".")
      .pop()
      .toLowerCase();

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

    dom.modalVideo.style.display =
      "none";

    dom.modalImg.src =
      `file://${file.path}`;

    dom.modalImg.style.display =
      "block";
  }

  dom.modal.style.display =
    "flex";
}

function closeModal() {

  dom.modal.style.display =
    "none";

  dom.modalVideo.pause();

  dom.infoBox.style.display =
    "none";
}

export {
  openModal,
  closeModal
};