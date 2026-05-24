import { state } from "../state/media.state.js";
import { openModal } from "./modal.js";

function nextPhoto() {

  state.currentIndex =
    (state.currentIndex + 1)
    % state.mediaFiles.length;

  openModal(state.currentIndex);
}

function prevPhoto() {

  state.currentIndex =
    (
      state.currentIndex - 1
      + state.mediaFiles.length
    ) % state.mediaFiles.length;

  openModal(state.currentIndex);
}

export { nextPhoto, prevPhoto };