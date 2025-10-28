function openImagePreview(filename) {
  const modal = document.getElementById('previewModal');
  const img = document.getElementById('previewImage');
  const downloadBtn = document.getElementById('downloadBtn');

  img.src = '/preview/' + encodeURIComponent(filename);
  downloadBtn.href = '/download/' + encodeURIComponent(filename);
  modal.style.display = 'block';
}

document.getElementById('closePreview').onclick = () => {
  document.getElementById('previewModal').style.display = 'none';
};

window.onclick = function(event) {
  const modal = document.getElementById('previewModal');
  if (event.target == modal) modal.style.display = "none";
};

// 右键菜单逻辑
const contextMenu = document.getElementById('contextMenu');
let currentFile = null;

function openContextMenu(event, filename) {
  event.preventDefault();
  currentFile = filename;
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  contextMenu.style.display = 'block';
}

window.addEventListener('click', () => contextMenu.style.display = 'none');

document.getElementById('openFile').onclick = () => {
  window.open('/preview/' + encodeURIComponent(currentFile));
};
document.getElementById('downloadFile').onclick = () => {
  window.location.href = '/download/' + encodeURIComponent(currentFile);
};
document.getElementById('detailFile').onclick = () => {
  alert(`文件名: ${currentFile}`);
};
