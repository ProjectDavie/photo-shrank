const button = document.getElementById("open");
const folderPathSpan = document.getElementById("folder-path");
const gallery = document.getElementById("gallery");
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalVideo = document.getElementById("modal-video");
const closeBtn = modal.querySelector(".close");
const infoBtn = modal.querySelector(".info-btn");
const infoBox = document.getElementById("info-box");

let currentIndex = 0;
let files = [];
let thumbnails = {};
let fileInfos = {};

// Dummy JSON data generator
function getFileInfo(file) {
  if (fileInfos[file.path]) return fileInfos[file.path];

  const now = new Date();
  fileInfos[file.path] = {
    title: file.path.split(/[\\/]/).pop(),
    description: "",
    imageViews: Math.floor(Math.random() * 100).toString(),
    creationTime: { timestamp: Math.floor(now.getTime()/1000).toString(), formatted: now.toUTCString() },
    photoTakenTime: { timestamp: Math.floor(now.getTime()/1000).toString(), formatted: now.toUTCString() },
    geoData: { latitude:0, longitude:0, altitude:0, latitudeSpan:0, longitudeSpan:0 },
    url: "https://photos.google.com/photo/EXAMPLE",
    googlePhotosOrigin: { mobileUpload: { deviceFolder:{localFolderName:""}, deviceType:"ANDROID_PHONE" } },
    appSource: { androidPackageName: "com.transsion.camera" }
  };
  return fileInfos[file.path];
}

const getVal = (obj, path) => {
  try {
    return path.split(".").reduce((o,p)=>o[p], obj) || "";
  } catch(e) {
    return "";
  }
};

button.onclick = async () => {
  const folder = await window.api.openFolder();
  if (!folder) return;

  folderPathSpan.textContent = `Selected: ${folder}`;
  files = await window.api.scanFolder(folder);
  renderGallery(files);
};

async function generateThumbnail(file) {
  if (thumbnails[file.path]) return thumbnails[file.path];

  const ext = file.path.split(".").pop().toLowerCase();
  if (["mp4","mov","mkv"].includes(ext)) {
    thumbnails[file.path] = file.path;
  } else {
    const img = new Image();
    img.src = file.path;
    await img.decode();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxWidth = 200;
    const maxHeight = 150;
    let ratio = Math.min(maxWidth/img.width, maxHeight/img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    thumbnails[file.path] = canvas.toDataURL();
  }

  return thumbnails[file.path];
}

async function renderGallery(files) {
  gallery.innerHTML = "";
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const container = document.createElement("div");
    container.className = "photo-container";

    const ext = file.path.split(".").pop().toLowerCase();
    if (["mp4","mov","mkv"].includes(ext)) {
      const video = document.createElement("video");
      video.src = file.path;
      container.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = await generateThumbnail(file);
      container.appendChild(img);
    }

    container.onclick = () => openModal(i);
    gallery.appendChild(container);
  }
}

function openModal(index) {
  currentIndex = index;
  const file = files[index];
  const ext = file.path.split(".").pop().toLowerCase();

  if (["mp4","mov","mkv"].includes(ext)) {
    modalImg.style.display = "none";
    modalVideo.src = file.path;
    modalVideo.style.display = "block";
  } else {
    modalVideo.style.display = "none";
    modalImg.src = file.path;
    modalImg.style.display = "block";
  }

  infoBox.style.display = "none";
  modal.style.display = "flex";
}

closeBtn.onclick = () => {
  modal.style.display = "none";
  modalVideo.pause();
  infoBox.style.display = "none";
}

infoBtn.onclick = () => {
  const file = files[currentIndex];
  const info = getFileInfo(file);

  infoBox.innerHTML = `
    <strong>Title:</strong> ${getVal(info,"title")}<br>
    <strong>Description:</strong> ${getVal(info,"description")}<br>
    <strong>Image Views:</strong> ${getVal(info,"imageViews")}<br>
    <strong>Creation Time:</strong> ${getVal(info,"creationTime.formatted")}<br>
    <strong>Photo Taken Time:</strong> ${getVal(info,"photoTakenTime.formatted")}<br>
    <strong>Geo Data:</strong><br>
      &nbsp;&nbsp;Latitude: ${getVal(info,"geoData.latitude")}<br>
      &nbsp;&nbsp;Longitude: ${getVal(info,"geoData.longitude")}<br>
      &nbsp;&nbsp;Altitude: ${getVal(info,"geoData.altitude")}<br>
      &nbsp;&nbsp;Latitude Span: ${getVal(info,"geoData.latitudeSpan")}<br>
      &nbsp;&nbsp;Longitude Span: ${getVal(info,"geoData.longitudeSpan")}<br>
    <strong>URL:</strong> ${getVal(info,"url")}<br>
    <strong>Mobile Upload Device Type:</strong> ${getVal(info,"googlePhotosOrigin.mobileUpload.deviceType")}<br>
    <strong>Local Folder Name:</strong> ${getVal(info,"googlePhotosOrigin.mobileUpload.deviceFolder.localFolderName")}<br>
    <strong>App Source:</strong> ${getVal(info,"appSource.androidPackageName")}
  `;

  infoBox.style.display = infoBox.style.display === "block" ? "none" : "block";
}

document.addEventListener("keydown", (e) => {
  if(modal.style.display !== "flex") return;
  if(e.key === "ArrowRight") nextPhoto();
  if(e.key === "ArrowLeft") prevPhoto();
  if(e.key === "Escape") closeBtn.onclick();
});

function nextPhoto() { 
  currentIndex = (currentIndex + 1) % files.length; 
  openModal(currentIndex); 
}

function prevPhoto() { 
  currentIndex = (currentIndex - 1 + files.length) % files.length; 
  openModal(currentIndex); 
}
