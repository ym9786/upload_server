// main.js
// --- 全局变量 ---
let currentPage = 1;
let totalFiles = 0;
let currentFileList = [];
let contextMenuEl = null;
let currentKeyword = "";
const perPage = 10;

// 导出获取和设置函数，而不是直接导出变量
export function getCurrentPage() { return currentPage; }
export function setCurrentPage(page) { currentPage = page; }
export function getTotalFiles() { return totalFiles; }
export function setTotalFiles(total) { totalFiles = total; }
export function getCurrentFileList() { return currentFileList; }
export function setCurrentFileList(files) { currentFileList = files; }
export function getCurrentKeyword() { return currentKeyword; }
export function setCurrentKeyword(keyword) { currentKeyword = keyword; }
export function getPerPage() { return perPage; }

// 初始化入口
import { fetchFiles } from './fileList.js';
import { setupUploadHandler } from './uploader.js';
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