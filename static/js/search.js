// search.js
export function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    const keyword = e.target.value.trim();
    // 调用 fileList.js 中的 fetchFiles 并传入关键字
    import('./fileList.js').then(mod => mod.fetchFiles(1, keyword));
  });
}
