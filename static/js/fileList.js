// fileList.js
import { 
  getCurrentPage, setCurrentPage, 
  getTotalFiles, setTotalFiles, 
  getCurrentFileList, setCurrentFileList,
  getCurrentKeyword, setCurrentKeyword,
  getPerPage
} from './main.js';
import { openPreviewFromCard } from './preview.js';
import { showContextMenu } from './contextMenu.js';

// 文件类型图标映射
const fileIcons = {
  // 图片文件
  'image': { icon: '🖼️', color: '#4CAF50' },
  
  // 文档文件
  'pdf': { icon: '📕', color: '#F44336' },
  'doc': { icon: '📘', color: '#2196F3' },
  'docx': { icon: '📘', color: '#2196F3' },
  'txt': { icon: '📄', color: '#757575' },
  'rtf': { icon: '📄', color: '#757575' },
  
  // 表格文件
  'xls': { icon: '📊', color: '#4CAF50' },
  'xlsx': { icon: '📊', color: '#4CAF50' },
  'csv': { icon: '📊', color: '#4CAF50' },
  
  // 演示文稿
  'ppt': { icon: '📽️', color: '#FF9800' },
  'pptx': { icon: '📽️', color: '#FF9800' },
  
  // 代码文件
  'js': { icon: '📜', color: '#FFD600' },
  'html': { icon: '🌐', color: '#E44D26' },
  'css': { icon: '🎨', color: '#1572B6' },
  'py': { icon: '🐍', color: '#3776AB' },
  'java': { icon: '☕', color: '#ED8B00' },
  'cpp': { icon: '⚙️', color: '#00599C' },
  'c': { icon: '⚙️', color: '#00599C' },
  'php': { icon: '🐘', color: '#777BB4' },
  'json': { icon: '🔧', color: '#757575' },
  'xml': { icon: '🔖', color: '#757575' },
  'md': { icon: '📝', color: '#000000' },
  
  // 压缩文件
  'zip': { icon: '📦', color: '#FF9800' },
  'rar': { icon: '📦', color: '#FF9800' },
  '7z': { icon: '📦', color: '#FF9800' },
  'tar': { icon: '📦', color: '#FF9800' },
  'gz': { icon: '📦', color: '#FF9800' },
  
  // 视频文件
  'mp4': { icon: '🎬', color: '#9C27B0' },
  'mkv': { icon: '🎬', color: '#9C27B0' },
  'avi': { icon: '🎬', color: '#9C27B0' },
  'mov': { icon: '🎬', color: '#9C27B0' },
  'wmv': { icon: '🎬', color: '#9C27B0' },
  'flv': { icon: '🎬', color: '#9C27B0' },
  'webm': { icon: '🎬', color: '#9C27B0' },
  
  // 音频文件
  'mp3': { icon: '🎵', color: '#673AB7' },
  'wav': { icon: '🎵', color: '#673AB7' },
  'ogg': { icon: '🎵', color: '#673AB7' },
  'flac': { icon: '🎵', color: '#673AB7' },
  'aac': { icon: '🎵', color: '#673AB7' },
  
  // 可执行文件
  'exe': { icon: '⚙️', color: '#795548' },
  'msi': { icon: '⚙️', color: '#795548' },
  'dmg': { icon: '⚙️', color: '#795548' },
  'app': { icon: '⚙️', color: '#795548' },
  'sh': { icon: '⚙️', color: '#795548' },
  'bat': { icon: '⚙️', color: '#795548' },
  
  // 其他文件
  'default': { icon: '📄', color: '#0b3d91' }
};

// 获取文件图标
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return fileIcons[ext] || fileIcons['default'];
}

