async function startUpload() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) {
    alert("请选择文件");
    return;
  }

  const chunkSize = 10 * 1024 * 1024; // 每片 10MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  const filename = file.name;
  const progressBar = document.getElementById('progress');
  const statusText = document.getElementById('status');

  // 获取已上传分片列表（断点续传检测）
  const uploaded = await fetch(`/uploaded_chunks?filename=${encodeURIComponent(filename)}`).then(r => r.json());
  const uploadedSet = new Set(uploaded);
  let uploadedBytes = uploadedSet.size * chunkSize;

  statusText.innerText = `检测到已上传 ${uploadedSet.size}/${totalChunks} 分片，准备续传...`;

  let lastTime = Date.now();
  let lastUploaded = uploadedBytes;

  for (let i = 0; i < totalChunks; i++) {
    if (uploadedSet.has(i)) continue; // 跳过已上传分片

    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const blob = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("filename", filename);
    formData.append("chunkIndex", i);

    const t0 = performance.now();
    await fetch("/upload_chunk", { method: "POST", body: formData });
    const t1 = performance.now();

    uploadedBytes += blob.size;
    const percent = (uploadedBytes / file.size) * 100;
    progressBar.style.width = percent.toFixed(2) + "%";

    // 计算上传速度
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    const deltaBytes = uploadedBytes - lastUploaded;
    const speed = (deltaBytes / 1024 / 1024 / deltaTime).toFixed(2);
    lastTime = now;
    lastUploaded = uploadedBytes;

    statusText.innerText = `上传中：${percent.toFixed(2)}% （${speed} MB/s）`;
  }

  // 上传完成 -> 合并
  await fetch("/merge_chunks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, totalChunks })
  });

  progressBar.style.width = "100%";
  statusText.innerText = "✅ 上传完成（文件已合并）";
}
