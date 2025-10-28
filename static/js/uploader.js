// uploader.js
import { fetchFiles } from './fileList.js';

export function setupUploadHandler() {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const chooseBtn = document.getElementById("chooseBtn");

  if (!fileInput || !uploadBtn || !chooseBtn) return;

  // // 绑定选择文件按钮
  // chooseBtn.addEventListener("click", () => fileInput.click());

  // 监听文件选择
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      console.log(`已选择 ${fileInput.files.length} 个文件`);
    }
  });

  // 上传按钮
  uploadBtn.addEventListener("click", async () => {
    const files = fileInput.files;
    if (!files.length) {
      alert("请选择文件！");
      return;
    }

    // 显示上传进度
    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 10000;
      max-width: 300px;
    `;
    document.body.appendChild(progressContainer);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progressContainer.innerHTML = `正在上传 ${i + 1}/${files.length}: ${file.name}`;
        await uploadFileInChunks(file, progressContainer);
      }
      
      progressContainer.innerHTML = "上传完成！";
      setTimeout(() => {
        document.body.removeChild(progressContainer);
      }, 2000);
      
      fileInput.value = "";
      fetchFiles();
    } catch (err) {
      console.error(err);
      progressContainer.innerHTML = `上传失败：${err.message}`;
      progressContainer.style.background = "rgba(255,0,0,0.8)";
      setTimeout(() => {
        document.body.removeChild(progressContainer);
      }, 5000);
    }
  });
}

// 分片上传函数
async function uploadFileInChunks(file, progressContainer) {
  const chunkSize = 2 * 1024 * 1024; // 2MB
  const totalChunks = Math.ceil(file.size / chunkSize);

  console.log(`开始分片上传: ${file.name}, 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 总块数: ${totalChunks}`);

  // 先检查已上传的分片（断点续传）
  let uploadedChunks = [];
  try {
    const uploadedRes = await fetch(`/uploaded_chunks?filename=${encodeURIComponent(file.name)}`);
    if (uploadedRes.ok) {
      const uploadedData = await uploadedRes.json();
      uploadedChunks = uploadedData.chunks || [];
      console.log(`已上传分片: ${uploadedChunks.length}`);
    }
  } catch (e) {
    console.log("获取已上传分片失败，从头开始上传");
  }

  for (let i = 0; i < totalChunks; i++) {
    // 跳过已上传的分片
    if (uploadedChunks.includes(i)) {
      console.log(`跳过已上传的分片 ${i}`);
      continue;
    }

    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("filename", file.name); // 使用原始文件名，后端会安全处理
    formData.append("chunk", i.toString());
    formData.append("total_chunks", totalChunks.toString());

    // 更新进度显示
    const progress = Math.round(((i + 1) / totalChunks) * 100);
    if (progressContainer) {
      progressContainer.innerHTML = `上传 ${file.name}<br>进度: ${progress}% (${i + 1}/${totalChunks})`;
    }

    console.log(`上传分片 ${i}/${totalChunks-1}`);
    
    try {
      const res = await fetch("/upload_chunk", { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`分片 ${i} 上传失败:`, errorText);
        throw new Error(`上传分片失败: ${file.name}, 分片 ${i}, 错误: ${errorText}`);
      }
      console.log(`分片 ${i} 上传成功`);
    } catch (error) {
      // 如果是网络错误，等待后重试一次
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log(`网络错误，重试分片 ${i}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        const retryRes = await fetch("/upload_chunk", { 
          method: "POST", 
          body: formData 
        });
        if (!retryRes.ok) {
          const errorText = await retryRes.text();
          throw new Error(`上传分片失败（重试后）: ${file.name}, 分片 ${i}, 错误: ${errorText}`);
        }
        console.log(`分片 ${i} 重试成功`);
      } else {
        throw error;
      }
    }
  }

  console.log(`所有分片上传完成，开始合并: ${file.name}`);
  
  if (progressContainer) {
    progressContainer.innerHTML = `正在合并文件: ${file.name}`;
  }

  const mergeRes = await fetch("/merge_chunks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name })
  });

  if (!mergeRes.ok) {
    const errorText = await mergeRes.text();
    throw new Error(`合并分片失败: ${file.name}, 错误: ${errorText}`);
  }
  
  console.log(`文件合并成功: ${file.name}`);
  
  if (progressContainer) {
    progressContainer.innerHTML = `上传完成: ${file.name}`;
  }
}

// 备用：普通上传函数（保留但不使用）
async function uploadFilesSimple(files) {
  for (let file of files) {
    const formData = new FormData();
    formData.append("file", file);
    
    console.log(`开始普通上传: ${file.name}`);
    const res = await fetch("/upload_simple", {
      method: "POST",
      body: formData
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`上传失败: ${file.name}, 错误: ${errorText}`);
    }
    console.log(`普通上传成功: ${file.name}`);
  }
}