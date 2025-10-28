from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
CHUNK_FOLDER = "uploads/tmp"
ALLOWED_EXTENSIONS = {'png','jpg','jpeg','gif','webp','pdf','txt','zip','mp4','mp3'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CHUNK_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 首页
@app.route("/")
def index():
    return render_template("index.html")

# 上传文件分片
@app.route("/upload_chunk", methods=["POST"])
def upload_chunk():
    file = request.files.get("file")
    filename = secure_filename(request.form.get("filename"))
    chunk = int(request.form.get("chunk"))
    total_chunks = int(request.form.get("total_chunks"))

    if not file or not filename:
        return "Missing file", 400
    if not allowed_file(filename):
        return "File type not allowed", 400

    temp_dir = os.path.join(CHUNK_FOLDER, filename)
    os.makedirs(temp_dir, exist_ok=True)
    chunk_path = os.path.join(temp_dir, f"{chunk}.part")
    file.save(chunk_path)
    return "OK", 200

# 合并文件块
@app.route("/merge_chunks", methods=["POST"])
def merge_chunks():
    data = request.get_json()
    filename = secure_filename(data.get("filename"))
    if not allowed_file(filename):
        return "File type not allowed", 400

    temp_dir = os.path.join(CHUNK_FOLDER, filename)
    output_path = os.path.join(UPLOAD_FOLDER, filename)

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
    return jsonify({"status": "merged"})

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
            is_image = ext in ['.png','.jpg','.jpeg','.gif','.webp']
            files_info.append({
                "name": f,
                "size": os.path.getsize(path),
                "is_image": is_image,
                "url": f"/uploads/{f}",
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

# 下载文件
@app.route("/uploads/<path:filename>")
def serve_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# 删除文件
@app.route("/delete_file", methods=["POST", "DELETE"])
def delete_file():
    filename = request.args.get("filename") or request.form.get("filename")
    path = os.path.join(UPLOAD_FOLDER, filename)
    print(path, flush=True)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"status": "deleted"})
    return jsonify({"error": "File not found"}), 404

# 获取已上传分片（断点续传支持）
@app.route("/uploaded_chunks", methods=["GET"])
def uploaded_chunks():
    filename = secure_filename(request.args.get("filename"))
    temp_dir = os.path.join(CHUNK_FOLDER, filename)
    if not os.path.exists(temp_dir):
        return jsonify({"chunks": []})
    chunks = [int(f.split(".")[0]) for f in os.listdir(temp_dir)]
    return jsonify({"chunks": chunks})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

