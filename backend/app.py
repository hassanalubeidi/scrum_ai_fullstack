from flask import Flask, request, jsonify, render_template, redirect, url_for
from werkzeug.utils import secure_filename
from byaldi import RAGMultiModalModel
import os
import base64

# Configure OpenAI client
import openai

openai.api_key = os.environ.get("OPENAI_AI_KEY")

# Initialize RAG model
RAG = RAGMultiModalModel.from_pretrained("vidore/colpali-v1.2")

# Directory where uploaded files will be stored
UPLOAD_FOLDER = 'docs/'
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def result_to_dict(result):
    return {
        "doc_id": getattr(result, "doc_id", None),
        "page_num": getattr(result, "page_num", None),
        "score": getattr(result, "score", None),
        "metadata": getattr(result, "metadata", {}),
        "base64": getattr(result, "base64", None)
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        try:
            # Re-index the documents
            RAG.index(
                input_path=UPLOAD_FOLDER,
                index_name="test",
                store_collection_with_index=True,
                overwrite=True
            )
            return jsonify({'success': 'File uploaded and indexed successfully'}), 200
        except Exception as e:
            return jsonify({'error': f'File uploaded but indexing failed: {str(e)}'}), 500
    else:
        return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/search')
def api_search():
    query = request.args.get('query', '')
    k = request.args.get('k', 3, type=int)
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    try:
        results = RAG.search(query, k=k)
        serializable_results = [result_to_dict(result) for result in results]
        return jsonify(serializable_results)
    except ValueError as e:
        if str(e) == "No passages provided":
            return jsonify({'error': 'No documents indexed. Please upload documents before searching.'}), 404
        else:
            return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.json
    if not data or 'message' not in data or 'images' not in data:
        return jsonify({'error': 'No message or images provided'}), 400
    
    prompt = data['message']
    images = data['images']
    img_type = "image/png"  # Assuming PNG format, adjust if needed
    
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
            ] + [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{img_type};base64,{img}"},
                } for img in images
            ],
        }
    ]
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=4000
    )
    
    ai_response = response.choices[0].message.content
    return jsonify({'response': ai_response})

if __name__ == '__main__':
    app.run(debug=True)