export async function fetchFiles(page = 1, keyword = "") {
  const searchParam = keyword !== undefined ? keyword : getCurrentKeyword();
  const perPage = getPerPage();
  
  const res = await fetch(`/files?page=${page}&per_page=${perPage}&search=${encodeURIComponent(searchParam)}`);
  const data = await res.json();

  // 更新全局状态
  setCurrentPage(page);
  setTotalFiles(data.total);
  setCurrentKeyword(searchParam);
  
  let filteredFiles = data.files
    .map(f => ({ ...f, url: `/uploads/${encodeURIComponent(f.name)}` }))
    .filter(f => f.name.toLowerCase().includes(searchParam.toLowerCase()));
  
  setCurrentFileList(filteredFiles);

  renderFiles(filteredFiles);
  bindFileNameTooltip();
  renderPagination();
  
  // 更新页面信息
  updatePageInfo();
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

    // 创建图标容器
    const iconContainer = document.createElement("div");
    iconContainer.className = "file-icon-container";

    if (f.is_image) {
      // 图片文件显示缩略图
      const img = document.createElement("img");
      img.dataset.src = f.url;
      img.alt = f.name;
      img.className = "thumb";
      iconContainer.appendChild(img);
    } else {
      // 非图片文件显示对应图标
      const fileIcon = getFileIcon(f.name);
      const icon = document.createElement("div");
      icon.className = "file-icon";
      icon.innerHTML = fileIcon.icon;
      icon.style.color = fileIcon.color;
      iconContainer.appendChild(icon);
    }

    card.appendChild(iconContainer);

    // 文件名显示
    const nameDiv = document.createElement("div");
    nameDiv.className = "file-name";
    
    // 根据文件名长度决定是否使用单行显示
    if (f.name.length <= 20) {
      nameDiv.classList.add("single-line");
    }
    
    nameDiv.textContent = f.name;
    card.appendChild(nameDiv);

    // 添加文件类型标签
    const typeDiv = document.createElement("div");
    typeDiv.className = "file-type";
    typeDiv.textContent = getFileTypeText(f.name);
    card.appendChild(typeDiv);

    card.addEventListener("click", e => { e.stopPropagation(); openPreviewFromCard(card); });
    card.addEventListener("contextmenu", e => { e.preventDefault(); showContextMenu(f, e.pageX, e.pageY); });

    fileGrid.appendChild(card);
  });

  initLazyLoad();
}
// 获取文件类型文本描述
function getFileTypeText(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    // 图片
    'png': '图片', 'jpg': '图片', 'jpeg': '图片', 'gif': '图片', 'webp': '图片', 'bmp': '图片', 'svg': '图片',
    
    // 文档
    'pdf': 'PDF文档', 'doc': 'Word文档', 'docx': 'Word文档', 'txt': '文本文件', 'rtf': '富文本',
    
    // 表格
    'xls': 'Excel表格', 'xlsx': 'Excel表格', 'csv': 'CSV表格',
    
    // 演示文稿
    'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
    
    // 代码
    'js': 'JavaScript', 'html': 'HTML文档', 'css': '样式表', 'py': 'Python脚本', 'java': 'Java代码',
    'cpp': 'C++代码', 'c': 'C代码', 'php': 'PHP脚本', 'json': 'JSON数据', 'xml': 'XML文档', 'md': 'Markdown',
    
    // 压缩文件
    'zip': '压缩文件', 'rar': '压缩文件', '7z': '压缩文件', 'tar': '压缩文件', 'gz': '压缩文件',
    
    // 视频
    'mp4': '视频文件', 'mkv': '视频文件', 'avi': '视频文件', 'mov': '视频文件', 'wmv': '视频文件',
    'flv': '视频文件', 'webm': '视频文件',
    
    // 音频
    'mp3': '音频文件', 'wav': '音频文件', 'ogg': '音频文件', 'flac': '音频文件', 'aac': '音频文件',
    
    // 可执行文件
    'exe': '应用程序', 'msi': '安装程序', 'dmg': '磁盘映像', 'app': '应用程序', 'sh': 'Shell脚本', 'bat': '批处理文件'
  };
  
  return typeMap[ext] || '文件';
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

// 优化工具提示显示
function bindFileNameTooltip() {
  document.querySelectorAll('.file-name').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      // 只有当文本被截断时才显示工具提示
      if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
        const tooltip = document.createElement('div');
        tooltip.className = 'file-tooltip';
        tooltip.textContent = el.textContent;
        document.body.appendChild(tooltip);
        
        const rect = el.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // 计算工具提示位置
        let left = rect.left + (rect.width - tooltipRect.width) / 2;
        let top = rect.top - tooltipRect.height - 5;
        
        // 确保工具提示不会超出屏幕
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
          left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
          top = rect.bottom + 5;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
      }
    });
    
    el.addEventListener('mouseleave', () => {
      document.querySelectorAll('.file-tooltip').forEach(t => t.remove());
    });
  });
}

function renderPagination() {
  const currentPage = getCurrentPage();
  const totalFiles = getTotalFiles();
  const currentKeyword = getCurrentKeyword();
  const perPage = getPerPage();
  
  const totalPages = Math.ceil(totalFiles / perPage);
  const pagination = document.getElementById("pagination");
  if (!pagination) return;
  
  pagination.innerHTML = "";
  
  // 添加上一页按钮
  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "上一页";
    prevBtn.addEventListener("click", () => fetchFiles(currentPage - 1, currentKeyword));
    pagination.appendChild(prevBtn);
  }
  
  // 添加页码按钮
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.addEventListener("click", () => fetchFiles(i, currentKeyword));
    pagination.appendChild(btn);
  }
  
  // 添加下一页按钮
  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "下一页";
    nextBtn.addEventListener("click", () => fetchFiles(currentPage + 1, currentKeyword));
    pagination.appendChild(nextBtn);
  }
}

function updatePageInfo() {
  const currentPage = getCurrentPage();
  const totalFiles = getTotalFiles();
  const perPage = getPerPage();
  
  const pageInfo = document.getElementById("pageInfo");
  if (pageInfo) {
    const totalPages = Math.ceil(totalFiles / perPage);
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页 (${totalFiles} 个文件)`;
  }
}