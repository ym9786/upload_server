// preview.js
import { notify } from './notification.js';

// 可预览的文件类型
const previewableTypes = {
  // 图片格式
  'png': true, 'jpg': true, 'jpeg': true, 'gif': true, 'webp': true, 'bmp': true, 'svg': true,
  
  // 文档格式
  'pdf': true, 'txt': true,
  
  // 其他可预览格式
  'html': true, 'css': true, 'js': true, 'json': true, 'xml': true, 'md': true
};

// 判断文件是否可预览
function isPreviewable(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return previewableTypes[ext] || false;
}

export function openPreviewFromCard(card) {
  const filename = card.dataset.filename;
  const url = card.dataset.fileurl;
  const isImage = card.dataset.isImage === "true" || card.dataset.isImage === "1";

  const previewContainer = document.getElementById("previewContainer");
  previewContainer.innerHTML = "";

  // 检查文件是否可预览
  if (!isPreviewable(filename) && !isImage) {
    notify.info(`"${filename}" 无法预览，请下载后查看`);
    return;
  }

  if (isImage) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = filename;
    img.style.maxWidth = "80vw";
    img.style.maxHeight = "70vh";
    img.style.objectFit = "contain";
    previewContainer.appendChild(img);
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.width = "80vw";
    iframe.style.height = "70vh";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    previewContainer.appendChild(iframe);
  }

  const fileDetails = document.getElementById("fileDetails");
  fileDetails.innerHTML = `
    <strong>文件名：</strong>${filename}<br>
    <strong>类型：</strong>${getFileTypeText(filename)}
  `;

  document.getElementById("previewModal").style.display = "flex";
}

// 获取文件类型文本描述（与fileList.js中的函数保持一致）
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

export function setupModalClose() {
  const modal = document.getElementById("previewModal");
  if (!modal) return;
  modal.querySelector(".close")?.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
}