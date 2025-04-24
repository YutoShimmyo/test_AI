from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import base64

app = Flask(__name__)
# 必要なら全ルートで CORS を許可
CORS(app)

@app.route('/')
def index():
    return render_template('shiritori/index.html')

API_KEY = "sk-yQ3k3LvX193SwaWw4kQvvVwHPnxfJcbpxzj1NWxReDDSdy9B"

@app.route('/generate-image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    response = requests.post(
        "https://api.stability.ai/v2beta/stable-image/generate/ultra",
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
