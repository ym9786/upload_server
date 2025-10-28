export async function deleteFile(filename) {
  const res = await fetch(`/delete_file?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (res.ok) {
    alert("删除成功！");
    import('./fileList.js').then(mod => mod.fetchFiles());
  } else {
    alert("删除失败！");
  }
}
