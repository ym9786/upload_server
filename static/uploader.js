export function setupUploadHandler() {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const chooseBtn = document.getElementById("chooseBtn");

  if (!fileInput || !uploadBtn) return;

  chooseBtn?.addEventListener("click", () => fileInput.click());

  uploadBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) return alert("请选择文件！");
    for (let file of files) await uploadFileInChunks(file);
    alert("上传完成！");
    fileInput.value = "";
    import('./fileList.js').then(mod => mod.fetchFiles());
  });
}

async function uploadFileInChunks(file) {
  const chunkSize = 2 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("filename", file.name);
    formData.append("chunk", i);
    formData.append("total_chunks", totalChunks);

    await fetch("/upload_chunk", { method: "POST", body: formData });
  }

  await fetch("/merge_chunks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name })
  });
}
