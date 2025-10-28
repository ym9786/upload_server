from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import time
import urllib.parse

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
CHUNK_FOLDER = "uploads/tmp"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CHUNK_FOLDER, exist_ok=True)

def safe_filename(filename):
    """完全保留原始文件名，只做基本的安全检查"""
    # 移除路径遍历攻击的风险字符
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # 如果文件名为空，使用默认名称
    if not filename:
        return "file"
    
    return filename

# 首页
@app.route("/")
def index():
    return render_template("index.html")

# 上传文件分片
@app.route("/upload_chunk", methods=["POST"])
def upload_chunk():
    file = request.files.get("file")
    filename = request.form.get("filename")
    chunk = int(request.form.get("chunk"))
    total_chunks = int(request.form.get("total_chunks"))

    if not file or not filename:
        return "Missing file", 400
    
    # 使用安全文件名函数
    safe_name = safe_filename(filename)

    temp_dir = os.path.join(CHUNK_FOLDER, safe_name)
    os.makedirs(temp_dir, exist_ok=True)
    chunk_path = os.path.join(temp_dir, f"{chunk}.part")
    file.save(chunk_path)
    return "OK", 200

# 合并文件块
@app.route("/merge_chunks", methods=["POST"])
def merge_chunks():
    data = request.get_json()
    filename = data.get("filename")
    
    # 使用安全文件名函数
    safe_name = safe_filename(filename)

    temp_dir = os.path.join(CHUNK_FOLDER, safe_name)
    output_path = os.path.join(UPLOAD_FOLDER, safe_name)

    if not os.path.exists(temp_dir):
        return "Chunks not found", 400

    with open(output_path, "wb") as outfile:
        chunks = sorted(os.listdir(temp_dir), key=lambda x: int(x.split(".")[0]))
        for chunk_file in chunks:
            with open(os.path.join(temp_dir, chunk_file), "rb") as infile:
                outfile.write(infile.read())

    # 删除临时块
    for f in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, f))
    os.rmdir(temp_dir)
    return jsonify({"status": "merged", "filename": safe_name})

# 获取文件列表（分页 + 搜索）
@app.route("/files", methods=["GET"])
def list_files():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    search = request.args.get("search", "").lower()

    files_info = []

    for f in os.listdir(UPLOAD_FOLDER):
        if search and search not in f.lower():
            continue
        path = os.path.join(UPLOAD_FOLDER, f)
        if os.path.isfile(path):
            ext = os.path.splitext(f)[1].lower()
            # 判断是否为图片类型，用于前端预览
            is_image = ext in ['.png','.jpg','.jpeg','.gif','.webp','.bmp','.tiff','.svg']
            files_info.append({
                "name": f,  # 使用实际存储的文件名
                "size": os.path.getsize(path),
                "is_image": is_image,
                "url": f"/uploads/{urllib.parse.quote(f)}",  # URL编码文件名
                "mtime": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(path))),
                "ext": ext
            })

    files_info.sort(key=lambda x: x["mtime"], reverse=True)
    total = len(files_info)
    start = (page-1)*per_page
    end = start + per_page
    return jsonify({
        "files": files_info[start:end],
        "total": total
    })

# 下载文件 - 修复中文文件名支持
@app.route("/uploads/<path:filename>")
def serve_file(filename):
    # 解码URL编码的文件名
    decoded_filename = urllib.parse.unquote(filename)
    return send_from_directory(UPLOAD_FOLDER, decoded_filename)

# 删除文件
@app.route("/delete_file", methods=["POST", "DELETE"])
def delete_file():
    filename = request.args.get("filename") or request.form.get("filename")
    # 解码URL编码的文件名
    decoded_filename = urllib.parse.unquote(filename)
    path = os.path.join(UPLOAD_FOLDER, decoded_filename)
    print(f"删除文件: {path}", flush=True)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"status": "deleted"})
    return jsonify({"error": "File not found"}), 404

# 获取已上传分片（断点续传支持）
@app.route("/uploaded_chunks", methods=["GET"])
def uploaded_chunks():
    filename = request.args.get("filename")
    safe_name = safe_filename(filename)
    temp_dir = os.path.join(CHUNK_FOLDER, safe_name)
    if not os.path.exists(temp_dir):
        return jsonify({"chunks": []})
    chunks = [int(f.split(".")[0]) for f in os.listdir(temp_dir)]
    return jsonify({"chunks": chunks})

# 简单上传接口（可选，用于小文件）
@app.route("/upload_simple", methods=["POST"])
def upload_simple():
    if 'file' not in request.files:
        return "没有文件", 400
    
    file = request.files['file']
    if file.filename == '':
        return "未选择文件", 400
    
    safe_name = safe_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, safe_name)
    
    try:
        file.save(file_path)
        return jsonify({"status": "uploaded", "filename": safe_name}), 200
    except Exception as e:
        return f"保存文件失败: {str(e)}", 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)