import { currentPage, perPage, totalFiles, currentFileList } from './main.js';
import { openPreviewFromCard } from './preview.js';
import { showContextMenu } from './contextMenu.js';

export async function fetchFiles(page = 1, keyword = "") {
    const res = await fetch(`/files?page=${page}&per_page=${perPage}`);
    const data = await res.json();

    let totalFiles = data.total;
    let currentPage = page;
    let currentFileList = data.files
    .map(f => ({ ...f, url: `/uploads/${encodeURIComponent(f.name)}` }))
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
    card.dataset.filename = f.name;  // 使用后端返回的实际文件名
    card.dataset.fileurl = f.url;    // 使用后端返回的URL（已编码）
    card.dataset.isImage = f.is_image;
    card.setAttribute("title", f.name);  // 显示完整文件名

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

    const nameDiv = document.createElement("div");
    nameDiv.className = "file-name";
    nameDiv.textContent = f.name;
    nameDiv.style.color = "#0b3d91";
    card.appendChild(nameDiv);

    card.addEventListener("click", e => { e.stopPropagation(); openPreviewFromCard(card); });
    card.addEventListener("contextmenu", e => { e.preventDefault(); showContextMenu(f, e.pageX, e.pageY); });

    fileGrid.appendChild(card);
  });

  initLazyLoad();
}

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

function bindFileNameTooltip() {
  document.querySelectorAll('.file-name').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'file-tooltip';
      tooltip.textContent = el.textContent;
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
