import { state }
from "../../state/media.state.js";

import { VIDEO_EXTENSIONS }
from "../../constants/media.constants.js";

async function generateThumbnail(
  file
) {

  if (
    state.thumbnails[file.path]
  ) {
    return state.thumbnails[
      file.path
    ];
  }

  const ext =
    file.path
      .split(".")
      .pop()
      .toLowerCase();

  if (
    VIDEO_EXTENSIONS.includes(ext)
  ) {

    state.thumbnails[
      file.path
    ] =
      `file://${file.path}`;

    return state.thumbnails[
      file.path
    ];
  }

  const img = new Image();

  img.src =
    `file://${file.path}`;

  await img.decode();

  const canvas =
    document.createElement(
      "canvas"
    );

  const ctx =
    canvas.getContext("2d");

  const ratio = Math.min(
    200 / img.width,
    150 / img.height
  );

  canvas.width =
    img.width * ratio;

  canvas.height =
    img.height * ratio;

  ctx.drawImage(
    img,
    0,
    0,
    canvas.width,
    canvas.height
  );

  state.thumbnails[
    file.path
  ] =
    canvas.toDataURL();

  return state.thumbnails[
    file.path
  ];
}

export { generateThumbnail };