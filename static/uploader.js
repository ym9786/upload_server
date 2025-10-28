document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const progressBar = document.getElementById("progressBar");
  const uploadStatus = document.getElementById("uploadStatus");
  const fileGrid = document.getElementById("fileGrid");
  const searchInput = document.getElementById("searchInput");
  const pagination = document.getElementById("pagination");
  const previewModal = document.getElementById("previewModal");
  const previewContainer = document.getElementById("previewContainer");
  const fileDetails = document.getElementById("fileDetails");
  const closeModal = document.querySelector(".close");

  const perPage = 10;
  let currentPage = 1;
  let allFiles = [];

  uploadBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) return alert("请选择文件！");
    await uploadFile(fileInput.files[0]);
    await loadFiles();
  });

  async function uploadFile(file) {
    const chunkSize = 5*1024*1024;
    const totalChunks = Math.ceil(file.size/chunkSize);
    let uploaded=0;
    for(let i=0;i<totalChunks;i++){
      const blob=file.slice(i*chunkSize,(i+1)*chunkSize);
      const formData=new FormData();
      formData.append("file",blob);
      formData.append("filename",file.name);
      formData.append("chunk",i);
      formData.append("total_chunks",totalChunks);
      await fetch("/upload_chunk",{method:"POST",body:formData});
      uploaded += blob.size;
      progressBar.value = Math.round(uploaded/file.size*100);
      uploadStatus.textContent=`上传进度: ${progressBar.value}%`;
    }
    await fetch("/merge_chunks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:file.name})});
    uploadStatus.textContent="✅ 上传完成";
  }

  async function loadFiles(){
    const res = await fetch(`/files?page=${currentPage}&per_page=${perPage}`);
    const data = await res.json();
    allFiles = data.files;
    renderFiles();
    renderPagination(data.total);
  }

  function renderFiles() {
  fileGrid.innerHTML = "";
  allFiles.forEach(f => {
    if (!f.name.toLowerCase().includes(searchInput.value.toLowerCase())) return;

    const card = document.createElement("div");
    card.className = "file-card";
    card.dataset.fullname = f.name;

    // 懒加载图片，非图片直接显示图标
    if (f.is_image) {
      const img = document.createElement("img");
      img.dataset.src = `/uploads/${f.name}`;  // 懒加载 src
      img.alt = f.name;
      img.classList.add("lazy");
      card.appendChild(img);
    } else {
      const icon = document.createElement("div");
      icon.className = "file-icon";
      icon.textContent = "📄";
      card.appendChild(icon);
    }

    const nameDiv = document.createElement("div");
    nameDiv.className = "file-name";
    nameDiv.textContent = f.name;
    card.appendChild(nameDiv);

    card.addEventListener("click", () => previewFile(f));
    fileGrid.appendChild(card);
  });

  // 初始化懒加载
  const lazyImages = document.querySelectorAll("img.lazy");
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove("lazy");
        obs.unobserve(img);
      }
    });
  }, { rootMargin: "50px" });

  lazyImages.forEach(img => observer.observe(img));
}

  function renderPagination(total){
    pagination.innerHTML="";
    const pages=Math.ceil(total/perPage);
    for(let i=1;i<=pages;i++){
      const btn=document.createElement("button");
      btn.textContent=i;
      if(i===currentPage) btn.classList.add("active");
      btn.addEventListener("click",()=>{
        currentPage=i; loadFiles();
      });
      pagination.appendChild(btn);
    }
  }

  function previewFile(f){
    let content="";
    if(f.is_image) content=`<img src="/uploads/${f.name}">`;
    else content=`<div style="font-size:60px; text-align:center;">📄</div>`;
    previewContainer.innerHTML=content;
    fileDetails.innerHTML=`<strong>文件名:</strong> ${f.name}<br>
                           <strong>大小:</strong> ${(f.size/1024/1024).toFixed(2)} MB<br>
                           <strong>类型:</strong> ${f.ext}<br>
                           <strong>修改时间:</strong> ${f.mtime}`;
    previewModal.classList.add("show");
  }

  closeModal.addEventListener("click",()=> previewModal.classList.remove("show"));
  searchInput.addEventListener("input",()=> loadFiles());

  loadFiles();
});
