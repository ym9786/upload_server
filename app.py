from flask import Flask, request, jsonify, render_template
import os
import time
import shutil

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
CHUNK_FOLDER = os.path.join(UPLOAD_FOLDER, "chunks")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CHUNK_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/uploaded_chunks')
def uploaded_chunks():
    """返回已上传的分片索引列表"""
    filename = request.args.get('filename')
    chunk_dir = os.path.join(CHUNK_FOLDER, filename)
    if not os.path.exists(chunk_dir):
        return jsonify([])
    chunks = sorted(
        [int(f.split('.')[0]) for f in os.listdir(chunk_dir) if f.endswith('.part')]
    )
    return jsonify(chunks)

@app.route('/upload_chunk', methods=['POST'])
def upload_chunk():
    """接收单个分片"""
    file = request.files.get('file')
    filename = request.form.get('filename')
    chunk_index = request.form.get('chunkIndex')

    if not file or not filename or chunk_index is None:
        return "Invalid request", 400

    chunk_dir = os.path.join(CHUNK_FOLDER, filename)
    os.makedirs(chunk_dir, exist_ok=True)

    chunk_path = os.path.join(chunk_dir, f"{chunk_index}.part")
    file.save(chunk_path)
    print(f"✅ 接收分片 {chunk_index} -> {chunk_path}")
    return jsonify({"status": "ok"})

@app.route('/merge_chunks', methods=['POST'])
def merge_chunks():
    """合并所有分片"""
    data = request.json
    filename = data['filename']
    total_chunks = int(data['totalChunks'])
    chunk_dir = os.path.join(CHUNK_FOLDER, filename)
    final_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(chunk_dir):
        return "No chunks found", 400

    with open(final_path, 'wb') as outfile:
        for i in range(total_chunks):
            chunk_path = os.path.join(chunk_dir, f"{i}.part")
            if not os.path.exists(chunk_path):
                return f"Missing chunk {i}", 400
            with open(chunk_path, 'rb') as infile:
                shutil.copyfileobj(infile, outfile)

    # 清理临时分片目录
    shutil.rmtree(chunk_dir)
    print(f"✅ 文件合并完成：{final_path}")
    return jsonify({"status": "merged", "path": final_path})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
