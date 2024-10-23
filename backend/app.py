from flask import Flask, request, jsonify, render_template, redirect, url_for, Response, stream_with_context
from werkzeug.utils import secure_filename
from byaldi import RAGMultiModalModel
import os
import base64
from dotenv import load_dotenv  
import json
import flask_cors

load_dotenv()

# Configure OpenAI client
import openai

openai.api_key = os.environ.get("OPENAI_AI_KEY")



# Directory where uploaded files will be stored
UPLOAD_FOLDER = 'docs/'
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

app = Flask(__name__)
flask_cors.CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize RAG model
global RAG

if os.path.exists("/home/hassan/scrum-ai-backend/backend/.byaldi/test"):
    print("Loading index from ./test")
    RAG = RAGMultiModalModel.from_index("test")
else:
    RAG = RAGMultiModalModel.from_pretrained("vidore/colpali-v1.2")
    # Build the index after loading the pretrained model
    RAG.index(
        index_name="test",
        input_path=UPLOAD_FOLDER,
        store_collection_with_index=True,
    )

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
            global RAG
            if not RAG:
                RAG = RAGMultiModalModel.from_pretrained("vidore/colpali-v1.2")
            RAG.add_to_index(
                input_item=save_path,
                store_collection_with_index=True,
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
    if not data or 'messages' not in data:
        return jsonify({'error': 'No messages provided'}), 400

    messages = data['messages']
    
    # Convert messages to GPT-4 Vision format
    openai_messages = []
    for msg in messages:
        if msg['role'] == 'user' and isinstance(msg['content'], list):
            openai_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        else:
            openai_messages.append({
                'role': msg['role'],
                'content': msg['content'] if isinstance(msg['content'], str) else msg['content'][0]['text']
            })

    def generate():
        try:
            stream = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=openai_messages,
                max_tokens=500,
                temperature=0.7,
                stream=True
            )

            for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if hasattr(delta, 'content') and delta.content:
                        # Send each token immediately
                        yield f"data: {delta.content}\n\n"
                    elif getattr(chunk.choices[0], 'finish_reason', None) == 'stop':
                        yield "data: [DONE]\n\n"
                        break

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return generate(), {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Type': 'text/event-stream'
    }

if __name__ == '__main__':
    app.run(debug=True)
