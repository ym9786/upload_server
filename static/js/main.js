// --- 全局变量 ---
export let currentPage = 1;
export const perPage = 10;
export let totalFiles = 0;
export let currentFileList = [];
export let contextMenuEl = null;

// 初始化入口
import { fetchFiles } from './fileList.js';
import { setupUploadHandler } from '../uploader.js';
import { setupModalClose } from './preview.js';
import { setupContextMenu } from './contextMenu.js';
import { setupSearch } from './search.js';

document.addEventListener("DOMContentLoaded", () => {
  fetchFiles();
  setupUploadHandler();
  setupModalClose();
  setupContextMenu();
  setupSearch();
});

document.getElementById("chooseBtn")?.addEventListener("click", () => {
  document.getElementById("fileInput").click();
});
