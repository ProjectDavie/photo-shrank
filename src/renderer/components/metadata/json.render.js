function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderJsonValue(value) {

  if (value === null || value === undefined) {
    return `<span>null</span>`;
  }

  if (Array.isArray(value)) {

    return value
      .map(renderJsonValue)
      .join("");
  }

  if (typeof value === "object") {

    return Object.entries(value)
      .map(([k, v]) => `
        <div>
          <strong>${escapeHtml(k)}</strong>
          ${renderJsonValue(v)}
        </div>
      `)
      .join("");
  }

  return escapeHtml(value);
}

function renderDetails(obj) {

  return Object.entries(obj)
    .map(([key, value]) => `
      <div>
        <strong>${escapeHtml(key)}</strong>
        :
        ${renderJsonValue(value)}
      </div>
    `)
    .join("");
}

  export { renderDetails };