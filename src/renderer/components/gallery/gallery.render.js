import { dom } from "../../utils/dom.js";

import { VIDEO_EXTENSIONS }
from "../../constants/media.constants.js";

import { generateThumbnail }
from "./thumbnails.js";

import { openModal }
from "../modal/modal.js";

async function renderGallery(files, fileMetadataStatus = null) {

  dom.gallery.innerHTML = "";

  for (
    let i = 0;
    i < files.length;
    i++
  ) {

    const file = files[i];

    const container =
      document.createElement("div");

    container.className =
      "photo-container";

    const ext =
      file.path
        .split(".")
        .pop()
        .toLowerCase();

    if (
      VIDEO_EXTENSIONS.includes(ext)
    ) {

      const video =
        document.createElement(
          "video"
        );

      video.src =
        `file://${file.path}`;

      video.muted = true;

      container.appendChild(
        video
      );

    } else {

      const img =
        document.createElement(
          "img"
        );

      img.src =
        await generateThumbnail(file);

      container.appendChild(
        img
      );
    }

    const hasMetadata =
      fileMetadataStatus?.[file.path];

    if (
      fileMetadataStatus &&
      !hasMetadata
    ) {
      const badge =
        document.createElement("div");

      badge.className =
        "metadata-badge missing";

      badge.textContent = "✕";

      badge.title =
        "Missing JSON metadata";

      container.appendChild(
        badge
      );
    }

    container.onclick = () =>
      openModal(i);

    dom.gallery.appendChild(
      container
    );
  }
}

export { renderGallery };