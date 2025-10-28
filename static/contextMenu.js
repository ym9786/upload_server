import { deleteFile } from './deleteFile.js';
import { openPreviewFromCard } from './preview.js';

export let contextMenuEl = null;

export function setupContextMenu() {
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

export function showContextMenu(file, x, y) {
  contextMenuEl.innerHTML = `
    <div class="ctx-item" data-action="download">⬇ 下载</div>
    <div class="ctx-item" data-action="delete">🗑 删除</div>
    <div class="ctx-item" data-action="info">ℹ 详情</div>
  `;
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
    case "download": window.open(file.url, "_blank"); break;
    case "delete": if (confirm(`确定删除 ${file.name} 吗？`)) deleteFile(file.name); break;
    case "info": alert(`文件名：${file.name}\n大小：${(file.size/1024).toFixed(2)} KB\n时间：${file.mtime}`); break;
  }
}
