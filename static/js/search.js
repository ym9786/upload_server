// search.js
import { setCurrentKeyword } from './main.js';

export function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    const keyword = e.target.value.trim();
    // 更新关键词状态
    setCurrentKeyword(keyword);
    // 重置到第一页进行搜索
    import('./fileList.js').then(mod => mod.fetchFiles(1, keyword));
  });
}