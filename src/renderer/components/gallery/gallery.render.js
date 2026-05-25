import { dom } from "../../js/utils/dom.js";
import { state } from "../../state/media.state.js";
import { VIDEO_EXTENSIONS } from "../../constants/media.constants.js";
import { generateThumbnail } from "./thumbnails.js";
import { openModal } from "../../js/modal/modal.js";

async function renderGallery(files) {

  dom.gallery.innerHTML = "";

  for (let i = 0; i < files.length; i++) {

    const file = files[i];

    const container =
      document.createElement("div");

    container.className =
      "photo-container";

    const ext =
      file.path.split(".").pop().toLowerCase();

    if (VIDEO_EXTENSIONS.includes(ext)) {

      const video =
        document.createElement("video");

      video.src = file.path;

      container.appendChild(video);

    } else {

      const img =
        document.createElement("img");

      img.src =
        await generateThumbnail(file);

      container.appendChild(img);
    }

    container.onclick = () =>
      openModal(i);

    dom.gallery.appendChild(container);
  }
}

export { renderGallery };