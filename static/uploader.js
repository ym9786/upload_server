// --- 全局变量 ---
let currentPage = 1;
const perPage = 10;
let totalFiles = 0;
let currentFileList = [];
let contextMenuEl = null;

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  fetchFiles();
  setupUploadHandler();
  setupModalClose();
  setupContextMenu();
  setupSearch();
});
document.getElementById("chooseBtn").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});
// ===================== 上传文件 =====================
function setupUploadHandler() {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const chooseBtn = document.getElementById("chooseBtn");

  if (!fileInput || !uploadBtn) return;

  chooseBtn?.addEventListener("click", () => fileInput.click());

  uploadBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
      alert("请选择文件！");
      return;
    }

    for (let file of files) {
      await uploadFileInChunks(file);
    }

    alert("上传完成！");
    fileInput.value = "";
    fetchFiles();
  });
}

async function uploadFileInChunks(file) {
  const chunkSize = 2 * 1024 * 1024; // 2MB
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

// ===================== 文件列表 =====================
async function fetchFiles(page = 1, keyword = "") {
  const res = await fetch(`/files?page=${page}&per_page=${perPage}`);
  const data = await res.json();
  totalFiles = data.total;
  currentPage = page;
  currentFileList = data.files
    .map(f => ({
      ...f,
      url: `/uploads/${encodeURIComponent(f.name)}`
    }))
    .filter(f => f.name.toLowerCase().includes(keyword.toLowerCase()));

  renderFiles(currentFileList);
  bindFileNameTooltip();
  renderPagination();
}

function renderFiles(filesList) {
  const fileGrid = document.getElementById("fileGrid");
  fileGrid.innerHTML = "";

  filesList.forEach(f => {
    const card = document.createElement("div");
    card.className = "file-card";
    card.dataset.filename = f.name;
    card.dataset.fileurl = f.url;
    card.dataset.isImage = f.is_image;
    card.setAttribute("title", f.name);

    // 缩略图或图标
    if (f.is_image) {
      const img = document.createElement("img");
      img.dataset.src = f.url;
      img.alt = f.name;
      img.className = "thumb";
      card.appendChild(img);
    } else {
      const icon = document.createElement("div");
      icon.className = "file-icon";
      icon.textContent = "📄";
      card.appendChild(icon);
    }

    // 文件名（深蓝色）
    const nameDiv = document.createElement("div");
    nameDiv.className = "file-name";
    nameDiv.textContent = f.name;
    // nameDiv.setAttribute("data-fullname", f.name); // ← 关键！
    nameDiv.style.color = "#0b3d91";
    card.appendChild(nameDiv);

    // 点击预览
    card.addEventListener("click", e => {
      e.stopPropagation();
      openPreviewFromCard(card);
    });

    // 右键菜单
    card.addEventListener("contextmenu", e => {
      e.preventDefault();
      showContextMenu(f, e.pageX, e.pageY);
    });

    fileGrid.appendChild(card);
  });

  initLazyLoad();
  // 动态 tooltip 显示完整文件名


}
  function bindFileNameTooltip() {
    // 动态 tooltip 显示完整文件名
    document.querySelectorAll('.file-name').forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'file-tooltip';
        tooltip.textContent = el.dataset.fullname || el.textContent;
        document.body.appendChild(tooltip);

        const rect = el.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = rect.top - rect.height - 8 + 'px';
      });

      el.addEventListener('mouseleave', () => {
        document.querySelectorAll('.file-tooltip').forEach(t => t.remove());
      });
    });
  }

// ===================== 搜索 =====================
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    const keyword = e.target.value.trim();
    fetchFiles(1, keyword);
  });
}

// ===================== 分页 =====================
function renderPagination() {
  const totalPages = Math.ceil(totalFiles / perPage);
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.addEventListener("click", () => fetchFiles(i));
    pagination.appendChild(btn);
  }
}

// ===================== 懒加载 =====================
function initLazyLoad() {
  const lazyImages = document.querySelectorAll("img.thumb[data-src]");
  if (!("IntersectionObserver" in window)) {
    lazyImages.forEach(img => (img.src = img.dataset.src));
    return;
  }
  const obs = new IntersectionObserver((entries, ob) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        ob.unobserve(img);
      }
    });
  }, { rootMargin: "100px" });
  lazyImages.forEach(img => obs.observe(img));
}

// ===================== 文件预览 =====================
function openPreviewFromCard(card) {
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

  const modal = document.getElementById("previewModal");
  modal.style.display = "flex";
}

// ===================== 关闭预览 =====================
function setupModalClose() {
  const modal = document.getElementById("previewModal");
  if (!modal) return;
  modal.querySelector(".close")?.addEventListener("click", () => (modal.style.display = "none"));
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// ===================== 右键菜单 =====================
function setupContextMenu() {
  contextMenuEl = document.createElement("div");
  contextMenuEl.id = "contextMenu";
  contextMenuEl.style.position = "absolute";
  contextMenuEl.style.display = "none";
  contextMenuEl.style.background = "#e9f6fcff";
  contextMenuEl.style.border = "1px solid #0ff";
  contextMenuEl.style.padding = "6px 0";
  contextMenuEl.style.borderRadius = "6px";
  contextMenuEl.style.zIndex = 9999;
  contextMenuEl.style.minWidth = "120px";
  document.body.appendChild(contextMenuEl);

  document.addEventListener("click", () => (contextMenuEl.style.display = "none"));
}

function showContextMenu(file, x, y) {
  contextMenuEl.innerHTML = `
    <div class="ctx-item" data-action="download">⬇ 下载</div>
    <div class="ctx-item" data-action="delete">🗑 删除</div>
    <div class="ctx-item" data-action="info">ℹ 详情</div>
  `;
  // 右键字体颜色
  contextMenuEl.querySelectorAll(".ctx-item").forEach(item => {
    item.style.padding = "8px 12px";
    item.style.cursor = "pointer";
    item.style.color = "#004aad";
    item.addEventListener("mouseenter", () => (item.style.background = "#112"));
    item.addEventListener("mouseleave", () => (item.style.background = "none"));
    item.addEventListener("click", e => handleContextAction(e, file));
  });

  contextMenuEl.style.left = x + "px";
  contextMenuEl.style.top = y + "px";
  contextMenuEl.style.display = "block";
}

function handleContextAction(e, file) {
  const action = e.target.dataset.action;
  contextMenuEl.style.display = "none";

  switch (action) {
    case "download":
      window.open(file.url, "_blank");
      break;
    case "delete":
      if (confirm(`确定要删除 ${file.name} 吗？`)) deleteFile(file.name);
      break;
    case "info":
      alert(`文件名：${file.name}\n大小：${(file.size / 1024).toFixed(2)} KB\n时间：${file.mtime}`);
      break;
  }
}

async function deleteFile(filename) {
  const res = await fetch(`/delete_file?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (res.ok) {
    alert("删除成功！");
    fetchFiles(currentPage);
  } else {
    alert("删除失败！");
  }
}
