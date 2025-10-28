export function openPreviewFromCard(card) {
  const filename = card.dataset.filename;
  const url = card.dataset.fileurl;
  const isImage = card.dataset.isImage === "true" || card.dataset.isImage === "1";

  const previewContainer = document.getElementById("previewContainer");
  previewContainer.innerHTML = "";

  if (isImage) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = filename;
    img.style.maxWidth = "80vw";
    img.style.maxHeight = "70vh";
    previewContainer.appendChild(img);
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.width = "80vw";
    iframe.style.height = "70vh";
    previewContainer.appendChild(iframe);
  }

  const fileDetails = document.getElementById("fileDetails");
  fileDetails.innerHTML = `
    <strong>文件名：</strong>${filename}<br>
    <strong>类型：</strong>${isImage ? "图片" : "文件"}
  `;

  document.getElementById("previewModal").style.display = "flex";
}

export function setupModalClose() {
  const modal = document.getElementById("previewModal");
  if (!modal) return;
  modal.querySelector(".close")?.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
}
