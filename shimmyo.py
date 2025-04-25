from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import base64

app = Flask(__name__)
# 必要なら全ルートで CORS を許可
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

API_KEY = "sk-Ar3bzqvbtM35fEJODgIGWJjHqXaN39y9uc5Q51VRoRIexIzO"
# 入力テキストを元にプロンプトを生成
def generate_image_prompt(input_text: str) -> str:
    if all('ぁ' <= ch <= 'ん' for ch in input_text):
        script_type = "ひらがな"
    elif all('ァ' <= ch <= 'ン' for ch in input_text):
        script_type = "カタカナ"
    elif all('\u4e00' <= ch <= '\u9fff' for ch in input_text):
        script_type = "漢字"
    elif all(ch.isascii() and ch.isalpha() for ch in input_text):
        script_type = "英語"
    else:
        script_type = "文字"

    return f'Input was in {script_type}: "{input_text}". Generating an image that represents "{input_text}".'


@app.route('/get_image', methods=['POST'])
def get_image():
    print("Received request to /get_image")
    data = request.json
    word = data.get("word")
    print(f"Received word: {word}")
    if not word:
        return jsonify({"error": "No word provided"}), 400

    prompt = generate_image_prompt(word)
    prompt = "car"

    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        headers={
            "authorization": f"Bearer {API_KEY}",
            "accept": "image/*"
        },
        files={"none": ''},
        data={
            "prompt": prompt,
            "output_format": "png",
        },
    )

    if response.status_code == 200:
        encoded_image = base64.b64encode(response.content).decode('utf-8')
        return jsonify({"image": encoded_image})
    else:
        return jsonify({"error": response.text}), response.status_code

if __name__ == '__main__':
    app.run(debug=True, port=5000)
