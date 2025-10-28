// uploader.js
import { fetchFiles } from './fileList.js';
import { notify } from './notification.js';

// 存储已选择文件列表
let selectedFiles = [];
// 存储上传状态
let uploadStatus = {};

export function setupUploadHandler() {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const chooseBtn = document.getElementById("chooseBtn");

  if (!fileInput || !uploadBtn || !chooseBtn) return;

  // 监听文件选择
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      // 将新选择的文件添加到列表
      Array.from(fileInput.files).forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          selectedFiles.push(file);
        }
      });
      
      // 更新文件列表显示
      updateSelectedFilesList();
      console.log(`已选择 ${fileInput.files.length} 个文件，总计 ${selectedFiles.length} 个文件`);
    }
  });

  // 上传按钮
  uploadBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
      notify.warning("请选择文件！");
      return;
    }

    try {
      // 显示上传进度容器
      showUploadProgressContainer();
      
      // 依次上传所有文件
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await uploadFileInChunks(file, i);
      }
      
      // 上传完成后清空文件列表
      selectedFiles = [];
      updateSelectedFilesList();
      
      // 隐藏上传进度容器
      hideUploadProgressContainer();
      
      // 显示成功提示
      notify.success("上传完成！");
      
      // 刷新文件列表
      fetchFiles();
    } catch (err) {
      console.error(err);
      notify.error(`上传失败：${err.message}`);
      hideUploadProgressContainer();
    }
  });
}

// 更新已选择文件列表显示
function updateSelectedFilesList() {
  const fileListContainer = document.getElementById("selectedFilesList");
  if (!fileListContainer) return;
  
  fileListContainer.innerHTML = "";
  
  if (selectedFiles.length === 0) {
    fileListContainer.innerHTML = '<div class="no-files">暂无选择文件</div>';
    return;
  }
  
  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement("div");
    fileItem.className = "selected-file-item";
    fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${formatFileSize(file.size)}</div>
      </div>
      <button class="remove-file-btn" data-index="${index}">×</button>
    `;
    fileListContainer.appendChild(fileItem);
  });
  
  // 添加删除文件事件
  document.querySelectorAll('.remove-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      selectedFiles.splice(index, 1);
      updateSelectedFilesList();
    });
  });
}

// 显示上传进度容器
function showUploadProgressContainer() {
  let progressContainer = document.getElementById("uploadProgressContainer");
  
  if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.id = "uploadProgressContainer";
    progressContainer.innerHTML = `
      <div class="upload-progress-header">
        <h3>📤 上传进度</h3>
        <button id="closeProgressBtn">×</button>
      </div>
      <div id="uploadProgressList" class="upload-progress-list"></div>
    `;
    document.body.appendChild(progressContainer);
    
    // 关闭按钮事件
    document.getElementById("closeProgressBtn").addEventListener("click", hideUploadProgressContainer);
  }
  
  progressContainer.style.display = "block";
}

// 隐藏上传进度容器
function hideUploadProgressContainer() {
  const progressContainer = document.getElementById("uploadProgressContainer");
  if (progressContainer) {
    progressContainer.style.display = "none";
  }
}

// 更新文件上传进度
function updateFileProgress(fileIndex, fileName, chunkIndex, totalChunks, loaded, total, speed) {
  const progressList = document.getElementById("uploadProgressList");
  if (!progressList) return;
  
  let progressItem = document.getElementById(`progress-${fileIndex}`);
  
  if (!progressItem) {
    progressItem = document.createElement("div");
    progressItem.id = `progress-${fileIndex}`;
    progressItem.className = "upload-progress-item";
    progressList.appendChild(progressItem);
  }
  
  const progressPercent = Math.round((loaded / total) * 100);
  const speedText = speed > 1024 * 1024 ? 
    `${(speed / (1024 * 1024)).toFixed(2)} MB/s` : 
    `${(speed / 1024).toFixed(2)} KB/s`;
  
  progressItem.innerHTML = `
    <div class="progress-file-info">
      <div class="progress-file-name">${fileName}</div>
      <div class="progress-file-stats">${speedText} • ${progressPercent}%</div>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" style="width: ${progressPercent}%"></div>
    </div>
    <div class="progress-details">
      分片 ${chunkIndex + 1}/${totalChunks} • ${formatFileSize(loaded)}/${formatFileSize(total)}
    </div>
  `;
}

// 分片上传函数（增强版，包含进度跟踪）
async function uploadFileInChunks(file, fileIndex) {
  const chunkSize = 2 * 1024 * 1024; // 2MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  // 初始化上传状态
  uploadStatus[file.name] = {
    loaded: 0,
    total: file.size,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    lastLoaded: 0
  };

  console.log(`开始分片上传: ${file.name}, 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 总块数: ${totalChunks}`);

  // 先检查已上传的分片（断点续传）
  let uploadedChunks = [];
  try {
    const uploadedRes = await fetch(`/uploaded_chunks?filename=${encodeURIComponent(file.name)}`);
    if (uploadedRes.ok) {
      const uploadedData = await uploadedRes.json();
      uploadedChunks = uploadedData.chunks || [];
      console.log(`已上传分片: ${uploadedChunks.length}`);
      
      // 更新已加载的字节数
      if (uploadedChunks.length > 0) {
        const loadedChunksSize = uploadedChunks.length * chunkSize;
        uploadStatus[file.name].loaded = Math.min(loadedChunksSize, file.size);
      }
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
    formData.append("filename", file.name);
    formData.append("chunk", i.toString());
    formData.append("total_chunks", totalChunks.toString());

    // 更新进度显示
    uploadStatus[file.name].loaded += chunk.size;
    const now = Date.now();
    const timeDiff = (now - uploadStatus[file.name].lastUpdate) / 1000; // 秒
    const loadedDiff = uploadStatus[file.name].loaded - uploadStatus[file.name].lastLoaded;
    const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
    
    uploadStatus[file.name].lastUpdate = now;
    uploadStatus[file.name].lastLoaded = uploadStatus[file.name].loaded;
    
    updateFileProgress(
      fileIndex, 
      file.name, 
      i, 
      totalChunks, 
      uploadStatus[file.name].loaded, 
      file.size, 
      speed
    );

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
  
  // 更新进度为合并中
  updateFileProgress(
    fileIndex, 
    file.name, 
    totalChunks, 
    totalChunks, 
    file.size, 
    file.size, 
    0
  );
  
  const progressItem = document.getElementById(`progress-${fileIndex}`);
  if (progressItem) {
    const statsElement = progressItem.querySelector('.progress-file-stats');
    if (statsElement) {
      statsElement.textContent = '合并中...';
    }
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
  
  // 更新进度为完成
  if (progressItem) {
    progressItem.classList.add('completed');
    const statsElement = progressItem.querySelector('.progress-file-stats');
    if (statsElement) {
      statsElement.textContent = '上传完成';
    }
  }
  
  // 清理上传状态
  delete uploadStatus[file.name];
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}