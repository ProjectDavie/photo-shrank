import { dom } from "../../utils/dom.js";
import { state } from "../../state/media.state.js";
import { renderDetails } from "../metadata/json.render.js";

function findPairedJson(mediaPath) {

  const index =
    state.allFiles.findIndex(
      file => file.path === mediaPath
    );

  if (index === -1) return null;

  const next =
    state.allFiles[index + 1];

  if (!next?.path.endsWith(".json")) {
    return null;
  }

  return next;
}

async function showInfo() {

  const media =
    state.mediaFiles[state.currentIndex];

  const paired =
    findPairedJson(media.path);

  if (!paired) {

    dom.infoBox.innerHTML =
      "No paired JSON";

    dom.infoBox.style.display =
      "block";

    return;
  }

  const json =
    await window.api.metadata.read(
      paired.path
    );

  dom.infoBox.innerHTML =
    renderDetails(json);

  dom.infoBox.style.display =
    "block";
}

export { showInfo };