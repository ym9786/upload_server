import { deleteFile } from './deleteFile.js';
import { openPreviewFromCard } from './preview.js';
import { notify, showConfirm } from './notification.js';

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

async function handleContextAction(e, file) {
  const action = e.target.dataset.action;
  contextMenuEl.style.display = "none";
  switch (action) {
    case "download": 
      window.open(file.url, "_blank"); 
      break;
    case "delete": 
      const confirmed = await showConfirm(`确定删除 ${file.name} 吗？`);
      if (confirmed) deleteFile(file.name); 
      break;
    case "info": 
      // 使用悬浮提示显示文件信息
      const fileInfo = `
        <div style="text-align: left;">
          <strong>文件名：</strong>${file.name}<br>
          <strong>大小：</strong>${(file.size/1024).toFixed(2)} KB<br>
          <strong>时间：</strong>${file.mtime}
        </div>
      `;
      notify.info(fileInfo, 5000);
      break;
  }
}
