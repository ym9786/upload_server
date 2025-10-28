// deleteFile.js
import { notify } from './notification.js';

export async function deleteFile(filename) {
  const res = await fetch(`/delete_file?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (res.ok) {
    notify.success("删除成功！");
    import('./fileList.js').then(mod => mod.fetchFiles());
  } else {
    notify.error("删除失败！");
  }
}